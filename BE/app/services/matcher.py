import math
import re
from dataclasses import dataclass
from datetime import UTC

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.enums import ItemCategory
from app.db.models import FoundItem, LostItem, MatchResult
from app.services.vlm_retriever import (
    cosine_similarity,
    get_image_embedding,
    get_text_embedding,
)

TOKEN_PATTERN = re.compile(r"[0-9A-Za-z가-힣]+")
STOP_WORDS = {"분실", "습득", "물건", "있어요", "입니다", "같아요"}


@dataclass(frozen=True)
class MatchScore:
    score: float
    reasons: list[str]
    question: str | None


def _tokens(text: str) -> set[str]:
    return {
        token.lower()
        for token in TOKEN_PATTERN.findall(text)
        if len(token) > 1 and token not in STOP_WORDS
    }


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    radius = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    value = (
        math.sin(delta_phi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2) ** 2
    )
    return radius * 2 * math.atan2(math.sqrt(value), math.sqrt(1 - value))


def _question_for(category: str) -> str:
    questions = {
        ItemCategory.WALLET.value: "지갑에 작은 스티커나 장식, 눈에 띄는 흠집이 있었나요?",
        ItemCategory.PHONE.value: "휴대폰 케이스의 색상이나 장식은 무엇이었나요?",
        ItemCategory.ELECTRONICS.value: "제품의 브랜드나 모델명, 흠집 위치를 기억하시나요?",
        ItemCategory.CARD.value: "카드 앞면의 주된 색상이나 카드 종류는 무엇인가요?",
        ItemCategory.KEY.value: "키링의 모양이나 열쇠 개수를 기억하시나요?",
        ItemCategory.BAG.value: "가방의 브랜드, 로고 또는 손잡이 모양을 기억하시나요?",
        ItemCategory.CLOTHING.value: "옷의 사이즈, 로고 또는 특별한 무늬가 있었나요?",
        ItemCategory.UMBRELLA.value: "우산 손잡이 모양이나 무늬를 기억하시나요?",
    }
    return questions.get(category, "물건에 작은 스티커, 장식 또는 눈에 띄는 흠집이 있었나요?")


def score_pair(lost: LostItem, found: FoundItem) -> MatchScore:
    reasons: list[str] = []

    category_score = 1.0 if lost.category == found.category else 0.0
    if category_score == 1:
        reasons.append("카테고리가 동일함")

    lost_tokens = _tokens(lost.description)
    found_tokens = _tokens(found.description)
    common_tokens = sorted(lost_tokens & found_tokens)
    union_tokens = lost_tokens | found_tokens
    text_score = len(common_tokens) / len(union_tokens) if union_tokens else 0.0
    if common_tokens:
        preview = "', '".join(common_tokens[:3])
        reasons.append(f"'{preview}' 특징이 유사함")

    distance_km = _haversine_km(
        lost.lost_latitude,
        lost.lost_longitude,
        found.found_latitude,
        found.found_longitude,
    )
    location_score = math.exp(-distance_km / 1.5)
    if distance_km <= 0.5:
        reasons.append(f"등록 장소가 약 {round(distance_km * 1000)}m로 가까움")

    lost_date = lost.lost_date
    found_date = found.found_date
    if lost_date.tzinfo is None:
        lost_date = lost_date.replace(tzinfo=UTC)
    if found_date.tzinfo is None:
        found_date = found_date.replace(tzinfo=UTC)
    days = abs((lost_date - found_date).total_seconds()) / 86400
    date_score = math.exp(-days / 7)
    if days <= 1:
        reasons.append("분실일과 습득일이 하루 이내로 가까움")

    score = category_score * 0.35 + text_score * 0.35 + location_score * 0.20 + date_score * 0.10
    score = max(0.0, min(1.0, score))
    return MatchScore(score=score, reasons=reasons, question=None)


