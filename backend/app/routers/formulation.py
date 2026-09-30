from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.excipient import Excipient
from app.models.formulation import Formulation
from app.models.user import User
from app.routers.auth import get_optional_current_user
from app.schemas.formulation import (
    ExcipientResponse,
    FormulationCreate,
    FormulationResponse,
    FormulationValidationResponse,
    PkSimulationRequest,
    PkSimulationResponse,
)
from app.services.formulation_rules import validate_formulation_rules
from app.services.pk_engine import calculate_pk_profile

router = APIRouter(prefix="/formulation", tags=["Formulation Builder"])


def format_excipient_response(exc: Excipient) -> ExcipientResponse:
    """Helper to convert Excipient SQLAlchemy model to ExcipientResponse schema."""
    return ExcipientResponse(
        id=str(exc.id),
        name=exc.name,
        category=exc.category,
        function=exc.function,
        max_recommended_concentration_pct=exc.max_recommended_concentration_pct,
        ph_stability_min=exc.ph_stability_min,
        ph_stability_max=exc.ph_stability_max,
        known_incompatibilities=exc.known_incompatibilities or [],
        molecular_weight=exc.molecular_weight,
        chemical_formula=exc.chemical_formula,
        cas_number=exc.cas_number,
        description=exc.description,
    )


def format_formulation_response(form: Formulation) -> FormulationResponse:
    """Helper to convert Formulation SQLAlchemy model to FormulationResponse schema."""
    return FormulationResponse(
        id=str(form.id),
        user_id=str(form.user_id) if form.user_id else None,
        api_name=form.api_name,
        api_smiles=form.api_smiles,
        delivery_vehicle=form.delivery_vehicle,
        target_dose_mg=form.target_dose_mg,
        target_ph=form.target_ph,
        animal_key=form.animal_key,
        dose_mg_kg=form.dose_mg_kg,
        excipients=form.excipients or [],
        validation_results=FormulationValidationResponse(**form.validation_results),
        pk_simulation=form.pk_simulation,
        is_valid=form.is_valid,
        notes=form.notes,
        created_at=form.created_at,
        updated_at=form.updated_at,
    )


@router.get(
    "/excipients",
    response_model=List[ExcipientResponse],
    summary="List available pharmaceutical excipients from MySQL",
)
async def list_excipients(
    category: Optional[str] = Query(
        None,
        description="Filter by category (e.g. binder, surfactant, solvent, disintegrant, lipid, buffer, filler, lubricant)",
    ),
    db: AsyncSession = Depends(get_db),
):
    """Returns list of pharmaceutical excipients stored in local MySQL."""
    stmt = select(Excipient)
    if category and category.lower() != "all":
        stmt = stmt.where(Excipient.category == category.lower().strip())
    
    stmt = stmt.order_by(Excipient.name)
    res = await db.execute(stmt)
    excipients = res.scalars().all()

    return [format_excipient_response(e) for e in excipients]


@router.post(
    "/validate",
    response_model=FormulationValidationResponse,
    summary="Evaluate computational chemistry and compatibility rules without persisting",
)
async def validate_formulation(
    formulation_data: FormulationCreate,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Runs the RDKit-based computational chemistry & formulation rule engine:
    - Parses and validates API SMILES string
    - Derives 2D physicochemical properties (MW, LogP, TPSA, HBD, HBA)
    - Estimates BCS Classification (Class I - IV)
    - Detects reactive functional groups via SMARTS (esters, primary amines, thiols, phenols, carboxylic acids)
    - Checks excipient concentration thresholds
    - Cross-references chemical incompatibility matrix
    """
    try:
        validation_result = await validate_formulation_rules(formulation_data)
        return validation_result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Formulation validation failed: {str(e)}",
        )


@router.post(
    "/simulate-pk",
    response_model=PkSimulationResponse,
    summary="Run differential equation 2-compartment pharmacokinetic simulation via SciPy ODE solver",
)
async def simulate_pharmacokinetics(
    sim_data: PkSimulationRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Runs the 2-compartment pharmacokinetic ODE differential equations solver using SciPy solve_ivp:
    - Simulates in-vivo drug disposition across preclinical animal models (Mouse, Rat, Dog, Monkey)
    - Solves dA_gut/dt, dA1/dt, dA2/dt over 24-48 hours
    - Computes Cmax, Tmax, AUC, elimination half-life (t1/2), and therapeutic window thresholds
    """
    # 1. Derive or use physicochemical properties
    props = sim_data.physicochemical_properties
    bcs_class = sim_data.bcs_class or "BCS Class II"

    if not props and sim_data.api_smiles:
        try:
            formulation_proxy = FormulationCreate(
                api_name=sim_data.api_name or "Compound",
                api_smiles=sim_data.api_smiles,
                delivery_vehicle=sim_data.delivery_vehicle or "oral_tablet",
                target_dose_mg=50.0,
                excipients=sim_data.excipients,
            )
            val = await validate_formulation_rules(formulation_proxy)
            if val.physicochemical_properties:
                props = val.physicochemical_properties.model_dump()
            bcs_class = val.bcs_solubility_flag
        except Exception:
            props = None

    # 2. Run SciPy ODE integration
    try:
        excipients_list = [item.model_dump() for item in sim_data.excipients]
        result = calculate_pk_profile(
            api_props=props,
            bcs_class=bcs_class,
            delivery_vehicle=sim_data.delivery_vehicle or "oral_tablet",
            route=sim_data.route or "oral",
            dose_mg_kg=sim_data.dose_mg_kg,
            animal_key=sim_data.animal_key,
            excipients=excipients_list,
            hours=sim_data.hours,
        )
        return PkSimulationResponse(**result)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"PK ODE Simulation failed: {str(e)}",
        )


