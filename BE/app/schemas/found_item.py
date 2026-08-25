from datetime import datetime
from uuid import UUID

from pydantic import Field, field_validator

from app.core.enums import ItemCategory
from app.schemas.common import CamelModel, Contact, Location, normalized_optional_text


class FoundItemCreate(CamelModel):
    category: ItemCategory
    description: str = Field(min_length=1, max_length=2000)
    image_url: str | None = Field(default=None, max_length=500)
    found_location: Location
    found_date: datetime
    storage_place: str | None = Field(default=None, max_length=200)
    contact: Contact | None = None

    @field_validator("description")
    @classmethod
    def description_must_not_be_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("description은 비어 있을 수 없습니다.")
        return value

    @field_validator("image_url", "storage_place")
    @classmethod
    def clean_optional_text(cls, value: str | None) -> str | None:
        return normalized_optional_text(value)


class FoundItemUpdate(CamelModel):
    category: ItemCategory | None = None
    description: str | None = Field(default=None, min_length=1, max_length=2000)
    image_url: str | None = Field(default=None, max_length=500)
    found_location: Location | None = None
    found_date: datetime | None = None
    storage_place: str | None = Field(default=None, max_length=200)
    contact: Contact | None = None


class FoundItemResponse(FoundItemCreate):
    id: UUID
    created_at: datetime


class FoundItemMapResponse(CamelModel):
    id: UUID
    category: ItemCategory
    found_location: Location
    found_date: datetime
