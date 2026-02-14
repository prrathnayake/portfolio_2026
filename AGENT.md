# Agent notes

- Always read all files in `.codex-memory/` at the start of each task.
- Update `.codex-memory/` at the end of each task with any new decisions or requirements.
- Do not store secrets in `.codex-memory/`.
- Keep `AGENT.md` and `AGENTS.md` in sync.
- Commit changes at the end of each task when a Git repo is available; if not, ask to initialize Git.
- `frontend/data/projects.json` supports a `github` link used to render repo icons.
- `prompts/guardrails.md` exists and is mirrored into `prompts/system.md`.
- System prompt requires third-person references to Pasan (e.g., “Pasan is…”).
- System prompt avoids “Based on Pasan’s …” phrasing; answer directly as “Pasan …”.
- Chat modal includes suggestion buttons (`data-chat-suggestions`) to prefill the input.
- `frontend/app.js` icon map includes extra project stack labels mapped to existing SVG icons.
- Optional security controls exist via `.env` (`API_ACCESS_TOKEN`, `RATE_LIMIT_*`, `LLM_LOG_*`).
- Installation/setup instructions live in `INSTALLATION.md`.
- Docker image publish workflow lives in `.github/workflows/docker-publish.yml`.
- Docker build test workflow lives in `.github/workflows/docker-build-test.yml`.
- SMTP supports `SMTP_TIMEOUT_SECONDS`; avoid inline comments in Docker env files.
- About section includes a right-to-left animated technical strengths snapshot ticker.
- Background includes animated floating technology/framework words in the current lo-fi style.