async def score_pair_with_vlm(db: AsyncSession, lost: LostItem, found: FoundItem) -> MatchScore:
    settings = get_settings()
    base = score_pair(lost, found)
    if not settings.vlm_enabled:
        return base

    lost_image_embedding = await get_image_embedding(db, lost.image_url)
    found_image_embedding = await get_image_embedding(db, found.image_url)
    lost_text_embedding = await get_text_embedding(db, lost.description)
    found_text_embedding = await get_text_embedding(db, found.description)

    weighted_scores: list[tuple[float, float]] = []
    image_score = cosine_similarity(lost_image_embedding, found_image_embedding)
    lost_text_to_found_image_score = cosine_similarity(lost_text_embedding, found_image_embedding)
    found_text_to_lost_image_score = cosine_similarity(found_text_embedding, lost_image_embedding)

    if image_score is not None:
        weighted_scores.append((image_score, 0.60))
    if lost_text_to_found_image_score is not None:
        weighted_scores.append((lost_text_to_found_image_score, 0.25))
    if found_text_to_lost_image_score is not None:
        weighted_scores.append((found_text_to_lost_image_score, 0.15))
    if not weighted_scores:
        return base

    total_weight = sum(weight for _, weight in weighted_scores)
    vlm_score = sum(score * weight for score, weight in weighted_scores) / total_weight
    normalized_vlm_score = (vlm_score + 1) / 2
    score = (
        base.score * (1 - settings.vlm_score_weight)
        + normalized_vlm_score * settings.vlm_score_weight
    )
    reasons = list(base.reasons)
    if normalized_vlm_score >= settings.vlm_reason_threshold:
        reasons.append("이미지 특징이 유사함")
    return MatchScore(
        score=max(0.0, min(1.0, score)),
        reasons=reasons,
        question=None if score >= settings.high_confidence_threshold else base.question,
    )


async def generate_match_results(db: AsyncSession, lost: LostItem) -> list[MatchResult]:
    settings = get_settings()
    await db.execute(delete(MatchResult).where(MatchResult.lost_item_id == lost.id))
    found_items = list(
        (
            await db.scalars(
                select(FoundItem)
                .order_by(FoundItem.found_date.desc())
                .limit(settings.match_candidate_limit)
            )
        ).all()
    )

    scored_pairs = []
    for found in found_items:
        scored_pairs.append((found, await score_pair_with_vlm(db, lost, found)))

    ranked = sorted(scored_pairs, key=lambda pair: pair[1].score, reverse=True)
    results: list[MatchResult] = []
    for found, match_score in ranked:
        if match_score.score < settings.minimum_match_score:
            continue
        result = MatchResult(
            lost_item_id=lost.id,
            found_item_id=found.id,
            score=match_score.score,
            reasons=match_score.reasons,
            question=match_score.question,
        )
        db.add(result)
        results.append(result)
        if len(results) >= settings.match_result_limit:
            break

    await db.flush()
    return results


async def generate_match_results_for_found(db: AsyncSession, found: FoundItem) -> list[MatchResult]:
    settings = get_settings()
    await db.execute(delete(MatchResult).where(MatchResult.found_item_id == found.id))
    lost_items = list(
        (
            await db.scalars(
                select(LostItem)
                .order_by(LostItem.lost_date.desc())
                .limit(settings.match_candidate_limit)
            )
        ).all()
    )

    scored_pairs = []
    for lost in lost_items:
        scored_pairs.append((lost, await score_pair_with_vlm(db, lost, found)))

    ranked = sorted(scored_pairs, key=lambda pair: pair[1].score, reverse=True)
    results: list[MatchResult] = []
    for lost, match_score in ranked:
        if match_score.score < settings.minimum_match_score:
            continue
        result = MatchResult(
            lost_item_id=lost.id,
            found_item_id=found.id,
            score=match_score.score,
            reasons=match_score.reasons,
            question=match_score.question,
        )
        db.add(result)
        results.append(result)
        if len(results) >= settings.match_result_limit:
            break

    await db.flush()
    return results
