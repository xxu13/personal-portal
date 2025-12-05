"""
SQLAlchemy Base class for all models.
"""
from datetime import datetime
from typing import Any

from sqlalchemy import MetaData
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy.sql import func


# Naming convention for constraints
convention = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""
    
    metadata = MetaData(naming_convention=convention)
    
    # Common columns for all models (optional, can be overridden)
    id: Any
    
    def __repr__(self) -> str:
        """String representation of the model."""
        columns = ", ".join(
            f"{col.name}={getattr(self, col.name)!r}"
            for col in self.__table__.columns
            if col.name in ("id", "name", "title", "username", "email")
        )
        return f"<{self.__class__.__name__}({columns})>"


class TimestampMixin:
    """Mixin that adds created_at and updated_at columns."""
    
    created_at: Mapped[datetime] = mapped_column(
        default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

