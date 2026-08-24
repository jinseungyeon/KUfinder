from fastapi import APIRouter

from app.core.enums import CATEGORY_LABELS, ItemCategory
from app.schemas.common import CamelModel

router = APIRouter()


class CategoryResponse(CamelModel):
    value: ItemCategory
    label: str


@router.get("", response_model=list[CategoryResponse])
async def list_categories() -> list[CategoryResponse]:
    return [CategoryResponse(value=value, label=label) for value, label in CATEGORY_LABELS.items()]
