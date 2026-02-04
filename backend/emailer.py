from __future__ import annotations

import smtplib
import ssl
from email.message import EmailMessage

from .schemas import ContactRequest
from .settings import Settings


def _sanitize_header(value: str) -> str:
    return " ".join(value.replace("\r", " ").replace("\n", " ").split()).strip()


def send_contact_email(payload: ContactRequest, settings: Settings) -> None:
    msg = EmailMessage()
    msg["Subject"] = _sanitize_header(f"[Portfolio] {payload.subject}")
    msg["From"] = settings.smtp_from
    msg["To"] = settings.smtp_to
    msg["Reply-To"] = _sanitize_header(str(payload.email))

    msg.set_content(
        "\n".join(
            [
                "New message from portfolio contact form",
                "",
                f"Name: {_sanitize_header(payload.name)}",
                f"Email: {_sanitize_header(str(payload.email))}",
                f"Subject: {_sanitize_header(payload.subject)}",
                "",
                "Message:",
                payload.message,
                "",
            ]
        )
    )

    context = ssl.create_default_context()

    if settings.smtp_use_ssl:
        with smtplib.SMTP_SSL(settings.smtp_host, settings.smtp_port, context=context) as server:
            server.login(settings.smtp_username, settings.smtp_password)
            server.send_message(msg)
        return

    with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
        if settings.smtp_use_tls:
            server.starttls(context=context)
        server.login(settings.smtp_username, settings.smtp_password)
        server.send_message(msg)
