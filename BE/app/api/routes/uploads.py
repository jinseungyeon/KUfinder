import uuid
from typing import Annotated

from fastapi import APIRouter, File, UploadFile, status

from app.schemas.upload import ImageUploadResponse
from app.services.images import validate_upload
from app.services.storage import get_storage

router = APIRouter()


@router.post("/images", response_model=ImageUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_image(image: Annotated[UploadFile, File()]) -> ImageUploadResponse:
    validated = await validate_upload(image)
    storage = get_storage()
    key = await storage.save(
        uuid.uuid4(), validated.data, validated.extension, validated.content_type
    )
    return ImageUploadResponse(image_url=await storage.url(key))
