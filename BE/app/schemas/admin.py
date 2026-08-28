from datetime import datetime

from pydantic import Field

from app.schemas.common import CamelModel


class AdminLoginRequest(CamelModel):
    password: str = Field(min_length=1, max_length=300)


class AdminLoginResponse(CamelModel):
    access_token: str
    token_type: str = "bearer"
    expires_at: datetime
