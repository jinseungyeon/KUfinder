from fastapi import APIRouter, HTTPException
from sqlalchemy import text

from app.api.deps import DBSession

router = APIRouter()


@router.get("/health")
async def health(db: DBSession) -> dict[str, str]:
    try:
        await db.execute(text("SELECT 1"))
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Database is unavailable") from exc
    return {"status": "ok", "database": "ok"}
