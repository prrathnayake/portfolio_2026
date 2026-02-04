from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from .emailer import send_contact_email
from .schemas import ContactRequest
from .settings import get_settings


ROOT_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = ROOT_DIR / "frontend"

app = FastAPI(title="Pasan Portfolio")

app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR)), name="static")


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
def chat_stub() -> dict:
    raise HTTPException(status_code=501, detail="Chatbot not implemented yet.")

