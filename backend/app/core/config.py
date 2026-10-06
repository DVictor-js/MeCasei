from functools import lru_cache
from pathlib import Path
from typing import Literal
from pydantic import AliasChoices, Field, SecretStr, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.engine import make_url


class Settings(BaseSettings):
    database_url: str = Field(repr=False)
    database_host: str | None = None
    database_port: int = 5432
    jwt_secret_key: SecretStr = SecretStr("")
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 30
    app_env: Literal["development", "demo", "production"] = Field(
        default="development", validation_alias=AliasChoices("APP_ENV", "ENVIRONMENT")
    )
    port: int = Field(default=8000, ge=1, le=65535)
    cors_allowed_origins: str | None = Field(
        default=None, validation_alias=AliasChoices("CORS_ALLOWED_ORIGINS", "CORS_ORIGINS")
    )

    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parents[2] / ".env",
        extra="ignore", populate_by_name=True, hide_input_in_errors=True,
    )

    @model_validator(mode="after")
    def validate_environment(self):
        key = self.jwt_secret_key.get_secret_value()
        placeholders = {"CHANGE_ME", "replace-with-a-long-random-secret-at-least-32-characters"}
        if len(key.strip()) < 32 or key in placeholders:
            raise ValueError("JWT_SECRET_KEY must be configured with a secure value of at least 32 characters.")
        try:
            url = make_url(self.database_url)
        except Exception:
            raise ValueError("DATABASE_URL must be a PostgreSQL connection URL.") from None
        if url.drivername in {"postgres", "postgresql"}:
            url = url.set(drivername="postgresql+psycopg")
        if url.drivername != "postgresql+psycopg" or not url.host or not url.database:
            raise ValueError("DATABASE_URL must be a PostgreSQL connection URL.")
        if self.database_host:
            url = url.set(host=self.database_host, port=self.database_port)
        self.database_url = url.render_as_string(hide_password=False)
        if any(origin == "*" or not origin.startswith(("http://", "https://")) for origin in self.origins):
            raise ValueError("CORS_ALLOWED_ORIGINS must contain explicit HTTP(S) origins; wildcard is not allowed.")
        return self

    @property
    def origins(self) -> list[str]:
        if self.cors_allowed_origins is None:
            return ["http://localhost:8081"] if self.app_env == "development" else []
        return [origin.strip() for origin in self.cors_allowed_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
