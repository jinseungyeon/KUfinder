import hmac

from fastapi import APIRouter, HTTPException, status

from app.core.config import get_settings
from app.schemas.admin import AdminLoginRequest, AdminLoginResponse
from app.services.admin_auth import create_admin_token

router = APIRouter()


@router.post("/login", response_model=AdminLoginResponse)
async def login_admin(payload: AdminLoginRequest) -> AdminLoginResponse:
    settings = get_settings()
    if (
        settings.environment == "production"
        and (
            settings.admin_password == "admin"
            or settings.admin_token_secret == "change-me-in-production"
        )
    ):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="운영 환경의 관리자 인증 설정이 안전하지 않습니다.",
        )

    password_matches = hmac.compare_digest(payload.password, settings.admin_password)
    if not password_matches:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="관리자 계정 정보가 올바르지 않습니다.",
        )

    token, expires_at = create_admin_token("admin")
    return AdminLoginResponse(access_token=token, expires_at=expires_at)
