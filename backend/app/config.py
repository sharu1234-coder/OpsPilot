from functools import lru_cache
from urllib.parse import urlsplit

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "OpsPilot API"
    environment: str = "development"

    database_url: str = ""

    @model_validator(mode="after")
    def validate_database_configuration(self) -> "Settings":
        """Prevent development DB fallback in production."""

        development_url = (
            "postgresql+psycopg://opspilot:opspilot_dev"
            "@localhost:5432/opspilot"
        )

        is_development = (
            self.environment.strip().lower() == "development"
        )

        configured_url = self.database_url.strip()

        if not configured_url:
            if not is_development:
                raise ValueError(
                    "DATABASE_URL must be explicitly configured "
                    "outside development."
                )

            # Preserve the existing local development fallback.
            self.database_url = development_url
            return self

        if (
            not is_development
            and configured_url == development_url
        ):
            raise ValueError(
                "Production cannot use the default "
                "development database URL."
            )

        return self


    trusted_origins: str = ""

    @property
    def allowed_origins(self) -> tuple[str, ...]:
        """Validated frontend origins for CORS and CSRF."""
        development = (
            self.environment.strip().lower() == "development"
        )

        configured = self.trusted_origins.strip()

        if not configured:
            if development:
                configured = (
                    "http://localhost:5173,"
                    "http://127.0.0.1:5173"
                )
            else:
                raise ValueError(
                    "TRUSTED_ORIGINS must be explicitly "
                    "configured outside development."
                )

        origins = []

        for value in configured.split(","):
            origin = value.strip()

            if not origin or "*" in origin:
                raise ValueError(
                    "Invalid TRUSTED_ORIGINS entry."
                )

            parsed = urlsplit(origin)

            if (
                parsed.scheme not in {"http", "https"}
                or not parsed.hostname
                or parsed.username is not None
                or parsed.password is not None
                or parsed.path
                or parsed.query
                or parsed.fragment
            ):
                raise ValueError(
                    f"Invalid trusted origin: {origin}"
                )

            # Also validates malformed ports.
            port = parsed.port

            if port is not None and not (1 <= port <= 65535):
                raise ValueError(
                    f"Invalid trusted origin port: {origin}"
                )

            if not development and parsed.scheme != "https":
                raise ValueError(
                    "Non-development trusted origins "
                    "must use HTTPS."
                )

            if parsed.scheme == "http" and (
                parsed.hostname not in {
                    "localhost",
                    "127.0.0.1",
                    "::1",
                }
            ):
                raise ValueError(
                    "HTTP origins are permitted only "
                    "for local development."
                )

            if origin not in origins:
                origins.append(origin)

        return tuple(origins)

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
