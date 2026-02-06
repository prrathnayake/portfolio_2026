from backend import settings as settings_module


def test_settings_parse_docker_inline_comment_values(monkeypatch):
    monkeypatch.setenv("SMTP_USE_TLS", "\"true\"   # STARTTLS")
    monkeypatch.setenv("SMTP_USE_SSL", "\"false\"  # SMTPS")
    monkeypatch.setenv("SMTP_TIMEOUT_SECONDS", "\"20\"")
    monkeypatch.setenv("RAG_KNOWLEDGE_DIR", "\\\"/app/knowledge\\\"")

    settings_module.get_settings.cache_clear()
    settings = settings_module.get_settings()

    assert settings.smtp_use_tls is True
    assert settings.smtp_use_ssl is False
    assert settings.smtp_timeout_seconds == 20
    assert str(settings.rag_knowledge_dir) == "/app/knowledge"
