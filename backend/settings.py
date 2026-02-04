from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv


def _parse_bool(value: str | None, *, default: bool = False) -> bool:
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "y", "on"}


@dataclass(frozen=True)
class Settings:
    app_name: str
    app_env: str

    rag_knowledge_dir: Path
    rag_chunk_size: int
    rag_chunk_overlap: int
    rag_top_k: int
    prompts_dir: Path

    openai_api_key: str | None
    openai_model: str
    openai_base_url: str | None

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

    root_dir = Path(__file__).resolve().parent.parent
    knowledge_dir = Path(os.getenv("RAG_KNOWLEDGE_DIR", "knowledge"))
    if not knowledge_dir.is_absolute():
        knowledge_dir = root_dir / knowledge_dir

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
        rag_knowledge_dir=knowledge_dir,
        rag_chunk_size=int(os.getenv("RAG_CHUNK_SIZE", "800")),
        rag_chunk_overlap=int(os.getenv("RAG_CHUNK_OVERLAP", "160")),
        rag_top_k=int(os.getenv("RAG_TOP_K", "4")),
        prompts_dir=root_dir / "prompts",
        openai_api_key=os.getenv("OPENAI_API_KEY"),
        openai_model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
        openai_base_url=os.getenv("OPENAI_BASE_URL"),
        smtp_host=os.getenv("SMTP_HOST"),
        smtp_port=smtp_port,
        smtp_username=os.getenv("SMTP_USERNAME"),
        smtp_password=os.getenv("SMTP_PASSWORD"),
        smtp_from=os.getenv("SMTP_FROM"),
        smtp_to=os.getenv("SMTP_TO"),
        smtp_use_tls=smtp_use_tls,
        smtp_use_ssl=smtp_use_ssl,
    )
