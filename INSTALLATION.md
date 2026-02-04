# Installation & Setup

## Requirements

- Python 3.9+
- SMTP credentials for the contact form

## Setup

1. Create and activate a virtual environment:
   - `python3 -m venv .venv`
   - `source .venv/bin/activate`

2. Install dependencies:
   - `python -m pip install -r requirements.txt`

3. Configure environment variables:
   - `cp .env.example .env`
   - Edit `.env` and set SMTP + OpenRouter values as needed.

4. Run the app:
   - `python -m uvicorn backend.main:app --reload`

Then open `http://127.0.0.1:8000`.

## Optional AI Configuration

- Set `OPENROUTER_API_KEY` (and optionally `OPENROUTER_MODEL`).
- Use `OPENROUTER_FALLBACK_MODELS` for retrying alternate models.
- Adjust retry behavior with `OPENROUTER_MAX_RETRIES` and `OPENROUTER_RETRY_BACKOFF`.

## Security Controls (Optional)

- Protect endpoints with `API_ACCESS_TOKEN`.
- Tune rate limits with `RATE_LIMIT_WINDOW_SECONDS`, `RATE_LIMIT_CHAT_MAX`, and `RATE_LIMIT_CONTACT_MAX`.
- Control LLM logging with `LLM_LOG_ENABLED` and `LLM_LOG_REDACT`.

## Tests

- `python -m pytest -q`
