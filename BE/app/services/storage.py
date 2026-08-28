import asyncio
import io
import uuid
from abc import ABC, abstractmethod
from functools import lru_cache
from pathlib import Path
from urllib.parse import urlparse

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
        path = self.root / self._object_key(object_key)
        if path.is_file():
            await asyncio.to_thread(path.unlink)

    async def url(self, object_key: str) -> str:
        if object_key.startswith("/media/") or object_key.startswith("http"):
            return object_key
        return f"/media/{object_key}"

    def _object_key(self, value: str) -> str:
        return value.removeprefix("/media/").lstrip("/")


class S3Storage(StorageService):
    def __init__(self, settings: Settings):
        if not settings.s3_bucket:
            raise RuntimeError("S3_BUCKET is required when STORAGE_BACKEND=s3")
        self.bucket = settings.s3_bucket
        self.public_base_url = (
            settings.s3_public_base_url.rstrip("/") if settings.s3_public_base_url else None
        )
        region_name = settings.s3_region or settings.aws_default_region
        self.client = boto3.client(
            "s3",
            region_name=region_name,
            endpoint_url=settings.s3_endpoint_url or f"https://s3.{region_name}.amazonaws.com",
            aws_access_key_id=settings.aws_access_key_id,
            aws_secret_access_key=settings.aws_secret_access_key,
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
        key = self._object_key(object_key)
        await asyncio.to_thread(self.client.delete_object, Bucket=self.bucket, Key=key)

    async def url(self, object_key: str) -> str:
        key = self._object_key(object_key)

        def create_url() -> str:
            return self.client.generate_presigned_url(
                "get_object",
                Params={"Bucket": self.bucket, "Key": key},
                ExpiresIn=3600,
            )

        return await asyncio.to_thread(create_url)

    def _object_key(self, value: str) -> str:
        if self.public_base_url and value.startswith(self.public_base_url):
            return value.removeprefix(self.public_base_url).lstrip("/")
        if value.startswith("http://") or value.startswith("https://"):
            path = urlparse(value).path.lstrip("/")
            bucket_prefix = f"{self.bucket}/"
            if path.startswith(bucket_prefix):
                return path.removeprefix(bucket_prefix)
            return path
        return value.lstrip("/")


@lru_cache(maxsize=1)
def get_storage() -> StorageService:
    settings = get_settings()
    if settings.storage_backend == "s3":
        return S3Storage(settings)
    return LocalStorage(settings.local_storage_path)
