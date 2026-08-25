import uuid
from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, Response, status
from sqlalchemy import select

from app.api.deps import DBSession
from app.core.enums import ItemCategory
from app.db.models import FoundItem
from app.schemas.common import Contact, Location
from app.schemas.found_item import (
    FoundItemCreate,
    FoundItemMapResponse,
    FoundItemResponse,
    FoundItemUpdate,
)

router = APIRouter()


def _to_response(item: FoundItem) -> FoundItemResponse:
    contact = None
    if item.contact_public is not None and item.contact_detail is not None:
        contact = Contact(public=item.contact_public, detail=item.contact_detail)
    return FoundItemResponse(
        id=item.id,
        created_at=item.created_at,
        category=item.category,
        description=item.description,
        image_url=item.image_url,
        found_location=Location(
            name=item.found_location_name,
            latitude=item.found_latitude,
            longitude=item.found_longitude,
        ),
        found_date=item.found_date,
        storage_place=item.storage_place,
        contact=contact,
    )


@router.post("", response_model=FoundItemResponse, status_code=status.HTTP_201_CREATED)
async def create_found_item(payload: FoundItemCreate, db: DBSession) -> FoundItemResponse:
    item = FoundItem(
        category=payload.category.value,
        description=payload.description,
        image_url=payload.image_url,
        found_location_name=payload.found_location.name,
        found_latitude=payload.found_location.latitude,
        found_longitude=payload.found_location.longitude,
        found_date=payload.found_date,
        storage_place=payload.storage_place,
        contact_public=payload.contact.public if payload.contact else None,
        contact_detail=payload.contact.detail if payload.contact else None,
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return _to_response(item)


@router.get("", response_model=list[FoundItemResponse])
async def list_found_items(
    db: DBSession,
    category: Annotated[ItemCategory | None, Query()] = None,
    limit: Annotated[int, Query(ge=1, le=200)] = 50,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> list[FoundItemResponse]:
    statement = select(FoundItem)
    if category:
        statement = statement.where(FoundItem.category == category.value)
    statement = statement.order_by(FoundItem.created_at.desc()).limit(limit).offset(offset)
    return [_to_response(item) for item in (await db.scalars(statement)).all()]


@router.get("/map", response_model=list[FoundItemMapResponse])
async def list_found_item_markers(
    db: DBSession,
    category: Annotated[ItemCategory | None, Query()] = None,
) -> list[FoundItemMapResponse]:
    statement = select(FoundItem)
    if category:
        statement = statement.where(FoundItem.category == category.value)
    statement = statement.order_by(FoundItem.found_date.desc()).limit(500)
    return [
        FoundItemMapResponse(
            id=item.id,
            category=item.category,
            found_location=Location(
                name=item.found_location_name,
                latitude=item.found_latitude,
                longitude=item.found_longitude,
            ),
            found_date=item.found_date,
        )
        for item in (await db.scalars(statement)).all()
    ]


@router.get("/{item_id}", response_model=FoundItemResponse)
async def get_found_item(item_id: uuid.UUID, db: DBSession) -> FoundItemResponse:
    item = await db.get(FoundItem, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="습득물 정보를 찾을 수 없습니다.")
    return _to_response(item)


@router.patch("/{item_id}", response_model=FoundItemResponse)
async def update_found_item(
    item_id: uuid.UUID, payload: FoundItemUpdate, db: DBSession
) -> FoundItemResponse:
    item = await db.get(FoundItem, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="습득물 정보를 찾을 수 없습니다.")
    fields = payload.model_fields_set
    if "category" in fields and payload.category is not None:
        item.category = payload.category.value
    if "description" in fields and payload.description is not None:
        item.description = payload.description.strip()
    if "image_url" in fields:
        item.image_url = payload.image_url
    if "found_location" in fields and payload.found_location is not None:
        item.found_location_name = payload.found_location.name
        item.found_latitude = payload.found_location.latitude
        item.found_longitude = payload.found_location.longitude
    if "found_date" in fields and payload.found_date is not None:
        item.found_date = payload.found_date
    if "storage_place" in fields:
        item.storage_place = payload.storage_place
    if "contact" in fields:
        item.contact_public = payload.contact.public if payload.contact else None
        item.contact_detail = payload.contact.detail if payload.contact else None
    await db.commit()
    await db.refresh(item)
    return _to_response(item)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_found_item(item_id: uuid.UUID, db: DBSession) -> Response:
    item = await db.get(FoundItem, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="습득물 정보를 찾을 수 없습니다.")
    await db.delete(item)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
