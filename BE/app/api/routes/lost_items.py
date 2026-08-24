import uuid
from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, Response, status
from sqlalchemy import select

from app.api.deps import DBSession
from app.core.enums import ItemCategory
from app.db.models import LostItem
from app.schemas.common import Contact, Location
from app.schemas.lost_item import LostItemCreate, LostItemResponse, LostItemUpdate

router = APIRouter()


def _to_response(item: LostItem) -> LostItemResponse:
    contact = None
    if item.contact_public is not None and item.contact_detail is not None:
        contact = Contact(public=item.contact_public, detail=item.contact_detail)
    return LostItemResponse(
        id=item.id,
        created_at=item.created_at,
        category=item.category,
        description=item.description,
        image_url=item.image_url,
        lost_location=Location(
            name=item.lost_location_name,
            latitude=item.lost_latitude,
            longitude=item.lost_longitude,
        ),
        lost_date=item.lost_date,
        contact=contact,
    )


@router.post("", response_model=LostItemResponse, status_code=status.HTTP_201_CREATED)
async def create_lost_item(payload: LostItemCreate, db: DBSession) -> LostItemResponse:
    item = LostItem(
        category=payload.category.value,
        description=payload.description,
        image_url=payload.image_url,
        lost_location_name=payload.lost_location.name,
        lost_latitude=payload.lost_location.latitude,
        lost_longitude=payload.lost_location.longitude,
        lost_date=payload.lost_date,
        contact_public=payload.contact.public if payload.contact else None,
        contact_detail=payload.contact.detail if payload.contact else None,
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return _to_response(item)


@router.get("", response_model=list[LostItemResponse])
async def list_lost_items(
    db: DBSession,
    category: Annotated[ItemCategory | None, Query()] = None,
    limit: Annotated[int, Query(ge=1, le=200)] = 50,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> list[LostItemResponse]:
    statement = select(LostItem)
    if category:
        statement = statement.where(LostItem.category == category.value)
    statement = statement.order_by(LostItem.created_at.desc()).limit(limit).offset(offset)
    return [_to_response(item) for item in (await db.scalars(statement)).all()]


@router.get("/{item_id}", response_model=LostItemResponse)
async def get_lost_item(item_id: uuid.UUID, db: DBSession) -> LostItemResponse:
    item = await db.get(LostItem, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="분실물 정보를 찾을 수 없습니다.")
    return _to_response(item)


@router.patch("/{item_id}", response_model=LostItemResponse)
async def update_lost_item(
    item_id: uuid.UUID, payload: LostItemUpdate, db: DBSession
) -> LostItemResponse:
    item = await db.get(LostItem, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="분실물 정보를 찾을 수 없습니다.")
    fields = payload.model_fields_set
    if "category" in fields and payload.category is not None:
        item.category = payload.category.value
    if "description" in fields and payload.description is not None:
        item.description = payload.description.strip()
    if "image_url" in fields:
        item.image_url = payload.image_url
    if "lost_location" in fields and payload.lost_location is not None:
        item.lost_location_name = payload.lost_location.name
        item.lost_latitude = payload.lost_location.latitude
        item.lost_longitude = payload.lost_location.longitude
    if "lost_date" in fields and payload.lost_date is not None:
        item.lost_date = payload.lost_date
    if "contact" in fields:
        item.contact_public = payload.contact.public if payload.contact else None
        item.contact_detail = payload.contact.detail if payload.contact else None
    await db.commit()
    await db.refresh(item)
    return _to_response(item)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lost_item(item_id: uuid.UUID, db: DBSession) -> Response:
    item = await db.get(LostItem, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="분실물 정보를 찾을 수 없습니다.")
    await db.delete(item)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
