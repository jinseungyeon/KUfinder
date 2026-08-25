from fastapi import APIRouter

from app.api.routes import categories, found_items, health, lost_items, match_results, uploads

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(categories.router, prefix="/categories", tags=["categories"])
api_router.include_router(found_items.router, prefix="/found-items", tags=["found-items"])
api_router.include_router(lost_items.router, prefix="/lost-items", tags=["lost-items"])
api_router.include_router(match_results.router, prefix="/match-results", tags=["match-results"])
api_router.include_router(uploads.router, prefix="/uploads", tags=["uploads"])
