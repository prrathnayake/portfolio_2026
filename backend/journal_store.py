from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path
from threading import Lock


_STORE_LOCK = Lock()


def _slugify(value: str) -> str:
    text = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return text[:72] or "journal-entry"


def _read_posts(path: Path) -> list[dict]:
    if not path.exists():
        return []
    raw = path.read_text(encoding="utf-8").strip()
    if not raw:
        return []
    payload = json.loads(raw)
    if not isinstance(payload, list):
        raise ValueError("Journal data must be a JSON array.")
    return [item for item in payload if isinstance(item, dict)]


def _write_posts(path: Path, posts: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(posts, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def _normalize_items(values: list[str]) -> list[str]:
    cleaned: list[str] = []
    for value in values:
        item = str(value).strip()
        if item:
            cleaned.append(item)
    return cleaned


def create_post(
    path: Path,
    *,
    title: str,
    summary: str,
    mood: str,
    read_time: str,
    tags: list[str],
    points: list[str],
) -> dict:
    normalized_points = _normalize_items(points)
    if not normalized_points:
        raise ValueError("Journal points are required.")

    normalized_tags = _normalize_items(tags)
    normalized_title = title.strip()
    normalized_summary = summary.strip()
    normalized_mood = mood.strip()
    normalized_read_time = read_time.strip()

    if not normalized_title:
        raise ValueError("Journal title is required.")
    if not normalized_summary:
        raise ValueError("Journal summary is required.")
    if not normalized_mood:
        raise ValueError("Journal mood is required.")
    if not normalized_read_time:
        raise ValueError("Journal read time is required.")

    with _STORE_LOCK:
        posts = _read_posts(path)
        existing_ids = {str(item.get("id", "")).strip() for item in posts}
        slug = _slugify(normalized_title)
        post_id = slug
        suffix = 2
        while post_id in existing_ids:
            post_id = f"{slug}-{suffix}"
            suffix += 1

        created_at = datetime.now(timezone.utc).date().isoformat()
        post = {
            "id": post_id,
            "title": normalized_title,
            "createdAt": created_at,
            "readTime": normalized_read_time,
            "mood": normalized_mood,
            "tags": normalized_tags,
            "summary": normalized_summary,
            "points": normalized_points,
        }
        posts.insert(0, post)
        _write_posts(path, posts)
        return post
