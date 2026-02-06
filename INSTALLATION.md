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
   - Keep one `KEY=VALUE` per line (avoid inline comments after values when using Docker `--env-file`).

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

## SMTP Notes

- Use `SMTP_USE_TLS=true` for port `587` providers.
- Use `SMTP_USE_SSL=true` for port `465` providers.
- Adjust SMTP connection timeout with `SMTP_TIMEOUT_SECONDS` (default `20`).

## Tests

- `python -m pytest -q`

## Docker

1. Build the image:
   - `docker build -t pasan-portfolio .`

2. Run the container:
   - `docker run --rm -p 80:80 --env-file .env pasan-portfolio`

Then open `http://127.0.0.1:8000`.

## CI Docker Publish

On pushes to `main`, GitHub Actions builds and publishes a Docker image to Docker Hub.

Required GitHub secrets:
- `DOCKERHUB_USERNAME`
- `DOCKERHUB_TOKEN` (access token)

## CI Docker Build Test

Pull requests to `main` run a Docker build to validate the image can be built.
