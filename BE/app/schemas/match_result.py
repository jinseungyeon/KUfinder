from uuid import UUID

from pydantic import Field, field_validator

from app.schemas.common import CamelModel, Contact, normalized_optional_text


class MatchResultCreate(CamelModel):
    lost_item_id: UUID
    found_item_id: UUID
    score: float = Field(ge=0, le=1)
    reasons: list[str]
    question: str | None = Field(default=None, max_length=500)

    @field_validator("reasons")
    @classmethod
    def reasons_must_be_clean(cls, values: list[str]) -> list[str]:
        cleaned = [value.strip() for value in values if value.strip()]
        if len(cleaned) != len(values):
            raise ValueError("reasons에는 빈 문자열을 넣을 수 없습니다.")
        if any(len(value) > 200 for value in cleaned):
            raise ValueError("각 reason은 200자 이하여야 합니다.")
        return cleaned

    @field_validator("question")
    @classmethod
    def clean_question(cls, value: str | None) -> str | None:
        return normalized_optional_text(value)


class MatchResultUpdate(CamelModel):
    score: float | None = Field(default=None, ge=0, le=1)
    reasons: list[str] | None = None
    question: str | None = Field(default=None, max_length=500)


class MatchResultResponse(MatchResultCreate):
    pass


class GeneratedMatchesResponse(CamelModel):
    lost_item_id: UUID
    results: list[MatchResultResponse]


class GeneratedFoundMatchesResponse(CamelModel):
    found_item_id: UUID
    results: list[MatchResultResponse]


class ConfirmedMatchResponse(CamelModel):
    lost_item_id: UUID
    found_item_id: UUID
    lost_contact: Contact | None = None
    found_contact: Contact | None = None
    storage_place: str | None = None
