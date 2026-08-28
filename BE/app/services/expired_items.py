import asyncio
import logging
from datetime import UTC, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.db.models import FoundItem, LostItem
from app.db.session import AsyncSessionLocal
from app.services.storage import get_storage

logger = logging.getLogger(__name__)


async def delete_expired_items(db: AsyncSession) -> int:
    settings = get_settings()
    cutoff = datetime.now(UTC) - timedelta(days=settings.item_retention_days)
    found_items = (await db.scalars(select(FoundItem).where(FoundItem.created_at < cutoff))).all()
    lost_items = (await db.scalars(select(LostItem).where(LostItem.created_at < cutoff))).all()
    expired_items = [*found_items, *lost_items]
    image_urls = [item.image_url for item in expired_items if item.image_url]

    if not expired_items:
        return 0

    for item in expired_items:
        await db.delete(item)

    await db.commit()

    storage = get_storage()
    for image_url in image_urls:
        try:
            await storage.delete(image_url)
        except Exception:
            logger.exception("Failed to delete expired item image: %s", image_url)

    deleted_count = len(expired_items)
    logger.info("Deleted %s expired items older than %s", deleted_count, cutoff.isoformat())
    return deleted_count


async def cleanup_expired_items_once() -> None:
    async with AsyncSessionLocal() as db:
        try:
            await delete_expired_items(db)
        except Exception:
            await db.rollback()
            logger.exception("Expired item cleanup failed")


async def run_expired_item_cleanup() -> None:
    settings = get_settings()
    while True:
        await cleanup_expired_items_once()
        await asyncio.sleep(settings.expired_item_cleanup_interval_seconds)
