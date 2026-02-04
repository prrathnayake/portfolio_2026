from __future__ import annotations

import json
import logging
from functools import lru_cache
from logging.handlers import RotatingFileHandler
from pathlib import Path
from typing import Any


@lru_cache(maxsize=1)
def get_llm_logger() -> logging.Logger:
    root_dir = Path(__file__).resolve().parent.parent
    log_dir = root_dir / "logs"
    log_dir.mkdir(parents=True, exist_ok=True)
    log_path = log_dir / "llm_calls.log"

    logger = logging.getLogger("llm_calls")
    if logger.handlers:
        return logger

    logger.setLevel(logging.INFO)
    handler = RotatingFileHandler(
        log_path,
        maxBytes=5_000_000,
        backupCount=3,
        encoding="utf-8",
    )
    formatter = logging.Formatter("%(asctime)s %(levelname)s %(message)s")
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.propagate = False
    return logger


def log_llm_request(*, model: str, url: str, messages: list[dict[str, Any]]) -> None:
    logger = get_llm_logger()
    payload = {"event": "llm_request", "model": model, "url": url, "messages": messages}
    logger.info(json.dumps(payload, ensure_ascii=False))


def log_llm_response(*, model: str, status_code: int, content: str) -> None:
    logger = get_llm_logger()
    payload = {
        "event": "llm_response",
        "model": model,
        "status_code": status_code,
        "content": content,
    }
    logger.info(json.dumps(payload, ensure_ascii=False))


def log_llm_error(*, model: str, status_code: int, message: str) -> None:
    logger = get_llm_logger()
    payload = {
        "event": "llm_error",
        "model": model,
        "status_code": status_code,
        "message": message,
    }
    logger.error(json.dumps(payload, ensure_ascii=False))
