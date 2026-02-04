from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from .emailer import send_contact_email
from .langgraph_agent import build_chat_graph
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
    chat_graph = getattr(app.state, "chat_graph", None)
    if chat_graph is None:
        raise HTTPException(status_code=503, detail="Knowledge base is not available.")

    state = chat_graph.invoke({"question": payload.message})
    return {"answer": state.get("answer", ""), "sources": state.get("sources", [])}
