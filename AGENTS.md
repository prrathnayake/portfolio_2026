# Repository Guidelines

This repository contains a single-page developer portfolio with a FastAPI backend and static frontend assets. Use the sections below to keep contributions consistent and easy to review.

## Project Structure & Module Organization
- `backend/`: FastAPI app (`main.py`), settings/env loading (`settings.py`), request schemas (`schemas.py`), and SMTP email delivery (`emailer.py`).
- `frontend/`: Static site served by FastAPI. Key files are `index.html`, `styles.css`, and `app.js`.
- `frontend/assets/`: Site assets (favicon, optional `resume.pdf`).
- `frontend/data/`: Optional `projects.json` used to populate the Projects section (supports a `github` link for the repo icon).
- `prompts/`: LLM system prompt (`system.md`) plus guardrails (`guardrails.md`), keep them aligned.
- `prompts/system.md` must address Pasan in third person.
- `prompts/system.md` avoids “Based on Pasan’s …” phrasing; answers should start with “Pasan …”.
- `tests/`: Pytest suite (API validation and contact form behavior).
- `knowledge/`: Source/reference materials not served by the app.
- `INSTALLATION.md`: Setup/run/test instructions (README should not duplicate install steps).
- `.github/workflows/`: CI workflows (including Docker image publishing).

## Build, Test, and Development Commands
- Create env + install deps:
  - `python3 -m venv .venv`
  - `source .venv/bin/activate`
  - `python -m pip install -r requirements.txt`
- Configure env: `cp .env.example .env` and set SMTP values.
- Run locally: `python -m uvicorn backend.main:app --reload` (serves on `http://127.0.0.1:8000`).
- Tests: `python -m pytest -q`.

## Coding Style & Naming Conventions
- Python: 4-space indent, type hints where practical, snake_case modules/functions.
- Frontend: vanilla HTML/CSS/JS, 2-space indent in `frontend/` files.
- CSS uses BEM-ish class names (`block__element`).
- No formatter/linter is configured—match existing style and keep diffs tidy.

## Testing Guidelines
- Framework: `pytest` + FastAPI `TestClient`.
- Location: `tests/`, filenames `test_*.py`.
- Add tests for new endpoints, including validation and error cases.
- No coverage gate currently enforced.

## Commit & Pull Request Guidelines
- No Git history is available in this workspace; use clear, imperative messages (e.g., `backend: handle SMTP errors`).
- PRs should include: a short summary, test command(s) run, and screenshots for UI changes.

## Configuration & Security
- Secrets live only in `.env`; never commit it.
- Update `.env.example` when adding new config keys.
- `frontend/assets/resume.pdf` is optional; remove the link in `frontend/index.html` if not used.
- Optional security controls: `API_ACCESS_TOKEN` for protected endpoints, rate limiting via `RATE_LIMIT_*`, and LLM logging controls via `LLM_LOG_*`.
- SMTP supports `SMTP_TIMEOUT_SECONDS`; avoid inline comments on env value lines for Docker `--env-file`.

## Agent Notes
- Always read all files in `.codex-memory/` at the start of each task.
- Update `.codex-memory/` at the end of each task with any new decisions or requirements.
- Do not store secrets in `.codex-memory/`.
- Keep `AGENT.md` and `AGENTS.md` in sync.
- Commit changes at the end of each task when a Git repo is available; if not, ask to initialize Git.
- Chat modal includes suggestion buttons in `frontend/index.html` (`data-chat-suggestions`) that prefill the input.
- `frontend/app.js` icon map includes extra project stack labels mapped to existing SVG icons.
