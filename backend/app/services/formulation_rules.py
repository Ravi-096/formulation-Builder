"""
Computational Chemistry & Formulation Rules Engine.
Uses RDKit for SMILES validation, functional group identification via SMARTS,
physicochemical property calculation, BCS class estimation, and formulation compatibility auditing.
"""

from typing import Dict, List, Optional, Tuple
from rdkit import Chem
from rdkit.Chem import Crippen, Descriptors, Lipinski

from app.models.excipient import Excipient
from app.schemas.formulation import (
    CompatibilityIssue,
    FormulationCreate,
    FormulationValidationResponse,
    PhysicochemicalProperties,
)

# ==============================================================================
# 1. SMARTS Functional Group & Reactive Substructure Patterns
# ==============================================================================
SMARTS_PATTERNS: Dict[str, Tuple[str, str, str]] = {
    "ester": (
        "[CX3](=O)[OX2H0][#6]",
        "Ester Group",
        "Prone to alkaline or acidic ester hydrolysis; sensitive to extreme pH (<4.0 or >8.0).",
    ),
    "primary_amine": (
        "[NX3;H2;!$(NC=O)]",
        "Primary Amine (Aliphatic/Aromatic)",
        "Highly prone to Maillard reaction with reducing sugars (e.g., Lactose) causing degradation and discoloration.",
    ),
    "secondary_amine": (
        "[NX3;H1;!$(NC=O)]",
        "Secondary Amine",
        "Potential nitrosation in presence of trace nitrites/nitrates forming nitrosamines.",
    ),
    "carboxylic_acid": (
        "[CX3](=O)[OX2H1]",
        "Carboxylic Acid",
        "Prone to precipitation at pH below pKa (~3.5-4.5) and insoluble salt formation with divalent cations (Mg²⁺, Ca²⁺).",
    ),
    "phenol": (
        "[OX2H][c]",
        "Phenolic Hydroxyl",
        "Susceptible to oxidative quinone-type degradation and metal-catalyzed oxidation; sensitive to peroxide traces.",
    ),
    "thiol": (
        "[SX2H]",
        "Thiol / Sulfhydryl",
        "Highly oxidizable to disulfides; sensitive to trace peroxides in polyoxyethylene excipients (PEGs, Polysorbates).",
    ),
    "aldehyde": (
        "[CX3H1](=O)[#6]",
        "Aldehyde Group",
        "Readily forms Schiff bases and covalent adducts with amine-containing excipients and buffers.",
    ),
    "beta_lactam": (
        "[NX3]1[CX3](=O)[CX4][CX4]1",
        "Beta-Lactam Ring",
        "Extremely acid- and base-labile ring structure; rapid degradation with nucleophilic excipients.",
    ),
    "quaternary_ammonium": (
        "[NX4+]",
        "Quaternary Ammonium (Cationic)",
        "May form insoluble ion-pair precipitates with anionic surfactants like Sodium Lauryl Sulfate.",
    ),
}


# ==============================================================================
# 2. Molecule Parsing & Physicochemical Calculation
# ==============================================================================
def parse_and_compute_properties(smiles: str) -> Tuple[Chem.Mol, PhysicochemicalProperties]:
    """
    Parse SMILES string into RDKit molecule and compute 2D physicochemical properties.
    Raises ValueError if SMILES is invalid or malformed.
    """
    mol = Chem.MolFromSmiles(smiles)
    if mol is None:
        raise ValueError(f"Malformed or invalid SMILES representation: '{smiles}'")

    mw = round(float(Descriptors.MolWt(mol)), 3)
    logp = round(float(Crippen.MolLogP(mol)), 3)
    tpsa = round(float(Descriptors.TPSA(mol)), 2)
    hbd = int(Lipinski.NumHDonors(mol))
    hba = int(Lipinski.NumHAcceptors(mol))
    rot_bonds = int(Lipinski.NumRotatableBonds(mol))
    aromatic_rings = int(Lipinski.NumAromaticRings(mol))
    formal_charge = int(Chem.GetFormalCharge(mol))
    heavy_atoms = int(mol.GetNumHeavyAtoms())
    fsp3 = round(float(Descriptors.FractionCSP3(mol)), 3)

    props = PhysicochemicalProperties(
        molecular_weight=mw,
        logp=logp,
        tpsa=tpsa,
        hbd=hbd,
        hba=hba,
        rotatable_bonds=rot_bonds,
        aromatic_rings=aromatic_rings,
        formal_charge=formal_charge,
        heavy_atom_count=heavy_atoms,
        fraction_csp3=fsp3,
    )
    return mol, props


