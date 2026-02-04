from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import TypedDict

from langgraph.graph import END, START, StateGraph
from openai import OpenAI

from .rag import RagStore
from .settings import Settings


class ChatState(TypedDict):
    question: str
    context: str
    sources: list[str]
    answer: str


@lru_cache(maxsize=1)
def _load_system_prompt(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except Exception:
        return "You are a helpful assistant. Use only the provided context."


def build_chat_graph(rag_store: RagStore, settings: Settings):
    graph = StateGraph(ChatState)

    def retrieve(state: ChatState) -> dict:
        matches = rag_store.query(state["question"], settings.rag_top_k)
        if not matches:
            return {"context": "", "sources": []}

        context_blocks = []
        sources = []
        for idx, (chunk, _) in enumerate(matches, start=1):
            context_blocks.append(f"[{idx}] {chunk.text}")
            sources.append(chunk.source)

        return {"context": "\n\n".join(context_blocks), "sources": sources}

    def generate(state: ChatState) -> dict:
        context = state.get("context", "").strip()
        if not context:
            return {"answer": "I don't have that information in my knowledge base yet."}

        if not settings.openrouter_api_key:
            return {
                "answer": "AI is not configured. Add OPENROUTER_API_KEY in .env to enable full answers.\n\n"
                f"Relevant context:\n{context}",
            }

        system_prompt = _load_system_prompt(settings.prompts_dir / "system.md")

        headers: dict[str, str] = {}
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
            f"Question: {state['question']}\n\n"
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
        return {"answer": answer.strip()}

    graph.add_node("retrieve", retrieve)
    graph.add_node("generate", generate)
    graph.add_edge(START, "retrieve")
    graph.add_edge("retrieve", "generate")
    graph.add_edge("generate", END)

    return graph.compile()
