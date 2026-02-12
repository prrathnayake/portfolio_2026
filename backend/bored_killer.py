from __future__ import annotations

from functools import lru_cache
from pathlib import Path


_SYSTEM_PROMPT_FILE = "bored_killer_system.md"
_USER_PROMPT_TEMPLATE_FILE = "bored_killer_user.md"
_BASE_PROFILE_FILE = "bored_killer_profile_base.md"

_CATEGORY_PROFILE_FILES = {
    "Backend engineering": "bored_killer_profile_backend_engineering.md",
    "AI and automation": "bored_killer_profile_ai_and_automation.md",
    "Cybersecurity": "bored_killer_profile_cybersecurity.md",
    "Developer productivity": "bored_killer_profile_developer_productivity.md",
}


@lru_cache(maxsize=32)
def _read_prompt_file(path_str: str) -> str:
    path = Path(path_str)
    try:
        content = path.read_text(encoding="utf-8").strip()
    except FileNotFoundError as exc:
        raise RuntimeError(f"Bored Killer prompt file not found: {path}") from exc
    except OSError as exc:
        raise RuntimeError(f"Could not read Bored Killer prompt file: {path}") from exc

    if not content:
        raise RuntimeError(f"Bored Killer prompt file is empty: {path}")
    return content


def _load_prompt(prompts_dir: Path, filename: str) -> str:
    prompt_path = (prompts_dir / filename).resolve()
    return _read_prompt_file(str(prompt_path))


def build_bored_fact_messages(*, category: str, prompts_dir: Path) -> list[dict[str, str]]:
    category_file = _CATEGORY_PROFILE_FILES.get(
        category, _CATEGORY_PROFILE_FILES["Backend engineering"]
    )
    system_prompt = _load_prompt(prompts_dir, _SYSTEM_PROMPT_FILE)
    user_template = _load_prompt(prompts_dir, _USER_PROMPT_TEMPLATE_FILE)
    base_profile = _load_prompt(prompts_dir, _BASE_PROFILE_FILE)
    category_profile = _load_prompt(prompts_dir, category_file)

    user_prompt = (
        user_template.replace("{{category}}", category)
        .replace("{{base_profile}}", base_profile)
        .replace("{{category_profile}}", category_profile)
        .strip()
    )

    return [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]
