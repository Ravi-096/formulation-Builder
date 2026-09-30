from datetime import datetime, timezone
import uuid
from typing import Optional
from sqlalchemy import Boolean, DateTime, Float, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base


class Formulation(Base):
    __tablename__ = "formulations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[Optional[str]] = mapped_column(String(36), index=True, nullable=True)
    api_name: Mapped[str] = mapped_column(String(150), nullable=False)
    api_smiles: Mapped[str] = mapped_column(Text, nullable=False)
    delivery_vehicle: Mapped[str] = mapped_column(String(80), nullable=False)
    target_dose_mg: Mapped[float] = mapped_column(Float, default=100.0)
    target_ph: Mapped[float] = mapped_column(Float, default=7.0)
    animal_key: Mapped[Optional[str]] = mapped_column(String(50), default="rat")
    dose_mg_kg: Mapped[Optional[float]] = mapped_column(Float, default=20.0)
    excipients: Mapped[list] = mapped_column(JSON, default=list)
    validation_results: Mapped[dict] = mapped_column(JSON, default=dict)
    pk_simulation: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    is_valid: Mapped[bool] = mapped_column(Boolean, default=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
