from datetime import datetime
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field, field_validator

DeliveryVehicleType = Literal[
    "oral_tablet",
    "oral_solution",
    "iv_infusion",
    "nanoparticle_lipid",
    "liposome",
]


class ExcipientSelectionItem(BaseModel):
    """Selection of an excipient with its percentage concentration."""
    excipient_name: str = Field(..., min_length=1, max_length=120)
    concentration_pct: float = Field(
        ...,
        gt=0.0,
        le=100.0,
        description="Target concentration percentage (% w/w or % w/v)",
    )


class ExcipientResponse(BaseModel):
    """Public details of an excipient."""
    id: str
    name: str
    category: str
    function: str
    max_recommended_concentration_pct: float
    ph_stability_min: float
    ph_stability_max: float
    known_incompatibilities: List[str] = []
    molecular_weight: Optional[float] = None
    chemical_formula: Optional[str] = None
    cas_number: Optional[str] = None
    description: Optional[str] = None


class CompatibilityIssue(BaseModel):
    """Structure for compatibility alerts, warnings, and violations."""
    severity: Literal["critical", "warning", "info"]
    source: str = Field(..., description="Component or rule producing the alert")
    message: str
    code: Optional[str] = None


class PhysicochemicalProperties(BaseModel):
    """Computed physicochemical properties from RDKit."""
    molecular_weight: float
    logp: float
    tpsa: float
    hbd: int
    hba: int
    rotatable_bonds: int
    aromatic_rings: int
    formal_charge: int
    heavy_atom_count: int
    fraction_csp3: float


class FormulationValidationResponse(BaseModel):
    """Response containing computational chemistry validation and rule analysis."""
    is_valid: bool = True
    total_excipient_concentration_pct: float = 0.0
    compatibility_flags: List[CompatibilityIssue] = []
    detected_api_functional_groups: List[str] = []
    bcs_solubility_flag: str = "BCS Class I"
    physicochemical_properties: Optional[PhysicochemicalProperties] = None


class PkSimulationRequest(BaseModel):
    """Request payload for running differential equation PK/ADME simulation."""
    api_name: Optional[str] = "Compound"
    api_smiles: Optional[str] = None
    delivery_vehicle: Optional[str] = "oral_tablet"
    route: Optional[str] = "oral"
    dose_mg_kg: float = Field(default=20.0, gt=0.0)
    animal_key: str = Field(default="rat")
    hours: float = Field(default=48.0, ge=1.0, le=168.0)
    excipients: List[ExcipientSelectionItem] = Field(default_factory=list)
    physicochemical_properties: Optional[Dict[str, Any]] = None
    bcs_class: Optional[str] = "BCS Class II"


class PkSimulationResponse(BaseModel):
    """Full 2-compartment pharmacokinetic simulation response from SciPy."""
    timeSeries: List[Dict[str, Any]]
    metrics: Dict[str, Any]
    animalInfo: Dict[str, Any]


class FormulationCreate(BaseModel):
    """Request schema for creating and evaluating a drug formulation."""
    api_name: str = Field(..., min_length=1, max_length=150, description="Name of Active Pharmaceutical Ingredient")
    api_smiles: str = Field(..., min_length=1, max_length=1000, description="Valid canonical/isomeric SMILES string")
    delivery_vehicle: DeliveryVehicleType = Field(
        ...,
        description="Delivery route: oral_tablet, oral_solution, iv_infusion, nanoparticle_lipid, liposome",
    )
    target_dose_mg: float = Field(default=100.0, gt=0.0, description="Target dose in milligrams")
    target_ph: Optional[float] = Field(default=7.0, ge=0.0, le=14.0, description="Target formulation pH")
    animal_key: Optional[str] = "rat"
    dose_mg_kg: Optional[float] = 20.0
    excipients: List[ExcipientSelectionItem] = Field(
        default_factory=list,
        description="List of selected excipients and concentrations",
    )
    pk_simulation: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None

    @field_validator("api_smiles")
    @classmethod
    def clean_smiles(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("API SMILES string cannot be empty.")
        return v


class FormulationResponse(BaseModel):
    """Saved formulation schema returned from MySQL."""
    id: str
    user_id: Optional[str] = None
    api_name: str
    api_smiles: str
    delivery_vehicle: str
    target_dose_mg: float
    target_ph: float
    animal_key: Optional[str] = "rat"
    dose_mg_kg: Optional[float] = 20.0
    excipients: List[Dict[str, Any]]
    validation_results: FormulationValidationResponse
    pk_simulation: Optional[Dict[str, Any]] = None
    is_valid: bool
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
