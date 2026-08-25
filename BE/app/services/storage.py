import asyncio
import io
import uuid
from abc import ABC, abstractmethod
from pathlib import Path

import boto3

from app.core.config import Settings, get_settings


class StorageService(ABC):
    @abstractmethod
    async def save(self, item_id: uuid.UUID, data: bytes, extension: str, content_type: str) -> str:
        raise NotImplementedError

    @abstractmethod
    async def delete(self, object_key: str) -> None:
        raise NotImplementedError

    @abstractmethod
    async def url(self, object_key: str) -> str:
        raise NotImplementedError


class LocalStorage(StorageService):
    def __init__(self, root: Path):
        self.root = root.resolve()
        self.root.mkdir(parents=True, exist_ok=True)

    async def save(self, item_id: uuid.UUID, data: bytes, extension: str, content_type: str) -> str:
        del content_type
        key = f"items/{item_id}/{uuid.uuid4().hex}.{extension}"
        destination = self.root / key
        destination.parent.mkdir(parents=True, exist_ok=True)
        await asyncio.to_thread(destination.write_bytes, data)
        return key

    async def delete(self, object_key: str) -> None:
        path = self.root / object_key
        if path.is_file():
            await asyncio.to_thread(path.unlink)

    async def url(self, object_key: str) -> str:
        return f"/media/{object_key}"


class S3Storage(StorageService):
    def __init__(self, settings: Settings):
        if not settings.s3_bucket:
            raise RuntimeError("S3_BUCKET is required when STORAGE_BACKEND=s3")
        if not settings.s3_public_base_url:
            raise RuntimeError("S3_PUBLIC_BASE_URL is required when STORAGE_BACKEND=s3")
        self.bucket = settings.s3_bucket
        self.public_base_url = settings.s3_public_base_url.rstrip("/")
        self.client = boto3.client(
            "s3", region_name=settings.s3_region, endpoint_url=settings.s3_endpoint_url
        )

    async def save(self, item_id: uuid.UUID, data: bytes, extension: str, content_type: str) -> str:
        key = f"items/{item_id}/{uuid.uuid4().hex}.{extension}"

        def upload() -> None:
            self.client.upload_fileobj(
                io.BytesIO(data), self.bucket, key, ExtraArgs={"ContentType": content_type}
            )

        await asyncio.to_thread(upload)
        return key

    async def delete(self, object_key: str) -> None:
        await asyncio.to_thread(self.client.delete_object, Bucket=self.bucket, Key=object_key)

    async def url(self, object_key: str) -> str:
        return f"{self.public_base_url}/{object_key}"


def get_storage() -> StorageService:
    settings = get_settings()
    if settings.storage_backend == "s3":
        return S3Storage(settings)
    return LocalStorage(settings.local_storage_path)
