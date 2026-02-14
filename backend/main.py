from __future__ import annotations

from pathlib import Path
import time
import logging

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from .bored_killer import build_bored_fact_messages
from .emailer import send_contact_email
from .langgraph_agent import build_chat_graph
from .openrouter_client import openrouter_chat_completion
from .rag import build_rag_store
from .schemas import BoredFactRequest, ChatRequest, ContactRequest
from .settings import get_settings


ROOT_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = ROOT_DIR / "frontend"

app = FastAPI(title="Pasan Portfolio")
logger = logging.getLogger(__name__)

app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR)), name="static")

_RATE_LIMIT_STORE: dict[str, list[float]] = {}


def _get_client_id(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "unknown"


def _enforce_rate_limit(request: Request, *, bucket: str, limit: int, window_seconds: int) -> None:
    if limit <= 0 or window_seconds <= 0:
        return
    key = f"{bucket}:{_get_client_id(request)}"
    now = time.monotonic()
    timestamps = _RATE_LIMIT_STORE.get(key, [])
    cutoff = now - window_seconds
    timestamps = [ts for ts in timestamps if ts > cutoff]
    if len(timestamps) >= limit:
        raise HTTPException(status_code=429, detail="Too many requests. Please try again later.")
    timestamps.append(now)
    _RATE_LIMIT_STORE[key] = timestamps


def _require_api_key(request: Request, settings) -> None:
    token = settings.api_access_token
    if not token:
        return
    provided = _extract_auth_token(request)
    if not provided or provided != token:
        raise HTTPException(status_code=401, detail="Unauthorized.")


def _extract_auth_token(request: Request) -> str:
    header = request.headers.get("authorization") or request.headers.get("x-api-key") or ""
    header = header.strip()
    if header.lower().startswith("bearer "):
        return header.split(" ", 1)[1].strip()
    return header


@app.on_event("startup")
def load_rag_index() -> None:
    settings = get_settings()
    app.state.rag_store = build_rag_store(
        settings.rag_knowledge_dir,
        chunk_size=settings.rag_chunk_size,
        chunk_overlap=settings.rag_chunk_overlap,
    )
    app.state.chat_graph = None
    if app.state.rag_store is not None:
        app.state.chat_graph = build_chat_graph(app.state.rag_store, settings)


@app.get("/", include_in_schema=False)
def index() -> FileResponse:
    return FileResponse(FRONTEND_DIR / "index.html")


@app.get("/api/health")
def health() -> dict:
    return {"ok": True}


@app.post("/api/contact")
def contact(payload: ContactRequest, request: Request) -> dict:
    settings = get_settings()
    _require_api_key(request, settings)
    _enforce_rate_limit(
        request,
        bucket="contact",
        limit=settings.rate_limit_contact_max,
        window_seconds=settings.rate_limit_window_seconds,
    )
    if not settings.smtp_configured:
        raise HTTPException(status_code=503, detail="Email delivery is not configured.")

    try:
        send_contact_email(payload, settings)
    except Exception as exc:
        logger.exception("Contact email send failed")
        if settings.app_env.lower() == "development":
            raise HTTPException(
                status_code=502,
                detail=f"Failed to send email: {exc}",
            ) from exc
        raise HTTPException(status_code=502, detail="Failed to send email.") from exc

    return {"ok": True}


@app.post("/api/chat")
def chat(payload: ChatRequest, request: Request) -> dict:
    chat_graph = getattr(app.state, "chat_graph", None)
    settings = get_settings()
    _require_api_key(request, settings)
    _enforce_rate_limit(
        request,
        bucket="chat",
        limit=settings.rate_limit_chat_max,
        window_seconds=settings.rate_limit_window_seconds,
    )
    if chat_graph is None:
        raise HTTPException(status_code=503, detail="Knowledge base is not available.")

    try:
        state = chat_graph.invoke({"question": payload.message})
        return {"answer": state.get("answer", ""), "sources": state.get("sources", [])}
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail="AI request failed.") from exc


@app.post("/api/bored-fact")
def bored_fact(payload: BoredFactRequest, request: Request) -> dict:
    settings = get_settings()
    _require_api_key(request, settings)
    _enforce_rate_limit(
        request,
        bucket="chat",
        limit=settings.rate_limit_chat_max,
        window_seconds=settings.rate_limit_window_seconds,
    )

    try:
        messages = build_bored_fact_messages(
            category=payload.category,
            prompts_dir=settings.prompts_dir,
        )
        answer = openrouter_chat_completion(
            settings,
            messages=messages,
            temperature=0.5,
        )
        return {"answer": answer}
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail="AI request failed.") from exc
