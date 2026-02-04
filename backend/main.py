from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from .chat import answer_question
from .emailer import send_contact_email
from .rag import build_rag_store
from .schemas import ChatRequest, ContactRequest
from .settings import get_settings


ROOT_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = ROOT_DIR / "frontend"

app = FastAPI(title="Pasan Portfolio")

app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR)), name="static")


@app.on_event("startup")
def load_rag_index() -> None:
    settings = get_settings()
    app.state.rag_store = build_rag_store(
        settings.rag_knowledge_dir,
        chunk_size=settings.rag_chunk_size,
        chunk_overlap=settings.rag_chunk_overlap,
    )


@app.get("/", include_in_schema=False)
def index() -> FileResponse:
    return FileResponse(FRONTEND_DIR / "index.html")


@app.get("/api/health")
def health() -> dict:
    return {"ok": True}


@app.post("/api/contact")
def contact(payload: ContactRequest) -> dict:
    settings = get_settings()
    if not settings.smtp_configured:
        raise HTTPException(status_code=503, detail="Email delivery is not configured.")

    try:
        send_contact_email(payload, settings)
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Failed to send email.") from exc

    return {"ok": True}


@app.post("/api/chat")
def chat(payload: ChatRequest) -> dict:
    rag_store = getattr(app.state, "rag_store", None)
    if rag_store is None:
        raise HTTPException(status_code=503, detail="Knowledge base is not available.")

    settings = get_settings()
    return answer_question(payload.message, rag_store, settings)
