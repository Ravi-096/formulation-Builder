"""
Virtual Pharmacokinetics (PK / ADME) Differential Equation Simulation Engine.
Uses SciPy's solve_ivp (RK45) to solve a 2-compartment open pharmacokinetic model
with first-order absorption (oral) and linear elimination across preclinical species.
"""

from typing import Any, Dict, List, Optional
import math
import numpy as np
from scipy.integrate import solve_ivp

# ==============================================================================
# 1. Preclinical Species Physiological Baselines
# ==============================================================================
# Reference body weight for allometric CL scaling (rat, 250 g)
_BW_REF_KG: float = 0.25

ANIMAL_PHYSIOLOGY: Dict[str, Dict[str, Any]] = {
    "mouse": {
        "name": "Mouse",
        "species": "Mus musculus",
        "body_weight_kg": 0.025,          # 25 g
        "blood_volume_ml": 2.0,            # 80 mL/kg
        "plasma_volume_ml": 1.2,           # 48 mL/kg
        "cardiac_output_ml_min": 14.0,     # mL/min
        "hepatic_flow_ml_min": 2.2,        # mL/min
        "gfr_ml_min": 0.25,               # Renal GFR mL/min
        "baseline_clearance_l_h_kg": 0.22, # L/h/kg (allometric reference)
        "km_bsa": 3,                       # FDA Km factor for HED
    },
    "rat": {
        "name": "Rat",
        "species": "Rattus norvegicus",
        "body_weight_kg": 0.25,            # 250 g
        "blood_volume_ml": 16.0,           # 64 mL/kg
        "plasma_volume_ml": 10.0,          # 40 mL/kg
        "cardiac_output_ml_min": 85.0,     # mL/min
        "hepatic_flow_ml_min": 14.0,       # mL/min
        "gfr_ml_min": 2.0,                # Renal GFR mL/min
        "baseline_clearance_l_h_kg": 0.35, # L/h/kg (allometric reference)
        "km_bsa": 6,                       # FDA Km factor for HED
    },
    "dog": {
        "name": "Beagle Dog",
        "species": "Canis familiaris",
        "body_weight_kg": 10.0,            # 10 kg
        "blood_volume_ml": 850.0,          # 85 mL/kg
        "plasma_volume_ml": 500.0,         # 50 mL/kg
        "cardiac_output_ml_min": 1500.0,   # mL/min
        "hepatic_flow_ml_min": 310.0,      # mL/min
        "gfr_ml_min": 35.0,               # Renal GFR mL/min
        "baseline_clearance_l_h_kg": 0.28, # L/h/kg (allometric reference)
        "km_bsa": 20,                      # FDA Km factor for HED
    },
    "monkey": {
        "name": "Cynomolgus Monkey",
        "species": "Macaca fascicularis",
        "body_weight_kg": 3.5,             # 3.5 kg
        "blood_volume_ml": 245.0,          # 70 mL/kg
        "plasma_volume_ml": 145.0,         # 41 mL/kg
        "cardiac_output_ml_min": 650.0,    # mL/min
        "hepatic_flow_ml_min": 125.0,      # mL/min
        "gfr_ml_min": 12.0,               # Renal GFR mL/min
        "baseline_clearance_l_h_kg": 0.40, # L/h/kg (allometric reference)
        "km_bsa": 12,                      # FDA Km factor for HED
    },
}


