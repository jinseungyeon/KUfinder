import uuid
from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, File, UploadFile, status

from app.schemas.upload import ImageUploadResponse
from app.services.images import validate_upload
from app.services.storage import get_storage
from app.services.vlm_retriever import process_image_embedding

router = APIRouter()


@router.post("/images", response_model=ImageUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_image(
    image: Annotated[UploadFile, File()], background_tasks: BackgroundTasks
) -> ImageUploadResponse:
    validated = await validate_upload(image)
    storage = get_storage()
    key = await storage.save(
        uuid.uuid4(), validated.data, validated.extension, validated.content_type
    )
    background_tasks.add_task(
        process_image_embedding, key, validated.data, validated.extension
    )
    return ImageUploadResponse(image_url=key)
