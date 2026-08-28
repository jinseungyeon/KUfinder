import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.api.router import api_router
from app.core.config import get_settings
from app.services.expired_items import run_expired_item_cleanup

settings = get_settings()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    del app
    if settings.storage_backend == "local":
        settings.local_storage_path.mkdir(parents=True, exist_ok=True)
    cleanup_task = asyncio.create_task(run_expired_item_cleanup())
    try:
        yield
    finally:
        cleanup_task.cancel()
        try:
            await cleanup_task
        except asyncio.CancelledError:
            pass


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="고려대학교 안암캠퍼스 분실물 등록·AI 매칭 API",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(api_router, prefix=settings.api_v1_prefix)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled request error: %s %s", request.method, request.url.path)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})

if settings.storage_backend == "local":
    app.mount(
        "/media",
        StaticFiles(directory=settings.local_storage_path, check_dir=False),
        name="media",
    )


@app.get("/")
async def root() -> dict[str, str]:
    return {"name": settings.app_name, "docs": "/docs", "health": "/api/v1/health"}
