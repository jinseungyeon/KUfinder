from datetime import UTC, datetime, timedelta

from app.core.enums import ItemCategory
from app.db.models import FoundItem, LostItem
from app.services.matcher import score_pair


def make_lost_item(**overrides) -> LostItem:
    values = {
        "category": ItemCategory.WALLET.value,
        "description": "검정색 가죽 지갑 카드 두 장",
        "lost_location_name": "고려대학교 중앙광장",
        "lost_latitude": 37.5894,
        "lost_longitude": 127.0322,
        "lost_date": datetime.now(UTC),
    }
    values.update(overrides)
    return LostItem(**values)


def make_found_item(**overrides) -> FoundItem:
    values = {
        "category": ItemCategory.WALLET.value,
        "description": "검정색 가죽 지갑 카드 두 장",
        "found_location_name": "고려대학교 중앙광장",
        "found_latitude": 37.5894,
        "found_longitude": 127.0322,
        "found_date": datetime.now(UTC),
    }
    values.update(overrides)
    return FoundItem(**values)


def test_identical_pair_has_high_score_and_reasons() -> None:
    result = score_pair(make_lost_item(), make_found_item())
    assert result.score > 0.95
    assert result.question is None
    assert "카테고리가 동일함" in result.reasons
    assert any("검정색" in reason for reason in result.reasons)


def test_distant_old_different_item_has_lower_score_without_question() -> None:
    similar = score_pair(make_lost_item(), make_found_item())
    different = score_pair(
        make_lost_item(),
        make_found_item(
            category=ItemCategory.UMBRELLA.value,
            description="노란색 장우산",
            found_latitude=35.1796,
            found_longitude=129.0756,
            found_date=datetime.now(UTC) - timedelta(days=60),
        ),
    )
    assert different.score < similar.score
    assert different.question is None
