# Agent notes

- Always read all files in `.codex-memory/` at the start of each task.
- Update `.codex-memory/` at the end of each task with any new decisions or requirements.
- Do not store secrets in `.codex-memory/`.
- Keep `AGENT.md` and `AGENTS.md` in sync.
- Commit changes at the end of each task when a Git repo is available; if not, ask to initialize Git.
- `frontend/data/projects.json` supports a `github` link used to render repo icons.
- `prompts/guardrails.md` exists and is mirrored into `prompts/system.md`.
- Chat modal includes suggestion buttons (`data-chat-suggestions`) to prefill the input.
- `frontend/app.js` icon map includes extra project stack labels mapped to existing SVG icons.
