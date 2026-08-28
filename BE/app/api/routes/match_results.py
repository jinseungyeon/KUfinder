import logging
import uuid
from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import select

from app.api.deps import DBSession
from app.db.models import FoundItem, LostItem, MatchResult
from app.schemas.common import Contact
from app.schemas.match_result import (
    ConfirmedMatchResponse,
    GeneratedFoundMatchesResponse,
    GeneratedMatchesResponse,
    MatchResultCreate,
    MatchResultResponse,
    MatchResultUpdate,
)
from app.services.matcher import generate_match_results, generate_match_results_for_found
from app.services.storage import get_storage
from app.services.vlm_retriever import wait_for_item_embeddings

router = APIRouter()
logger = logging.getLogger(__name__)


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
    found_item_id: Annotated[uuid.UUID | None, Query(alias="foundItemId")] = None,
    minimum_score: Annotated[float, Query(alias="minimumScore", ge=0, le=1)] = 0,
) -> list[MatchResultResponse]:
    statement = select(MatchResult).where(MatchResult.score >= minimum_score)
    if lost_item_id:
        statement = statement.where(MatchResult.lost_item_id == lost_item_id)
    if found_item_id:
        statement = statement.where(MatchResult.found_item_id == found_item_id)
    statement = statement.order_by(MatchResult.score.desc()).limit(100)
    return [_to_response(result) for result in (await db.scalars(statement)).all()]


@router.post("/generate/{lost_item_id}", response_model=GeneratedMatchesResponse)
async def generate_for_lost_item(
    lost_item_id: uuid.UUID, db: DBSession
) -> GeneratedMatchesResponse:
    lost = await db.get(LostItem, lost_item_id)
    if lost is None:
        raise HTTPException(status_code=404, detail="분실물 정보를 찾을 수 없습니다.")
    await wait_for_item_embeddings(db, lost.image_url, lost.description)
    results = await generate_match_results(db, lost)
    await db.commit()
    return GeneratedMatchesResponse(
        lost_item_id=lost.id,
        results=[_to_response(result) for result in results],
    )


@router.post("/generate/found/{found_item_id}", response_model=GeneratedFoundMatchesResponse)
async def generate_for_found_item(
    found_item_id: uuid.UUID, db: DBSession
) -> GeneratedFoundMatchesResponse:
    found = await db.get(FoundItem, found_item_id)
    if found is None:
        raise HTTPException(status_code=404, detail="습득물 정보를 찾을 수 없습니다.")
    await wait_for_item_embeddings(db, found.image_url, found.description)
    results = await generate_match_results_for_found(db, found)
    await db.commit()
    return GeneratedFoundMatchesResponse(
        found_item_id=found.id,
        results=[_to_response(result) for result in results],
    )


@router.post("/{lost_item_id}/{found_item_id}/confirm", response_model=ConfirmedMatchResponse)
async def confirm_match(
    lost_item_id: uuid.UUID,
    found_item_id: uuid.UUID,
    db: DBSession,
) -> ConfirmedMatchResponse:
    lost = await db.get(LostItem, lost_item_id)
    found = await db.get(FoundItem, found_item_id)
    if lost is None or found is None:
        raise HTTPException(status_code=404, detail="매칭할 분실물 또는 습득물을 찾을 수 없습니다.")

    lost_contact = (
        Contact(public=lost.contact_public, detail=lost.contact_detail)
        if lost.contact_public is not None and lost.contact_detail is not None
        else None
    )
    found_contact = (
        Contact(public=found.contact_public, detail=found.contact_detail)
        if found.contact_public is not None and found.contact_detail is not None
        else None
    )
    response = ConfirmedMatchResponse(
        lost_item_id=lost.id,
        found_item_id=found.id,
        lost_contact=lost_contact,
        found_contact=found_contact,
        storage_place=found.storage_place,
    )
    image_urls = [image_url for image_url in (lost.image_url, found.image_url) if image_url]

    await db.delete(lost)
    await db.delete(found)
    await db.commit()
    storage = get_storage()
    for image_url in image_urls:
        try:
            await storage.delete(image_url)
        except Exception:
            logger.exception("Failed to delete matched item image: %s", image_url)
    return response


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
