# Pasan — Developer Portfolio

Single-page developer portfolio (dark theme) with a FastAPI backend and an SMTP-backed contact form.

## Quickstart

1. Create a virtualenv and install deps:
   - `python3 -m venv .venv`
   - `source .venv/bin/activate`
   - `python -m pip install -r requirements.txt`

2. Configure env:
   - `cp .env.example .env`
   - Edit `.env` with your SMTP details.

3. Run:
   - `python -m uvicorn backend.main:app --reload`

Then open `http://127.0.0.1:8000`.

## AI Agent (RAG)

On startup, the app reads all files in the `knowledge/` folder, builds a vector embedding store, and uses a LangGraph-based agent to answer questions in the “Ask AI about me” chat window.

Optional OpenRouter config (for higher‑quality answers):
- Add `OPENROUTER_API_KEY` and optionally `OPENROUTER_MODEL` in `.env`.

If no OpenRouter key is set, the API returns a helpful fallback message plus relevant context snippets.

**Note:** LangGraph requires Python 3.10+.

## Tests

- `python -m pytest -q`

## Resume

The site expects an optional resume at `frontend/assets/resume.pdf` (linked from the Home section).
Replace it with your latest PDF (or delete the link in `frontend/index.html`).

## Environment variables

All secrets/config live in `.env` (never commit it).

- `RAG_KNOWLEDGE_DIR`, `RAG_CHUNK_SIZE`, `RAG_CHUNK_OVERLAP`, `RAG_TOP_K`
- `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, `OPENROUTER_BASE_URL`, `OPENROUTER_REFERER`, `OPENROUTER_TITLE`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`
- `SMTP_FROM`, `SMTP_TO`
- `SMTP_USE_TLS` (STARTTLS) or `SMTP_USE_SSL` (SMTPS)
