import pytest
from fastapi.testclient import TestClient

from backend import settings as settings_module
from backend.main import app


@pytest.fixture()
def client():
    return TestClient(app)


def _configure_smtp_env(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("SMTP_HOST", "smtp.example.com")
    monkeypatch.setenv("SMTP_PORT", "587")
    monkeypatch.setenv("SMTP_USERNAME", "user")
    monkeypatch.setenv("SMTP_PASSWORD", "pass")
    monkeypatch.setenv("SMTP_FROM", "Portfolio <no-reply@example.com>")
    monkeypatch.setenv("SMTP_TO", "me@example.com")
    monkeypatch.setenv("SMTP_USE_TLS", "true")
    monkeypatch.setenv("SMTP_USE_SSL", "false")
    monkeypatch.setenv("API_ACCESS_TOKEN", "")
    monkeypatch.setenv("APP_ENV", "development")


def _configure_openrouter_env(monkeypatch: pytest.MonkeyPatch, key: str = "test-openrouter-key") -> None:
    monkeypatch.setenv("OPENROUTER_API_KEY", key)
    monkeypatch.setenv("API_ACCESS_TOKEN", "")


def test_contact_requires_config(client, monkeypatch: pytest.MonkeyPatch):
    # Ensure SMTP env vars are effectively "unset" even if a local .env exists.
    for k in [
        "SMTP_HOST",
        "SMTP_PORT",
        "SMTP_USERNAME",
        "SMTP_PASSWORD",
        "SMTP_FROM",
        "SMTP_TO",
        "SMTP_USE_TLS",
        "SMTP_USE_SSL",
    ]:
        monkeypatch.setenv(k, "")

    settings_module.get_settings.cache_clear()

    res = client.post(
        "/api/contact",
        json={
            "name": "Test",
            "email": "test@example.com",
            "subject": "Hello",
            "message": "Message",
        },
    )
    assert res.status_code == 503


def test_contact_sends_email(client, monkeypatch: pytest.MonkeyPatch):
    _configure_smtp_env(monkeypatch)
    settings_module.get_settings.cache_clear()

    # Prevent real SMTP.
    sent = {"called": False}

    def _fake_send(*args, **kwargs):
        sent["called"] = True

    monkeypatch.setattr("backend.main.send_contact_email", _fake_send)

    res = client.post(
        "/api/contact",
        json={
            "name": "Test User",
            "email": "test@example.com",
            "subject": "Hello",
            "message": "Message body",
        },
    )
    assert res.status_code == 200
    assert res.json() == {"ok": True}
    assert sent["called"] is True


def test_contact_validation(client):
    res = client.post(
        "/api/contact",
        json={"name": "", "email": "not-an-email", "subject": "", "message": ""},
    )
    assert res.status_code == 422


def test_contact_returns_debug_detail_in_development(client, monkeypatch: pytest.MonkeyPatch):
    _configure_smtp_env(monkeypatch)
    settings_module.get_settings.cache_clear()

    def _fake_send(*args, **kwargs):
        raise RuntimeError("SMTP AUTH failed")

    monkeypatch.setattr("backend.main.send_contact_email", _fake_send)

    res = client.post(
        "/api/contact",
        json={
            "name": "Test User",
            "email": "test@example.com",
            "subject": "Hello",
            "message": "Message body",
        },
    )
    assert res.status_code == 502
    assert "SMTP AUTH failed" in res.json()["detail"]


def test_bored_fact_requires_openrouter_key(client, monkeypatch: pytest.MonkeyPatch):
    _configure_openrouter_env(monkeypatch, key="")
    settings_module.get_settings.cache_clear()

    res = client.post(
        "/api/bored-fact",
        json={
            "category": "Backend engineering",
        },
    )
    assert res.status_code == 503
    assert "OpenRouter API key is not configured" in res.json()["detail"]


def test_bored_fact_uses_category_profile_prompt(client, monkeypatch: pytest.MonkeyPatch):
    _configure_openrouter_env(monkeypatch, key="fake-key")
    settings_module.get_settings.cache_clear()

    captured: dict = {}

    def _fake_openrouter(*args, **kwargs):
        captured["messages"] = kwargs.get("messages")
        captured["temperature"] = kwargs.get("temperature")
        return "Pasan pairs backend design with AI automation to ship features quickly."

    monkeypatch.setattr("backend.main.openrouter_chat_completion", _fake_openrouter)

    res = client.post(
        "/api/bored-fact",
        json={
            "category": "AI and automation",
        },
    )

    assert res.status_code == 200
    assert res.json()["answer"].startswith("Pasan")
    assert captured["temperature"] == 0.5
    assert isinstance(captured["messages"], list)
    assert "AI and automation" in str(captured["messages"])