def calculate_pk_profile(
    api_props: Optional[Dict[str, Any]],
    bcs_class: str = "BCS Class II",
    delivery_vehicle: str = "oral_tablet",
    route: str = "oral",
    dose_mg_kg: float = 20.0,
    animal_key: str = "rat",
    excipients: Optional[List[Dict[str, Any]]] = None,
    hours: float = 48.0,
    num_points: int = 160,
) -> Dict[str, Any]:
    """
    Run 2-compartment pharmacokinetic differential equation ODE integration using SciPy.
    """
    if excipients is None:
        excipients = []

    animal = ANIMAL_PHYSIOLOGY.get(animal_key.lower(), ANIMAL_PHYSIOLOGY["rat"])
    bw = animal["body_weight_kg"]

    # 1. Total absolute dose administered (mg)
    total_dose_mg = float(dose_mg_kg) * bw

    # 2. Extract physicochemical parameters
    mw = float(api_props.get("molecular_weight", 300.0)) if api_props else 300.0
    logp = float(api_props.get("logp", 2.0)) if api_props else 2.0

    # 3. Volumes of distribution (Liters)
    # Spec: V1 = V_plasma × (1 + 0.5 × max(0, logP))  — tissue partitioning by lipophilicity
    v_plasma_l = animal["plasma_volume_ml"] / 1000.0
    v1 = max(v_plasma_l, v_plasma_l * (1.0 + 0.5 * max(0.0, logp)))  # Central compartment
    v2 = v1 * (1.5 + max(0.0, (logp - 1.0) * 0.25))                 # Peripheral tissue volume

    # 4. Systemic Clearance — FDA allometric power-law scaling: CL = CL_ref × (BW/BW_ref)^0.75
    # BW_ref = 0.25 kg (rat); exponent 0.75 follows Dedrick/Boxenbaum allometric convention.
    cl_ref_l_h = animal["baseline_clearance_l_h_kg"] * _BW_REF_KG
    cl = max(0.005, cl_ref_l_h * ((bw / _BW_REF_KG) ** 0.75))

    # 5. Rate Constants (1/h)
    k10 = cl / v1  # Elimination rate
    k12 = 0.45 + (0.25 if logp > 2.5 else 0.05)  # Central -> Peripheral
    k21 = (k12 * v1) / v2  # Peripheral -> Central

    # 6. Absorption Rate (ka) & Bioavailability (F)
    is_iv = (route.lower() == "iv") or (delivery_vehicle.lower() == "iv_infusion")

    if is_iv:
        ka = 0.0
        f_bio = 1.0
    else:
        # Route absorption kinetics
        if delivery_vehicle == "oral_solution":
            ka = 2.2
        elif delivery_vehicle == "oral_tablet":
            ka = 0.85
        elif delivery_vehicle in ["nanoparticle_lipid", "liposome"]:
            ka = 1.5
        else:
            ka = 1.0

        # BCS Class baseline bioavailability
        bcs_upper = bcs_class.upper()
        if "CLASS I" in bcs_upper:
            f_bio = 0.88
        elif "CLASS II" in bcs_upper:
            f_bio = 0.35
        elif "CLASS III" in bcs_upper:
            f_bio = 0.42
        elif "CLASS IV" in bcs_upper:
            f_bio = 0.18
        else:
            f_bio = 0.65

        # Boost from formulation excipients (e.g. TPGS, Polysorbate, SLS)
        excipient_boost = 0.0
        for exc in excipients:
            name = exc.get("excipient_name", "").lower()
            conc = float(exc.get("concentration_pct", 0.0))
            if any(k in name for k in ["tpgs", "polysorbate", "phospholipon", "lecithin"]):
                excipient_boost += min(0.20, conc * 0.025)
            elif any(k in name for k in ["sodium lauryl sulfate", "sls", "croscarmellose"]):
                excipient_boost += min(0.12, conc * 0.015)

        f_bio = min(0.98, max(0.10, f_bio + excipient_boost))

    # 7. Therapeutic Window thresholds (MEC & MTC in ug/mL)
    baseline_cp = (total_dose_mg * f_bio) / v1
    mec = max(0.5, round(baseline_cp * 0.22, 2))
    mtc = max(round(mec * 2.8, 2), round(baseline_cp * 1.65, 2))

    # ==========================================================================
    # 8. Differential Equation System (SciPy solve_ivp)
    # ==========================================================================
    # State Vector: y = [A_gut, A1, A2] (Amounts in mg)
    def pk_ode_system(t: float, y: List[float]) -> List[float]:
        a_gut, a1, a2 = y
        d_gut = 0.0 if is_iv else -ka * a_gut
        d_a1 = (0.0 if is_iv else ka * f_bio * a_gut) - (k10 + k12) * a1 + (k21 * a2)
        d_a2 = (k12 * a1) - (k21 * a2)
        return [d_gut, d_a1, d_a2]

    # Initial condition: y0
    y0 = [0.0, total_dose_mg, 0.0] if is_iv else [total_dose_mg, 0.0, 0.0]
    t_span = (0.0, float(hours))
    t_eval = np.linspace(0.0, float(hours), num_points)

    # Solve with RK45 (Runge-Kutta 4th/5th order)
    sol = solve_ivp(
        pk_ode_system,
        t_span,
        y0,
        t_eval=t_eval,
        method="RK45",
        rtol=1e-5,
        atol=1e-7,
    )

    # Extract concentrations: Cp = A1 / V1
    plasma_conc = np.maximum(0.0, sol.y[1] / v1)
    tissue_conc = np.maximum(0.0, sol.y[2] / v2)
    gut_remaining = np.maximum(0.0, sol.y[0])

    # Build time series
    time_series = []
    for idx, t_val in enumerate(sol.t):
        time_series.append(
            {
                "time": round(float(t_val), 2),
                "plasmaConc": round(float(plasma_conc[idx]), 3),
                "tissueConc": round(float(tissue_conc[idx]), 3),
                "gutRemaining": round(float(gut_remaining[idx]), 3),
                "mec": mec,
                "mtc": mtc,
            }
        )

    # 9. Compute Metrics
    c_max_idx = int(np.argmax(plasma_conc))
    c_max = round(float(plasma_conc[c_max_idx]), 2)
    t_max = round(float(sol.t[c_max_idx]), 2)

    # AUC using composite trapezoidal rule
    auc = round(float(np.trapezoid(plasma_conc, sol.t)), 1)

    # Terminal elimination rate constant (lambda_z) and half-life
    sum_k = k10 + k12 + k21
    discriminant = max(0.0, sum_k * sum_k - 4.0 * k10 * k21)
    lambda_z = 0.5 * (sum_k - math.sqrt(discriminant))
    t_half = round(math.log(2.0) / lambda_z if lambda_z > 0.0001 else math.log(2.0) / k10, 2)

    # Safety window metrics
    pts_in_window = sum(1 for p in time_series if mec <= p["plasmaConc"] <= mtc)
    pct_in_window = round((pts_in_window / len(time_series)) * 100)
    is_toxic = c_max > mtc
    is_subtherapeutic = c_max < mec

    # FDA Allometric Scaling (Human Equivalent Dose)
    human_km = 37
    animal_km = animal["km_bsa"]
    hed_mg_kg = round((float(dose_mg_kg) * animal_km) / human_km, 2)

    return {
        "timeSeries": time_series,
        "metrics": {
            "cMax": c_max,
            "tMax": t_max,
            "auc": auc,
            "tHalf": t_half,
            "bioavailabilityPct": round(f_bio * 100),
            "clearance": round(cl, 3),
            "volumeDistribution": round(v1, 3),
            "totalDoseMg": round(total_dose_mg, 2),
            "mec": mec,
            "mtc": mtc,
            "pctInWindow": pct_in_window,
            "isToxic": is_toxic,
            "isSubtherapeutic": is_subtherapeutic,
            "hedMgKg": hed_mg_kg,
        },
        "animalInfo": animal,
    }