def detect_functional_groups(mol: Chem.Mol) -> List[Tuple[str, str, str]]:
    """
    Identify reactive functional groups in the molecule via SMARTS substructure search.
    Returns list of (key, name, description).
    """
    detected = []
    for key, (smarts, name, desc) in SMARTS_PATTERNS.items():
        pattern = Chem.MolFromSmarts(smarts)
        if pattern and mol.HasSubstructMatch(pattern):
            detected.append((key, name, desc))
    return detected


def estimate_bcs_class(props: PhysicochemicalProperties) -> str:
    """
    Estimate Biopharmaceutics Classification System (BCS) category:
    - High Solubility: LogP <= 2.0 or MW <= 350 or (TPSA >= 60 and LogP <= 3.0)
    - High Permeability: LogP >= 1.2 and MW <= 500 and TPSA <= 140
    """
    is_high_sol = (props.logp <= 2.0) or (props.molecular_weight <= 350) or (props.tpsa >= 70 and props.logp <= 2.8)
    is_high_perm = (props.logp >= 1.2) and (props.molecular_weight <= 500) and (props.tpsa <= 140)

    if is_high_sol and is_high_perm:
        return "BCS Class I (High Solubility, High Permeability)"
    elif not is_high_sol and is_high_perm:
        return "BCS Class II (Low Solubility, High Permeability - Lipophilic)"
    elif is_high_sol and not is_high_perm:
        return "BCS Class III (High Solubility, Low Permeability)"
    else:
        return "BCS Class IV (Low Solubility, Low Permeability - Challenging)"


