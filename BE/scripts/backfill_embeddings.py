import asyncio
import io
from urllib.parse import urlparse

import boto3
from sqlalchemy import select

from app.core.config import get_settings
from app.db.models import FoundItem, ImageEmbedding, LostItem, TextEmbedding
from app.db.session import AsyncSessionLocal
from app.services.images import validate_upload
from app.services.vlm_retriever import (
    encode_image_if_enabled,
    encode_text_if_enabled,
    save_image_embedding,
    save_text_embedding,
    text_embedding_key,
)


def s3_key_from_value(value: str) -> str:
    settings = get_settings()
    parsed = urlparse(value)
    if not parsed.scheme:
        return value.lstrip("/")

    path = parsed.path.lstrip("/")
    bucket_prefix = f"{settings.s3_bucket}/"
    if path.startswith(bucket_prefix):
        return path.removeprefix(bucket_prefix)
    return path


async def read_image_bytes(value: str) -> tuple[bytes, str, str]:
    settings = get_settings()
    if settings.storage_backend == "s3":
        if not settings.s3_bucket:
            raise RuntimeError("S3_BUCKET is required when STORAGE_BACKEND=s3")
        region_name = settings.s3_region or settings.aws_default_region
        client = boto3.client(
            "s3",
            region_name=region_name,
            endpoint_url=settings.s3_endpoint_url or f"https://s3.{region_name}.amazonaws.com",
            aws_access_key_id=settings.aws_access_key_id,
            aws_secret_access_key=settings.aws_secret_access_key,
        )
        key = s3_key_from_value(value)

        def download() -> tuple[bytes, str]:
            response = client.get_object(Bucket=settings.s3_bucket, Key=key)
            return response["Body"].read(), response.get("ContentType") or "image/jpeg"

        data, content_type = await asyncio.to_thread(download)
    else:
        key = value.removeprefix("/media/").lstrip("/")
        path = settings.local_storage_path / key
        data = await asyncio.to_thread(path.read_bytes)
        content_type = "image/jpeg"

    class UploadLike:
        def __init__(self, data: bytes, content_type: str):
            self.file = io.BytesIO(data)
            self.content_type = content_type

        async def read(self, size: int = -1) -> bytes:
            return self.file.read(size)

    validated = await validate_upload(UploadLike(data, content_type))
    return validated.data, validated.extension, validated.content_type


async def text_embedding_exists(text: str) -> bool:
    normalized = " ".join(text.split())
    if not normalized:
        return True
    async with AsyncSessionLocal() as db:
        existing = await db.get(TextEmbedding, text_embedding_key(normalized))
        return existing is not None


async def image_embedding_exists(image_url: str) -> bool:
    async with AsyncSessionLocal() as db:
        existing = await db.get(ImageEmbedding, image_url)
        return existing is not None


async def backfill_text(text: str) -> bool:
    if await text_embedding_exists(text):
        return False
    embedding = await encode_text_if_enabled(text)
    async with AsyncSessionLocal() as db:
        await save_text_embedding(db, text, embedding)
        await db.commit()
    return embedding is not None


async def backfill_image(image_url: str) -> bool:
    if await image_embedding_exists(image_url):
        return False
    data, extension, _ = await read_image_bytes(image_url)
    embedding = await encode_image_if_enabled(data, extension)
    async with AsyncSessionLocal() as db:
        await save_image_embedding(db, image_url, embedding)
        await db.commit()
    return embedding is not None


async def main() -> None:
    settings = get_settings()
    if not settings.vlm_enabled:
        raise RuntimeError("VLM_ENABLED=true로 설정한 뒤 실행하세요.")

    async with AsyncSessionLocal() as db:
        found_items = list((await db.scalars(select(FoundItem))).all())
        lost_items = list((await db.scalars(select(LostItem))).all())

    items = [*found_items, *lost_items]
    text_created = 0
    image_created = 0
    image_failed = 0

    print(f"items={len(items)}")

    for index, item in enumerate(items, start=1):
        label = f"{index}/{len(items)} {item.__class__.__name__} {item.id}"
        if await backfill_text(item.description):
            text_created += 1
            print(f"{label}: text embedding created")
        else:
            print(f"{label}: text embedding skipped")

        if not item.image_url:
            print(f"{label}: no image")
            continue

        try:
            if await backfill_image(item.image_url):
                image_created += 1
                print(f"{label}: image embedding created")
            else:
                print(f"{label}: image embedding skipped")
        except Exception as exc:
            image_failed += 1
            print(f"{label}: image embedding failed: {exc}")

    print(
        "done "
        f"text_created={text_created} "
        f"image_created={image_created} "
        f"image_failed={image_failed}"
    )


if __name__ == "__main__":
    asyncio.run(main())