@router.post(
    "/save",
    response_model=FormulationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Validate and save a drug formulation to MySQL",
)
async def save_formulation(
    formulation_data: FormulationCreate,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Persists the validated formulation and simulated PK profile to MySQL.
    """
    validation_result = await validate_formulation_rules(formulation_data)

    # Convert excipients list to dictionary records
    excipients_records = [item.model_dump() for item in formulation_data.excipients]

    # Run PK simulation if not already provided
    pk_results = formulation_data.pk_simulation
    if not pk_results:
        try:
            route = "iv" if formulation_data.delivery_vehicle == "iv_infusion" else "oral"
            pk_results = calculate_pk_profile(
                api_props=validation_result.physicochemical_properties.model_dump()
                if validation_result.physicochemical_properties
                else None,
                bcs_class=validation_result.bcs_solubility_flag,
                delivery_vehicle=formulation_data.delivery_vehicle,
                route=route,
                dose_mg_kg=formulation_data.dose_mg_kg or 20.0,
                animal_key=formulation_data.animal_key or "rat",
                excipients=excipients_records,
            )
        except Exception:
            pk_results = None

    new_formulation = Formulation(
        user_id=current_user.id if current_user else "usr_01",
        api_name=formulation_data.api_name,
        api_smiles=formulation_data.api_smiles,
        delivery_vehicle=formulation_data.delivery_vehicle,
        target_dose_mg=formulation_data.target_dose_mg,
        target_ph=formulation_data.target_ph if formulation_data.target_ph is not None else 7.0,
        animal_key=formulation_data.animal_key or "rat",
        dose_mg_kg=formulation_data.dose_mg_kg or 20.0,
        excipients=excipients_records,
        validation_results=validation_result.model_dump(),
        pk_simulation=pk_results,
        is_valid=validation_result.is_valid,
        notes=formulation_data.notes,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )

    db.add(new_formulation)
    await db.commit()
    await db.refresh(new_formulation)

    return format_formulation_response(new_formulation)


@router.get(
    "/my-formulations",
    response_model=List[FormulationResponse],
    summary="Retrieve all saved formulations from MySQL",
)
async def get_my_formulations(
    user_id: Optional[str] = Query(None, description="Filter formulations by user ID"),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Returns saved formulations stored in local MySQL."""
    stmt = select(Formulation)
    if user_id:
        stmt = stmt.where(Formulation.user_id == user_id)
    stmt = stmt.order_by(desc(Formulation.created_at))
    res = await db.execute(stmt)
    formulations = res.scalars().all()
    return [format_formulation_response(f) for f in formulations]


@router.get(
    "/{formulation_id}",
    response_model=FormulationResponse,
    summary="Retrieve a specific formulation by ID from MySQL",
)
async def get_formulation(
    formulation_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Returns a single formulation by ID."""
    stmt = select(Formulation).where(Formulation.id == formulation_id)
    res = await db.execute(stmt)
    formulation = res.scalar_one_or_none()

    if not formulation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Formulation not found.",
        )

    return format_formulation_response(formulation)


@router.delete(
    "/{formulation_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete a formulation by ID from MySQL",
)
async def delete_formulation(
    formulation_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Deletes a formulation by ID from MySQL."""
    stmt = select(Formulation).where(Formulation.id == formulation_id)
    res = await db.execute(stmt)
    formulation = res.scalar_one_or_none()

    if not formulation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Formulation not found.",
        )

    await db.delete(formulation)
    await db.commit()

    return {
        "success": True,
        "message": f"Formulation '{formulation.api_name}' ({formulation_id}) deleted successfully.",
    }
