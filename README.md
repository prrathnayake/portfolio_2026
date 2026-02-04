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

## Tests

- `python -m pytest -q`

## Resume

The site expects an optional resume at `frontend/assets/resume.pdf` (linked from the Home section).
Replace it with your latest PDF (or delete the link in `frontend/index.html`).

## Environment variables

All secrets/config live in `.env` (never commit it).

- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`
- `SMTP_FROM`, `SMTP_TO`
- `SMTP_USE_TLS` (STARTTLS) or `SMTP_USE_SSL` (SMTPS)