# ==============================================================================
# 3. Main Rule Engine & Compatibility Evaluator
# ==============================================================================
async def validate_formulation_rules(
    formulation: FormulationCreate,
    excipient_db_map: Optional[Dict[str, Excipient]] = None,
) -> FormulationValidationResponse:
    """
    Run full computational validation suite on a proposed drug formulation:
    1. SMILES Parsing & physicochemical descriptor derivation.
    2. Substructure detection for reactive groups.
    3. Excipient concentration boundary enforcement.
    4. Cross-incompatibility matrix auditing (Maillard, salt formation, oxidation).
    5. Delivery route physiological constraints (IV pH & solvents, tablet binding/disintegration).
    """
    flags: List[CompatibilityIssue] = []

    # 1. Parse SMILES & Compute Properties
    try:
        mol, props = parse_and_compute_properties(formulation.api_smiles)
    except ValueError as e:
        return FormulationValidationResponse(
            is_valid=False,
            total_excipient_concentration_pct=0.0,
            compatibility_flags=[
                CompatibilityIssue(
                    severity="critical",
                    source="SMILES Parser",
                    message=str(e),
                    code="INVALID_SMILES",
                )
            ],
            detected_api_functional_groups=[],
            bcs_solubility_flag="Unknown (Invalid Molecule)",
            physicochemical_properties=None,
        )

    # 2. Detect Functional Groups
    detected_groups = detect_functional_groups(mol)
    detected_group_keys = {g[0] for g in detected_groups}
    detected_group_names = [f"{g[1]}: {g[2]}" for g in detected_groups]

    # 3. BCS Classification
    bcs_flag = estimate_bcs_class(props)

    # 4. Fetch Excipients from DB if not provided
    if excipient_db_map is None:
        try:
            from sqlalchemy import select
            from app.database import AsyncSessionLocal
            async with AsyncSessionLocal() as session:
                stmt = select(Excipient)
                res = await session.execute(stmt)
                all_excipients = res.scalars().all()
                excipient_db_map = {e.name.lower(): e for e in all_excipients}
        except Exception:
            excipient_db_map = {}

    total_concentration = sum(item.concentration_pct for item in formulation.excipients)
    target_ph = formulation.target_ph if formulation.target_ph is not None else 7.0
    selected_excipient_names = {item.excipient_name.lower(): item.concentration_pct for item in formulation.excipients}

    # --------------------------------------------------------------------------
    # 5. Excipient Concentration & Individual pH Stability Rules
    # --------------------------------------------------------------------------
    for item in formulation.excipients:
        name_lower = item.excipient_name.lower()
        exc_doc = excipient_db_map.get(name_lower)

        if not exc_doc:
            # Fallback search by substring
            for k, v in excipient_db_map.items():
                if k in name_lower or name_lower in k:
                    exc_doc = v
                    break

        if exc_doc:
            # Max concentration check
            if item.concentration_pct > exc_doc.max_recommended_concentration_pct:
                severity = "critical" if item.concentration_pct > (exc_doc.max_recommended_concentration_pct * 1.5) else "warning"
                flags.append(
                    CompatibilityIssue(
                        severity=severity,
                        source=f"Excipient: {exc_doc.name}",
                        message=f"{exc_doc.name} concentration ({item.concentration_pct}%) exceeds max recommended limit of {exc_doc.max_recommended_concentration_pct}%.",
                        code="EXCIPIENT_CONCENTRATION_EXCEEDED",
                    )
                )

            # pH stability check of excipient
            if target_ph < exc_doc.ph_stability_min or target_ph > exc_doc.ph_stability_max:
                flags.append(
                    CompatibilityIssue(
                        severity="warning",
                        source=f"Excipient: {exc_doc.name}",
                        message=f"Target formulation pH {target_ph} is outside stability range [{exc_doc.ph_stability_min} - {exc_doc.ph_stability_max}] for {exc_doc.name}.",
                        code="EXCIPIENT_PH_OUT_OF_RANGE",
                    )
                )

    # --------------------------------------------------------------------------
    # 6. Chemical Incompatibility Cross-Referencing
    # --------------------------------------------------------------------------
    has_lactose = any("lactose" in name for name in selected_excipient_names)
    has_mg_stearate = any("magnesium stearate" in name for name in selected_excipient_names)
    has_peg_or_polysorbate = any(
        ("peg" in name or "polysorbate" in name or "tween" in name) for name in selected_excipient_names
    )
    has_citric_acid = any("citric acid" in name for name in selected_excipient_names)
    has_sls = any("sodium lauryl sulfate" in name or "sls" in name for name in selected_excipient_names)

    # Alert 1: Maillard Reaction (Lactose + Primary Amine)
    if has_lactose and "primary_amine" in detected_group_keys:
        flags.append(
            CompatibilityIssue(
                severity="critical",
                source="Incompatibility: Lactose & Primary Amine",
                message="Critical Maillard Reaction risk: Lactose contains a reducing sugar aldehyde that condenses with the API's primary amine, leading to rapid degradation and brown discoloration.",
                code="MAILLARD_REACTION_ALERT",
            )
        )

    # Alert 2: Magnesium Stearate with Carboxylic Acid / Acidic Drug
    if has_mg_stearate:
        mg_conc = next((conc for name, conc in selected_excipient_names.items() if "magnesium stearate" in name), 0.0)
        if mg_conc > 1.5:
            flags.append(
                CompatibilityIssue(
                    severity="warning",
                    source="Excipient: Magnesium Stearate",
                    message=f"High Magnesium Stearate concentration ({mg_conc}%) may cause tablet hydrophobicity, retarding dissolution and tablet hardness.",
                    code="HIGH_LUBRICANT_CONCENTRATION",
                )
            )

        if "carboxylic_acid" in detected_group_keys:
            flags.append(
                CompatibilityIssue(
                    severity="warning",
                    source="Incompatibility: Magnesium Stearate & Carboxylic Acid",
                    message="Divalent magnesium ions in Magnesium Stearate can react with API carboxylic acid groups to form insoluble magnesium carboxylate salts, potentially reducing dissolution rate.",
                    code="DIVALENT_SALT_PRECIPITATION",
                )
            )

    # Alert 3: Peroxide-sensitive API (Thiols / Phenols) + PEG / Polysorbate
    if has_peg_or_polysorbate and ("thiol" in detected_group_keys or "phenol" in detected_group_keys):
        flags.append(
            CompatibilityIssue(
                severity="warning",
                source="Incompatibility: Peroxides in Polyoxyethylenes",
                message="Polyoxyethylene excipients (PEGs, Polysorbate 80) contain residual peroxides that can induce oxidative degradation of thiol/phenol groups on the API. Consider adding an antioxidant (e.g. Tocopherol/Citric Acid).",
                code="OXIDATIVE_DEGRADATION_RISK",
            )
        )

    # Alert 4: Ester Hydrolysis at Extreme pH
    if "ester" in detected_group_keys:
        if target_ph < 4.5 or target_ph > 8.0:
            flags.append(
                CompatibilityIssue(
                    severity="warning",
                    source="API Stability: Ester Linkage",
                    message=f"Ester groups undergo accelerated acid/base-catalyzed hydrolysis at pH {target_ph}. Recommended formulation pH range for ester stability is 4.5 – 7.5.",
                    code="ESTER_HYDROLYSIS_RISK",
                )
            )

    # Alert 5: Carboxylic Acid Precipitation at Acidic pH
    if "carboxylic_acid" in detected_group_keys and target_ph < 4.0:
        flags.append(
            CompatibilityIssue(
                severity="warning",
                source="API Solubility: Carboxylic Acid",
                message=f"At target pH {target_ph} (below typical pKa ~4.2), the API carboxylic acid group will be predominantly unionized, increasing the risk of precipitation.",
                code="ACID_PRECIPITATION_RISK",
            )
        )

    # Alert 6: Quaternary Ammonium / Cationic API + Anionic Surfactant (SLS)
    if has_sls and "quaternary_ammonium" in detected_group_keys:
        flags.append(
            CompatibilityIssue(
                severity="critical",
                source="Incompatibility: Anionic Surfactant & Cationic API",
                message="Sodium Lauryl Sulfate (anionic) forms insoluble complex coacervates / precipitates with quaternary ammonium cationic APIs.",
                code="ION_PAIR_PRECIPITATION",
            )
        )

    # --------------------------------------------------------------------------
    # 7. Delivery Vehicle Physiological & Formulation Requirements
    # --------------------------------------------------------------------------
    vehicle = formulation.delivery_vehicle

    if vehicle == "iv_infusion":
        # Strict IV pH constraint (physiological compatibility 5.0 - 9.0)
        if target_ph < 5.0 or target_ph > 9.0:
            flags.append(
                CompatibilityIssue(
                    severity="critical",
                    source="Delivery Vehicle: IV Infusion",
                    message=f"Target pH {target_ph} is unacceptable for IV Infusion. Injectables must strictly maintain pH 5.0 – 9.0 to prevent vascular irritation, phlebitis, and tissue necrosis.",
                    code="IV_PH_VIOLATION",
                )
            )

        # Insoluble tablet binders not allowed in IV
        has_insoluble_filler = any(
            ("microcrystalline cellulose" in name or "croscarmellose" in name or "starch" in name)
            for name in selected_excipient_names
        )
        if has_insoluble_filler:
            flags.append(
                CompatibilityIssue(
                    severity="critical",
                    source="Delivery Vehicle: IV Infusion",
                    message="Insoluble solid excipients (e.g. Microcrystalline Cellulose, Croscarmellose) detected in IV formulation. Injectables must be completely particulate-free solutions or nano-emulsions.",
                    code="IV_PARTICULATE_HAZARD",
                )
            )

        # High organic cosolvent alert in IV
        ethanol_conc = next((conc for name, conc in selected_excipient_names.items() if "ethanol" in name), 0.0)
        if ethanol_conc > 10.0:
            flags.append(
                CompatibilityIssue(
                    severity="warning",
                    source="Delivery Vehicle: IV Infusion",
                    message=f"Ethanol concentration ({ethanol_conc}%) is high for IV infusion. Concentrations > 10% w/v increase risk of pain on injection and hemolysis.",
                    code="HIGH_IV_COSOLVENT",
                )
            )

    elif vehicle == "oral_tablet":
        # Check for presence of binder/filler
        has_filler_binder = any(
            ("cellulose" in name or "lactose" in name or "povidone" in name or "mannitol" in name or "hpmc" in name)
            for name in selected_excipient_names
        )
        if not has_filler_binder and len(formulation.excipients) > 0:
            flags.append(
                CompatibilityIssue(
                    severity="warning",
                    source="Delivery Vehicle: Oral Tablet",
                    message="Tablet formulation lacks a standard filler or binder (e.g. Microcrystalline Cellulose, Povidone, Mannitol) necessary for tablet compressibility.",
                    code="MISSING_TABLET_BINDER",
                )
            )

        # Check for disintegrant
        has_disintegrant = any(
            ("croscarmellose" in name or "starch glycolate" in name or "crospovidone" in name)
            for name in selected_excipient_names
        )
        if not has_disintegrant and len(formulation.excipients) > 1:
            flags.append(
                CompatibilityIssue(
                    severity="info",
                    source="Delivery Vehicle: Oral Tablet",
                    message="Consider including a superdisintegrant (e.g. Croscarmellose Sodium, Sodium Starch Glycolate) to facilitate rapid tablet breakdown in gastric fluid.",
                    code="NO_SUPERDISINTEGRANT",
                )
            )

    elif vehicle in ("nanoparticle_lipid", "liposome"):
        # Check for lipid components
        has_lipid = any(
            ("phospholip" in name or "lecithin" in name or "cholesterol" in name or "tpgs" in name)
            for name in selected_excipient_names
        )
        if not has_lipid:
            flags.append(
                CompatibilityIssue(
                    severity="warning",
                    source=f"Delivery Vehicle: {vehicle.replace('_', ' ').title()}",
                    message=f"{vehicle.replace('_', ' ').title()} delivery requires functional lipids or phospholipids (e.g. Phospholipon 90G, Cholesterol, Lecithin) to form bilayer vesicles.",
                    code="MISSING_LIPID_EXCIPIENT",
                )
            )

    # --------------------------------------------------------------------------
    # 8. Overall Validation Status
    # --------------------------------------------------------------------------
    is_valid = not any(f.severity == "critical" for f in flags)

    return FormulationValidationResponse(
        is_valid=is_valid,
        total_excipient_concentration_pct=round(total_concentration, 3),
        compatibility_flags=flags,
        detected_api_functional_groups=detected_group_names,
        bcs_solubility_flag=bcs_flag,
        physicochemical_properties=props,
    )
