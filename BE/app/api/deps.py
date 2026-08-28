from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.services.admin_auth import AdminAuthError, verify_admin_token

DBSession = Annotated[AsyncSession, Depends(get_db)]
admin_bearer = HTTPBearer(auto_error=False)


def require_admin(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(admin_bearer)] = None,
) -> str:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="관리자 인증이 필요합니다.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        return verify_admin_token(credentials.credentials)
    except AdminAuthError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="관리자 인증이 만료되었거나 올바르지 않습니다.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc


AdminUser = Annotated[str, Depends(require_admin)]
