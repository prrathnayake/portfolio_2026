from __future__ import annotations

import time
from typing import Any

import httpx

from .logging_utils import log_llm_error, log_llm_request, log_llm_response
from .settings import Settings


def openrouter_chat_completion(
    settings: Settings,
    *,
    messages: list[dict[str, Any]],
    temperature: float = 0.2,
    timeout_seconds: float = 20,
) -> str:
    if not settings.openrouter_api_key:
        raise RuntimeError("OpenRouter API key is not configured.")

    headers: dict[str, str] = {
        "Authorization": f"Bearer {settings.openrouter_api_key}",
    }
    if settings.openrouter_referer:
        headers["HTTP-Referer"] = settings.openrouter_referer
    if settings.openrouter_title:
        headers["X-Title"] = settings.openrouter_title

    base_payload = {
        "messages": messages,
        "temperature": temperature,
    }

    url = settings.openrouter_base_url.rstrip("/") + "/chat/completions"
    models = [settings.openrouter_model] + settings.openrouter_fallback_models

    last_response: httpx.Response | None = None
    last_error: Exception | None = None

    with httpx.Client(timeout=timeout_seconds) as client:
        for model in models:
            payload = {**base_payload, "model": model}
            log_llm_request(model=model, url=url, messages=payload["messages"])
            response = _post_with_retries(
                client,
                url,
                headers,
                payload,
                max_retries=settings.openrouter_max_retries,
                backoff=settings.openrouter_retry_backoff,
            )
            last_response = response

            if response.status_code >= 400:
                log_llm_error(
                    model=model,
                    status_code=response.status_code,
                    message=_extract_response_text(response),
                )
                if model != models[-1]:
                    continue
                raise RuntimeError(_format_openrouter_error(response))

            try:
                data = response.json()
                content = data["choices"][0]["message"]["content"]
                answer = str(content or "").strip()
                log_llm_response(model=model, status_code=response.status_code, content=answer)
                return answer
            except Exception as exc:
                last_error = exc
                if model != models[-1]:
                    continue
                raise RuntimeError("OpenRouter returned an unexpected response.") from exc

    if last_response is not None:
        raise RuntimeError(_format_openrouter_error(last_response))
    if last_error is not None:
        raise RuntimeError("OpenRouter request failed.") from last_error
    raise RuntimeError("OpenRouter request failed.")


def _format_openrouter_error(response: httpx.Response) -> str:
    try:
        data = response.json()
        error = data.get("error") if isinstance(data, dict) else None
        if isinstance(error, dict):
            message = error.get("message") or error.get("code") or str(error)
        else:
            message = data.get("message") if isinstance(data, dict) else None
        message = message or response.text or "Unknown error"
    except Exception:
        message = response.text or "Unknown error"
    return f"OpenRouter error {response.status_code}: {message}"


def _extract_response_text(response: httpx.Response) -> str:
    try:
        return response.text
    except Exception:
        return "Unable to read response text"


def _post_with_retries(
    client: httpx.Client,
    url: str,
    headers: dict[str, str],
    payload: dict[str, Any],
    *,
    max_retries: int,
    backoff: float,
) -> httpx.Response:
    attempt = 0
    while True:
        try:
            response = client.post(url, headers=headers, json=payload)
        except httpx.RequestError as exc:
            if attempt >= max_retries:
                raise RuntimeError(f"OpenRouter request error: {exc}") from exc
            time.sleep(backoff * (2**attempt))
            attempt += 1
            continue

        if response.status_code in {429, 500, 502, 503, 504} and attempt < max_retries:
            time.sleep(backoff * (2**attempt))
            attempt += 1
            continue

        return response
