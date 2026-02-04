from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache

from dotenv import load_dotenv


def _parse_bool(value: str | None, *, default: bool = False) -> bool:
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "y", "on"}


@dataclass(frozen=True)
class Settings:
    app_name: str
    app_env: str

    smtp_host: str | None
    smtp_port: int
    smtp_username: str | None
    smtp_password: str | None
    smtp_from: str | None
    smtp_to: str | None
    smtp_use_tls: bool
    smtp_use_ssl: bool

    @property
    def smtp_configured(self) -> bool:
        required = [
            self.smtp_host,
            self.smtp_username,
            self.smtp_password,
            self.smtp_from,
            self.smtp_to,
        ]
        return all(bool(v and str(v).strip()) for v in required)


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    load_dotenv()

    smtp_port_raw = os.getenv("SMTP_PORT", "587").strip()
    try:
        smtp_port = int(smtp_port_raw)
    except ValueError:
        smtp_port = 587

    smtp_use_ssl = _parse_bool(os.getenv("SMTP_USE_SSL"), default=False)
    smtp_use_tls = _parse_bool(os.getenv("SMTP_USE_TLS"), default=not smtp_use_ssl)

    return Settings(
        app_name=os.getenv("APP_NAME", "Pasan Portfolio").strip(),
        app_env=os.getenv("APP_ENV", "development").strip(),
        smtp_host=os.getenv("SMTP_HOST"),
        smtp_port=smtp_port,
        smtp_username=os.getenv("SMTP_USERNAME"),
        smtp_password=os.getenv("SMTP_PASSWORD"),
        smtp_from=os.getenv("SMTP_FROM"),
        smtp_to=os.getenv("SMTP_TO"),
        smtp_use_tls=smtp_use_tls,
        smtp_use_ssl=smtp_use_ssl,
    )

