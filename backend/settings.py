from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
import re

from dotenv import load_dotenv


def _clean_env(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = value.strip()
    cleaned = _strip_inline_comment(cleaned)
    if cleaned.startswith('\\"') and cleaned.endswith('\\"') and len(cleaned) >= 4:
        cleaned = cleaned[2:-2]
    elif cleaned.startswith('"') and cleaned.endswith('"') and len(cleaned) >= 2:
        cleaned = cleaned[1:-1]
    elif cleaned.startswith("'") and cleaned.endswith("'") and len(cleaned) >= 2:
        cleaned = cleaned[1:-1]
    return cleaned.strip()


def _strip_inline_comment(value: str) -> str:
    # Docker env files may keep trailing inline comments as part of the value.
    return re.split(r"\s+#", value, maxsplit=1)[0].strip()


def _parse_bool(value: str | None, *, default: bool = False) -> bool:
    if value is None:
        return default
    cleaned = _clean_env(value) or ""
    return cleaned.lower() in {"1", "true", "yes", "y", "on"}


def _parse_int(value: str | None, *, default: int) -> int:
    if value is None:
        return default
    cleaned = _clean_env(value) or ""
    try:
        return int(cleaned)
    except ValueError:
        return default


def _parse_float(value: str | None, *, default: float) -> float:
    if value is None:
        return default
    cleaned = _clean_env(value) or ""
    try:
        return float(cleaned)
    except ValueError:
        return default


@dataclass(frozen=True)
class Settings:
    app_name: str
    app_env: str

    rag_knowledge_dir: Path
    rag_chunk_size: int
    rag_chunk_overlap: int
    rag_top_k: int
    prompts_dir: Path

    api_access_token: str | None
    rate_limit_window_seconds: int
    rate_limit_contact_max: int
    rate_limit_chat_max: int

    llm_log_enabled: bool
    llm_log_redact: bool

    openrouter_api_key: str | None
    openrouter_model: str
    openrouter_base_url: str
    openrouter_referer: str | None
    openrouter_title: str | None
    openrouter_fallback_models: list[str]
    openrouter_max_retries: int
    openrouter_retry_backoff: float

    smtp_host: str | None
    smtp_port: int
    smtp_username: str | None
    smtp_password: str | None
    smtp_from: str | None
    smtp_to: str | None
    smtp_use_tls: bool
    smtp_use_ssl: bool
    smtp_timeout_seconds: int

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

    root_dir = Path(__file__).resolve().parent.parent
    knowledge_dir = Path(_clean_env(os.getenv("RAG_KNOWLEDGE_DIR")) or "knowledge")
    if not knowledge_dir.is_absolute():
        knowledge_dir = root_dir / knowledge_dir

    smtp_port = _parse_int(os.getenv("SMTP_PORT"), default=587)

    smtp_use_ssl = _parse_bool(os.getenv("SMTP_USE_SSL"), default=False)
    smtp_use_tls = _parse_bool(os.getenv("SMTP_USE_TLS"), default=not smtp_use_ssl)

    app_env = (_clean_env(os.getenv("APP_ENV")) or "development").strip()
    llm_log_redact_default = app_env.lower() != "development"

    return Settings(
        app_name=(_clean_env(os.getenv("APP_NAME")) or "Pasan Portfolio").strip(),
        app_env=app_env,
        rag_knowledge_dir=knowledge_dir,
        rag_chunk_size=_parse_int(os.getenv("RAG_CHUNK_SIZE"), default=800),
        rag_chunk_overlap=_parse_int(os.getenv("RAG_CHUNK_OVERLAP"), default=160),
        rag_top_k=_parse_int(os.getenv("RAG_TOP_K"), default=4),
        prompts_dir=root_dir / "prompts",
        api_access_token=_clean_env(os.getenv("API_ACCESS_TOKEN")),
        rate_limit_window_seconds=_parse_int(os.getenv("RATE_LIMIT_WINDOW_SECONDS"), default=60),
        rate_limit_contact_max=_parse_int(os.getenv("RATE_LIMIT_CONTACT_MAX"), default=5),
        rate_limit_chat_max=_parse_int(os.getenv("RATE_LIMIT_CHAT_MAX"), default=10),
        llm_log_enabled=_parse_bool(os.getenv("LLM_LOG_ENABLED"), default=True),
        llm_log_redact=_parse_bool(os.getenv("LLM_LOG_REDACT"), default=llm_log_redact_default),
        openrouter_api_key=_clean_env(os.getenv("OPENROUTER_API_KEY")),
        openrouter_model=(_clean_env(os.getenv("OPENROUTER_MODEL")) or "openai/gpt-4o-mini"),
        openrouter_base_url=(
            _clean_env(os.getenv("OPENROUTER_BASE_URL")) or "https://openrouter.ai/api/v1"
        ),
        openrouter_referer=_clean_env(os.getenv("OPENROUTER_REFERER")),
        openrouter_title=_clean_env(os.getenv("OPENROUTER_TITLE")),
        openrouter_fallback_models=[
            item.strip()
            for item in os.getenv("OPENROUTER_FALLBACK_MODELS", "").split(",")
            if item.strip()
        ],
        openrouter_max_retries=_parse_int(os.getenv("OPENROUTER_MAX_RETRIES"), default=2),
        openrouter_retry_backoff=_parse_float(os.getenv("OPENROUTER_RETRY_BACKOFF"), default=0.6),
        smtp_host=_clean_env(os.getenv("SMTP_HOST")),
        smtp_port=smtp_port,
        smtp_username=_clean_env(os.getenv("SMTP_USERNAME")),
        smtp_password=_clean_env(os.getenv("SMTP_PASSWORD")),
        smtp_from=_clean_env(os.getenv("SMTP_FROM")),
        smtp_to=_clean_env(os.getenv("SMTP_TO")),
        smtp_use_tls=smtp_use_tls,
        smtp_use_ssl=smtp_use_ssl,
        smtp_timeout_seconds=_parse_int(os.getenv("SMTP_TIMEOUT_SECONDS"), default=20),
    )
