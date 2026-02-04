from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from openai import OpenAI

from .rag import RagStore
from .settings import Settings


@lru_cache(maxsize=1)
def _load_system_prompt(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except Exception:
        return "You are a helpful assistant. Use only the provided context."


def answer_question(message: str, rag_store: RagStore, settings: Settings) -> dict:
    matches = rag_store.query(message, settings.rag_top_k)
    if not matches:
        return {
            "answer": "I don't have that information in my knowledge base yet.",
            "sources": [],
        }

    context_blocks = []
    sources = []
    for idx, (chunk, score) in enumerate(matches, start=1):
        context_blocks.append(f"[{idx}] {chunk.text}")
        sources.append(chunk.source)

    context = "\n\n".join(context_blocks)
    system_prompt = _load_system_prompt(settings.prompts_dir / "system.md")

    if not settings.openrouter_api_key:
        return {
            "answer": "AI is not configured. Add OPENROUTER_API_KEY in .env to enable full answers.\n\n"
            f"Relevant context:\n{context}",
            "sources": sources,
        }

    headers = {}
    if settings.openrouter_referer:
        headers["HTTP-Referer"] = settings.openrouter_referer
    if settings.openrouter_title:
        headers["X-Title"] = settings.openrouter_title

    client = OpenAI(
        api_key=settings.openrouter_api_key,
        base_url=settings.openrouter_base_url,
        default_headers=headers or None,
    )
    user_prompt = (
        "Use the following context to answer the question.\n\n"
        f"Context:\n{context}\n\n"
        f"Question: {message}\n\n"
        "Answer in a concise, professional tone."
    )

    response = client.chat.completions.create(
        model=settings.openrouter_model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.2,
    )

    answer = response.choices[0].message.content or ""
    return {"answer": answer.strip(), "sources": sources}
