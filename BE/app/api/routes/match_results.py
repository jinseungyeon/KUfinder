import uuid
from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import select

from app.api.deps import DBSession
from app.db.models import FoundItem, LostItem, MatchResult
from app.schemas.match_result import (
    GeneratedMatchesResponse,
    MatchResultCreate,
    MatchResultResponse,
    MatchResultUpdate,
)
from app.services.matcher import generate_match_results

router = APIRouter()


def _to_response(result: MatchResult) -> MatchResultResponse:
    return MatchResultResponse(
        lost_item_id=result.lost_item_id,
        found_item_id=result.found_item_id,
        score=result.score,
        reasons=result.reasons,
        question=result.question,
    )


async def _require_items(db: DBSession, lost_item_id: uuid.UUID, found_item_id: uuid.UUID) -> None:
    if await db.get(LostItem, lost_item_id) is None:
        raise HTTPException(status_code=404, detail="분실물 정보를 찾을 수 없습니다.")
    if await db.get(FoundItem, found_item_id) is None:
        raise HTTPException(status_code=404, detail="습득물 정보를 찾을 수 없습니다.")


@router.post("", response_model=MatchResultResponse, status_code=status.HTTP_201_CREATED)
async def create_match_result(payload: MatchResultCreate, db: DBSession) -> MatchResultResponse:
    await _require_items(db, payload.lost_item_id, payload.found_item_id)
    existing = await db.get(MatchResult, (payload.lost_item_id, payload.found_item_id))
    if existing is not None:
        raise HTTPException(status_code=409, detail="이미 존재하는 매칭 결과입니다.")
    result = MatchResult(
        lost_item_id=payload.lost_item_id,
        found_item_id=payload.found_item_id,
        score=payload.score,
        reasons=payload.reasons,
        question=payload.question,
    )
    db.add(result)
    await db.commit()
    await db.refresh(result)
    return _to_response(result)


@router.get("", response_model=list[MatchResultResponse])
async def list_match_results(
    db: DBSession,
    lost_item_id: Annotated[uuid.UUID | None, Query(alias="lostItemId")] = None,
    minimum_score: Annotated[float, Query(alias="minimumScore", ge=0, le=1)] = 0,
) -> list[MatchResultResponse]:
    statement = select(MatchResult).where(MatchResult.score >= minimum_score)
    if lost_item_id:
        statement = statement.where(MatchResult.lost_item_id == lost_item_id)
    statement = statement.order_by(MatchResult.score.desc()).limit(100)
    return [_to_response(result) for result in (await db.scalars(statement)).all()]


@router.post("/generate/{lost_item_id}", response_model=GeneratedMatchesResponse)
async def generate_for_lost_item(
    lost_item_id: uuid.UUID, db: DBSession
) -> GeneratedMatchesResponse:
    lost = await db.get(LostItem, lost_item_id)
    if lost is None:
        raise HTTPException(status_code=404, detail="분실물 정보를 찾을 수 없습니다.")
    results = await generate_match_results(db, lost)
    await db.commit()
    return GeneratedMatchesResponse(
        lost_item_id=lost.id,
        results=[_to_response(result) for result in results],
    )


@router.get("/{lost_item_id}/{found_item_id}", response_model=MatchResultResponse)
async def get_match_result(
    lost_item_id: uuid.UUID, found_item_id: uuid.UUID, db: DBSession
) -> MatchResultResponse:
    result = await db.get(MatchResult, (lost_item_id, found_item_id))
    if result is None:
        raise HTTPException(status_code=404, detail="매칭 결과를 찾을 수 없습니다.")
    return _to_response(result)


@router.patch("/{lost_item_id}/{found_item_id}", response_model=MatchResultResponse)
async def update_match_result(
    lost_item_id: uuid.UUID,
    found_item_id: uuid.UUID,
    payload: MatchResultUpdate,
    db: DBSession,
) -> MatchResultResponse:
    result = await db.get(MatchResult, (lost_item_id, found_item_id))
    if result is None:
        raise HTTPException(status_code=404, detail="매칭 결과를 찾을 수 없습니다.")
    fields = payload.model_fields_set
    if "score" in fields and payload.score is not None:
        result.score = payload.score
    if "reasons" in fields and payload.reasons is not None:
        result.reasons = payload.reasons
    if "question" in fields:
        result.question = payload.question
    await db.commit()
    await db.refresh(result)
    return _to_response(result)
