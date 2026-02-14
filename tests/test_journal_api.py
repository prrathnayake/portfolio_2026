import json

import pytest
from fastapi.testclient import TestClient

from backend import settings as settings_module
from backend.main import app


@pytest.fixture()
def client():
    return TestClient(app)


def _configure_journal_env(monkeypatch: pytest.MonkeyPatch, *, token: str) -> None:
    monkeypatch.setenv("JOURNAL_ADMIN_TOKEN", token)
    monkeypatch.setenv("API_ACCESS_TOKEN", "")
    settings_module.get_settings.cache_clear()


def test_create_journal_requires_admin_token_config(client, monkeypatch: pytest.MonkeyPatch):
    _configure_journal_env(monkeypatch, token="")

    res = client.post(
        "/api/journal/posts",
        json={
            "title": "Test post",
            "summary": "This is a summary for validation.",
            "mood": "Build Log",
            "read_time": "2 min",
            "tags": ["Testing"],
            "points": ["Point one"],
        },
    )
    assert res.status_code == 503
    assert "Journal admin token is not configured" in res.json()["detail"]


def test_create_journal_requires_auth(client, monkeypatch: pytest.MonkeyPatch):
    _configure_journal_env(monkeypatch, token="journal-secret")

    res = client.post(
        "/api/journal/posts",
        json={
            "title": "Unauthorized post",
            "summary": "This should fail because auth header is missing.",
            "mood": "Security",
            "read_time": "3 min",
            "tags": ["Security"],
            "points": ["Point one"],
        },
    )
    assert res.status_code == 401


def test_create_journal_writes_post(client, monkeypatch: pytest.MonkeyPatch, tmp_path):
    _configure_journal_env(monkeypatch, token="journal-secret")
    journal_file = tmp_path / "journal_posts.json"
    journal_file.write_text("[]\n", encoding="utf-8")
    monkeypatch.setattr("backend.main.JOURNAL_POSTS_PATH", journal_file)

    res = client.post(
        "/api/journal/posts",
        headers={"Authorization": "Bearer journal-secret"},
        json={
            "title": "My production update",
            "summary": "I deployed a cleaner journal publishing flow for production updates.",
            "mood": "Ops",
            "read_time": "2 min",
            "tags": ["Deployment", "FastAPI"],
            "points": ["I added a secure endpoint.", "I validated payload structure."],
        },
    )

    assert res.status_code == 200
    payload = res.json()
    assert payload["ok"] is True
    assert payload["post"]["title"] == "My production update"
    assert payload["post"]["readTime"] == "2 min"

    stored = json.loads(journal_file.read_text(encoding="utf-8"))
    assert len(stored) == 1
    assert stored[0]["title"] == "My production update"
