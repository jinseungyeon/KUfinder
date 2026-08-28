from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "KU-finder API"
    environment: Literal["local", "test", "staging", "production"] = "local"
    api_v1_prefix: str = "/api/v1"
    database_url: str = "postgresql+asyncpg://kufinder:kufinder@localhost:5432/kufinder"

    allowed_origins: str = "http://localhost:3000,http://localhost:5173"

    storage_backend: Literal["local", "s3"] = "local"
    local_storage_path: Path = Path("./uploads")
    s3_bucket: str | None = None
    s3_region: str = "ap-northeast-2"
    s3_endpoint_url: str | None = None
    s3_public_base_url: str | None = None
    aws_access_key_id: str | None = None
    aws_secret_access_key: str | None = None
    aws_default_region: str | None = None

    max_image_bytes: int = 10 * 1024 * 1024
    max_image_pixels: int = 24_000_000
    allowed_image_types: str = "image/jpeg,image/png,image/webp"

    vlm_enabled: bool = False
    vlm_model_name: str = "jinaai/jina-clip-v2"
    vlm_embedding_dim: int = Field(default=512, ge=1)
    vlm_score_weight: float = Field(default=0.45, ge=0, le=1)
    vlm_reason_threshold: float = Field(default=0.70, ge=0, le=1)
    vlm_match_wait_seconds: float = Field(default=20.0, ge=0, le=120)
    vlm_match_poll_seconds: float = Field(default=0.5, ge=0.1, le=5)

    high_confidence_threshold: float = Field(default=0.80, ge=0, le=1)
    minimum_match_score: float = Field(default=0.5, ge=0, le=1)
    match_candidate_limit: int = Field(default=200, ge=10, le=2000)
    match_result_limit: int = Field(default=10, ge=1, le=50)

    admin_password: str = "admin"
    admin_token_secret: str = "change-me-in-production"
    admin_session_minutes: int = Field(default=480, ge=1, le=10080)

    item_retention_days: int = Field(default=30, ge=1, le=3650)
    expired_item_cleanup_interval_seconds: int = Field(default=21600, ge=60, le=86400)

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]

    @property
    def image_content_types(self) -> set[str]:
        return {value.strip() for value in self.allowed_image_types.split(",") if value.strip()}


@lru_cache
def get_settings() -> Settings:
    return Settings()
