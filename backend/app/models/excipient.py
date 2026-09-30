from datetime import datetime, timezone
import uuid
from typing import Optional
from sqlalchemy import DateTime, Float, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base


class Excipient(Base):
    __tablename__ = "excipients"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(150), unique=True, index=True, nullable=False)
    category: Mapped[str] = mapped_column(String(80), index=True, nullable=False)
    function: Mapped[str] = mapped_column(String(200), nullable=False)
    max_recommended_concentration_pct: Mapped[float] = mapped_column(Float, default=10.0)
    ph_stability_min: Mapped[float] = mapped_column(Float, default=4.0)
    ph_stability_max: Mapped[float] = mapped_column(Float, default=8.0)
    known_incompatibilities: Mapped[list] = mapped_column(JSON, default=list)
    molecular_weight: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    chemical_formula: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    cas_number: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )
