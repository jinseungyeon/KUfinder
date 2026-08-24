from datetime import UTC, datetime
from uuid import uuid4

import pytest
from pydantic import ValidationError

from app.schemas.found_item import FoundItemCreate, FoundItemResponse
from app.schemas.match_result import MatchResultCreate


def found_payload() -> dict:
    return {
        "category": "WALLET",
        "description": "검정색 지갑",
        "imageUrl": None,
        "foundLocation": {
            "name": "중앙광장",
            "latitude": 37.5894,
            "longitude": 127.0322,
        },
        "foundDate": datetime.now(UTC).isoformat(),
        "storagePlace": "중앙광장 경비실",
        "contact": {"public": False, "detail": "kakao: kufinder"},
    }


def test_camel_case_contract_round_trip() -> None:
    item = FoundItemCreate.model_validate(found_payload())
    response = FoundItemResponse(**item.model_dump(), id=uuid4(), created_at=datetime.now(UTC))
    dumped = response.model_dump(by_alias=True, mode="json")
    assert "createdAt" in dumped
    assert "foundLocation" in dumped
    assert dumped["contact"] == {"public": False, "detail": "kakao: kufinder"}


def test_required_found_fields_are_enforced() -> None:
    payload = found_payload()
    payload.pop("foundDate")
    with pytest.raises(ValidationError):
        FoundItemCreate.model_validate(payload)


def test_contact_is_optional_but_complete_when_present() -> None:
    payload = found_payload()
    payload.pop("contact")
    assert FoundItemCreate.model_validate(payload).contact is None

    payload["contact"] = {"public": True}
    with pytest.raises(ValidationError):
        FoundItemCreate.model_validate(payload)


def test_match_result_score_range() -> None:
    with pytest.raises(ValidationError):
        MatchResultCreate(
            lostItemId=uuid4(),
            foundItemId=uuid4(),
            score=1.2,
            reasons=[],
        )
