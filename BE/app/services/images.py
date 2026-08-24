import io
from dataclasses import dataclass

from fastapi import HTTPException, UploadFile, status
from PIL import Image, UnidentifiedImageError

from app.core.config import get_settings


@dataclass(frozen=True)
class ValidatedImage:
    data: bytes
    content_type: str
    extension: str
    width: int
    height: int


async def validate_upload(upload: UploadFile) -> ValidatedImage:
    settings = get_settings()
    content_type = upload.content_type or ""
    if content_type not in settings.image_content_types:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="JPEG, PNG, WEBP 이미지만 업로드할 수 있습니다.",
        )

    data = await upload.read(settings.max_image_bytes + 1)
    if len(data) > settings.max_image_bytes:
        raise HTTPException(status_code=413, detail="이미지는 최대 10MB까지 업로드할 수 있습니다.")
    if not data:
        raise HTTPException(status_code=400, detail="빈 이미지 파일입니다.")

    try:
        with Image.open(io.BytesIO(data)) as image:
            image.verify()
        with Image.open(io.BytesIO(data)) as image:
            width, height = image.size
            detected_format = (image.format or "").lower()
    except (UnidentifiedImageError, OSError, ValueError) as exc:
        raise HTTPException(status_code=400, detail="올바른 이미지 파일이 아닙니다.") from exc

    if width * height > settings.max_image_pixels:
        raise HTTPException(status_code=413, detail="이미지 해상도가 너무 큽니다.")

    extensions = {"jpeg": "jpg", "png": "png", "webp": "webp"}
    if detected_format not in extensions:
        raise HTTPException(status_code=400, detail="지원하지 않는 이미지 형식입니다.")
    return ValidatedImage(data, content_type, extensions[detected_format], width, height)
