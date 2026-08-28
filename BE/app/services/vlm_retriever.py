import asyncio
import hashlib
import logging
import math
import tempfile
import time
from functools import lru_cache
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.db.models import ImageEmbedding, TextEmbedding
from app.db.session import AsyncSessionLocal

logger = logging.getLogger(__name__)


class VLMUnavailableError(RuntimeError):
    pass


def _require_dependencies():
    try:
        import numpy as np
        import torch
        from transformers import AutoModel
    except ImportError as exc:
        raise VLMUnavailableError(
            "VLM dependencies are not installed. Run `uv sync --extra vlm`."
        ) from exc
    return np, torch, AutoModel


@lru_cache(maxsize=1)
def _load_model():
    settings = get_settings()
    _, torch, AutoModel = _require_dependencies()
    use_cuda = torch.cuda.is_available()
    kwargs = {
        "trust_remote_code": True,
        "torch_dtype": torch.float16 if use_cuda else torch.float32,
    }
    if use_cuda:
        kwargs["device_map"] = "auto"

    model = AutoModel.from_pretrained(settings.vlm_model_name, **kwargs)
    if not use_cuda:
        model = model.to("cpu")
    model.eval()
    return model


def _as_float_list(value) -> list[float]:
    np, _, _ = _require_dependencies()
    embedding = np.asarray(value, dtype=np.float32)[0]
    return [float(x) for x in embedding.tolist()]


def _encode_image_sync(data: bytes, extension: str) -> list[float]:
    settings = get_settings()
    model = _load_model()
    suffix = f".{extension.lstrip('.')}"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as file:
        file.write(data)
        path = file.name

    try:
        embedding = model.encode_image(
            [path],
            batch_size=1,
            normalize_embeddings=True,
            truncate_dim=settings.vlm_embedding_dim,
        )
        return _as_float_list(embedding)
    finally:
        Path(path).unlink(missing_ok=True)


@lru_cache(maxsize=512)
def _encode_text_sync(text: str) -> tuple[float, ...]:
    settings = get_settings()
    model = _load_model()
    embedding = model.encode_text(
        [text],
        task="retrieval.query",
        normalize_embeddings=True,
        truncate_dim=settings.vlm_embedding_dim,
    )
    return tuple(_as_float_list(embedding))


async def encode_image_if_enabled(data: bytes, extension: str) -> list[float] | None:
    if not get_settings().vlm_enabled:
        return None
    return await asyncio.to_thread(_encode_image_sync, data, extension)


async def encode_text_if_enabled(text: str) -> list[float] | None:
    text = text.strip()
    if not get_settings().vlm_enabled or not text:
        return None
    embedding = await asyncio.to_thread(_encode_text_sync, text)
    return list(embedding)


def text_embedding_key(text: str) -> str:
    return hashlib.sha256(" ".join(text.split()).encode("utf-8")).hexdigest()


async def save_image_embedding(
    db: AsyncSession, image_url: str, embedding: list[float] | None
) -> None:
    if embedding is None:
        return
    settings = get_settings()
    existing = await db.get(ImageEmbedding, image_url)
    if existing is None:
        db.add(
            ImageEmbedding(
                image_url=image_url,
                model_name=settings.vlm_model_name,
                embedding_dim=settings.vlm_embedding_dim,
                embedding=embedding,
            )
        )
        return

    existing.model_name = settings.vlm_model_name
    existing.embedding_dim = settings.vlm_embedding_dim
    existing.embedding = embedding


async def save_text_embedding(db: AsyncSession, text: str, embedding: list[float] | None) -> None:
    text = " ".join(text.split())
    if embedding is None or not text:
        return
    settings = get_settings()
    text_hash = text_embedding_key(text)
    existing = await db.get(TextEmbedding, text_hash)
    if existing is None:
        db.add(
            TextEmbedding(
                text_hash=text_hash,
                text=text,
                model_name=settings.vlm_model_name,
                embedding_dim=settings.vlm_embedding_dim,
                embedding=embedding,
            )
        )
        return

    existing.text = text
    existing.model_name = settings.vlm_model_name
    existing.embedding_dim = settings.vlm_embedding_dim
    existing.embedding = embedding


async def get_image_embedding(db: AsyncSession, image_url: str | None) -> list[float] | None:
    if not get_settings().vlm_enabled or not image_url:
        return None
    result = await db.scalar(select(ImageEmbedding).where(ImageEmbedding.image_url == image_url))
    return result.embedding if result else None


async def get_text_embedding(db: AsyncSession, text: str | None) -> list[float] | None:
    if not get_settings().vlm_enabled or not text:
        return None
    text = " ".join(text.split())
    if not text:
        return None
    result = await db.get(TextEmbedding, text_embedding_key(text))
    return result.embedding if result else None


async def item_embeddings_ready(
    db: AsyncSession, image_url: str | None, text: str | None
) -> bool:
    if not get_settings().vlm_enabled:
        return True

    if image_url and await get_image_embedding(db, image_url) is None:
        return False
    if text and text.strip() and await get_text_embedding(db, text) is None:
        return False
    return True


async def wait_for_item_embeddings(
    db: AsyncSession, image_url: str | None, text: str | None
) -> bool:
    settings = get_settings()
    if not settings.vlm_enabled:
        return True

    deadline = time.monotonic() + settings.vlm_match_wait_seconds
    while True:
        if await item_embeddings_ready(db, image_url, text):
            return True
        if time.monotonic() >= deadline:
            return False
        await asyncio.sleep(settings.vlm_match_poll_seconds)


async def process_image_embedding(image_url: str, data: bytes, extension: str) -> None:
    if not get_settings().vlm_enabled:
        return
    try:
        embedding = await encode_image_if_enabled(data, extension)
        async with AsyncSessionLocal() as db:
            await save_image_embedding(db, image_url, embedding)
            await db.commit()
    except Exception:
        logger.exception("Failed to process image embedding for %s", image_url)


async def process_text_embedding(text: str) -> None:
    if not get_settings().vlm_enabled:
        return
    try:
        embedding = await encode_text_if_enabled(text)
        async with AsyncSessionLocal() as db:
            await save_text_embedding(db, text, embedding)
            await db.commit()
    except Exception:
        logger.exception("Failed to process text embedding")


def cosine_similarity(left: list[float] | None, right: list[float] | None) -> float | None:
    if not left or not right or len(left) != len(right):
        return None
    score = sum(a * b for a, b in zip(left, right, strict=True))
    if math.isnan(score):
        return None
    return max(-1.0, min(1.0, score))
