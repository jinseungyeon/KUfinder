import uuid
from datetime import datetime

from sqlalchemy import (
    ARRAY,
    Boolean,
    CheckConstraint,
    DateTime,
    Float,
    ForeignKey,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class FoundItem(Base):
    __tablename__ = "found_items"
    __table_args__ = (
        CheckConstraint("found_latitude BETWEEN -90 AND 90", name="ck_found_items_latitude"),
        CheckConstraint("found_longitude BETWEEN -180 AND 180", name="ck_found_items_longitude"),
        CheckConstraint(
            "(contact_public IS NULL AND contact_detail IS NULL) OR "
            "(contact_public IS NOT NULL AND contact_detail IS NOT NULL)",
            name="ck_found_items_contact_pair",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    category: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    found_location_name: Mapped[str] = mapped_column(String(120), nullable=False)
    found_latitude: Mapped[float] = mapped_column(Float, nullable=False)
    found_longitude: Mapped[float] = mapped_column(Float, nullable=False)
    found_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True
    )
    storage_place: Mapped[str | None] = mapped_column(String(200), nullable=True)
    contact_public: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    contact_detail: Mapped[str | None] = mapped_column(String(300), nullable=True)

    match_results: Mapped[list["MatchResult"]] = relationship(
        back_populates="found_item", cascade="all, delete-orphan"
    )


class LostItem(Base):
    __tablename__ = "lost_items"
    __table_args__ = (
        CheckConstraint("lost_latitude BETWEEN -90 AND 90", name="ck_lost_items_latitude"),
        CheckConstraint("lost_longitude BETWEEN -180 AND 180", name="ck_lost_items_longitude"),
        CheckConstraint(
            "(contact_public IS NULL AND contact_detail IS NULL) OR "
            "(contact_public IS NOT NULL AND contact_detail IS NOT NULL)",
            name="ck_lost_items_contact_pair",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    category: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    lost_location_name: Mapped[str] = mapped_column(String(120), nullable=False)
    lost_latitude: Mapped[float] = mapped_column(Float, nullable=False)
    lost_longitude: Mapped[float] = mapped_column(Float, nullable=False)
    lost_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    contact_public: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    contact_detail: Mapped[str | None] = mapped_column(String(300), nullable=True)

    match_results: Mapped[list["MatchResult"]] = relationship(
        back_populates="lost_item", cascade="all, delete-orphan"
    )


class MatchResult(Base):
    __tablename__ = "match_results"
    __table_args__ = (CheckConstraint("score BETWEEN 0 AND 1", name="ck_match_results_score"),)

    lost_item_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("lost_items.id", ondelete="CASCADE"),
        primary_key=True,
    )
    found_item_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("found_items.id", ondelete="CASCADE"),
        primary_key=True,
    )
    score: Mapped[float] = mapped_column(Float, nullable=False, index=True)
    reasons: Mapped[list[str]] = mapped_column(
        ARRAY(String(200)), nullable=False, default=list, server_default="{}"
    )
    question: Mapped[str | None] = mapped_column(String(500), nullable=True)

    lost_item: Mapped[LostItem] = relationship(back_populates="match_results")
    found_item: Mapped[FoundItem] = relationship(back_populates="match_results")
