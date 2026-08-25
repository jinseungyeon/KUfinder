from datetime import datetime
from uuid import UUID

from pydantic import Field, field_validator

from app.core.enums import ItemCategory
from app.schemas.common import CamelModel, Contact, Location, normalized_optional_text


class LostItemCreate(CamelModel):
    category: ItemCategory
    description: str = Field(min_length=1, max_length=2000)
    image_url: str | None = Field(default=None, max_length=500)
    lost_location: Location
    lost_date: datetime
    contact: Contact | None = None

    @field_validator("description")
    @classmethod
    def description_must_not_be_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("description은 비어 있을 수 없습니다.")
        return value

    @field_validator("image_url")
    @classmethod
    def clean_optional_text(cls, value: str | None) -> str | None:
        return normalized_optional_text(value)


class LostItemUpdate(CamelModel):
    category: ItemCategory | None = None
    description: str | None = Field(default=None, min_length=1, max_length=2000)
    image_url: str | None = Field(default=None, max_length=500)
    lost_location: Location | None = None
    lost_date: datetime | None = None
    contact: Contact | None = None


class LostItemResponse(LostItemCreate):
    id: UUID
    created_at: datetime


class LostItemMapResponse(CamelModel):
    id: UUID
    category: ItemCategory
    lost_location: Location
    lost_date: datetime
