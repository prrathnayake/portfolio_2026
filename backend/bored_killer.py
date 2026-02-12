from __future__ import annotations

from textwrap import dedent


_BASE_PROFILE = dedent(
    """
    Pasan Rathnayake is a Graduate Software Engineer focused on AI systems, backend engineering,
    event-driven architecture, and automation workflows. Pasan works with Python, C++, JavaScript,
    SQL, Docker, Kafka, and modern API stacks. Pasan is based in Victoria, Australia and is available
    for graduate software engineering opportunities.
    """
).strip()


_CATEGORY_PROFILE_PROMPTS = {
    "Backend engineering": dedent(
        """
        Pasan builds backend APIs using Python and FastAPI, and has strong foundations in C++ systems
        development. Pasan has worked on distributed and event-driven workflows using Kafka, REST APIs,
        and service-oriented designs. Pasan also works with data stores like MySQL and MongoDB and
        emphasizes throughput, reliability, and clean service contracts.
        """
    ).strip(),
    "AI and automation": dedent(
        """
        Pasan builds AI-assisted workflows with LangChain, LangGraph, and modern LLM APIs including OpenAI.
        Pasan has experience creating practical automations and assistant features that combine prompting,
        orchestration, and backend integration. Pasan uses prompt engineering and local tooling to make
        AI outputs structured, useful, and production-ready.
        """
    ).strip(),
    "Cybersecurity": dedent(
        """
        Pasan has a Master of Information Technology focused on Cyber Security and applies secure coding
        and threat-aware thinking in software design. Pasan has practical familiarity with tools and
        concepts across vulnerability awareness, network analysis, and defensive engineering practices.
        Pasan integrates security habits into day-to-day engineering decisions.
        """
    ).strip(),
    "Developer productivity": dedent(
        """
        Pasan uses developer productivity tooling across Docker, Git workflows, GitHub Actions, logging,
        and API testing utilities to speed up delivery while maintaining quality. Pasan builds automation
        workflows and repeatable development practices that reduce manual work and improve iteration speed.
        Pasan values maintainable systems, clear structure, and efficient engineering handoffs.
        """
    ).strip(),
}


_TONE_PROMPTS = {
    "witty": "Use light and clean humor, but keep it professional and not sarcastic.",
    "surprising": "Highlight an unexpected or impressive angle from Pasan's background.",
    "practical": "Keep it grounded and useful, focusing on applied engineering value.",
}


_DETAIL_PROMPTS = {
    "quick": "Return exactly 1 sentence.",
    "deep": "Return exactly 2 short sentences.",
}


def build_bored_fact_messages(*, category: str, tone: str, detail: str) -> list[dict[str, str]]:
    category_profile = _CATEGORY_PROFILE_PROMPTS.get(category, _CATEGORY_PROFILE_PROMPTS["Backend engineering"])
    tone_prompt = _TONE_PROMPTS.get(tone, _TONE_PROMPTS["surprising"])
    detail_prompt = _DETAIL_PROMPTS.get(detail, _DETAIL_PROMPTS["quick"])

    system_prompt = dedent(
        """
        You are "Bored Killer", a tiny portfolio micro-assistant for Pasan Rathnayake.
        Task:
        - Generate a single fun fact about Pasan based only on the provided profile information.
        - Start the response with "Pasan".
        - Keep the output concise, clear, and in third person.
        - Do not use markdown, bullet points, headings, or prefacing text.
        - Do not invent employers, awards, years, or credentials not provided in the profile.
        """
    ).strip()

    user_prompt = dedent(
        f"""
        User preferences from UI:
        - Selected category: {category}
        - Preferred tone: {tone}
        - Preferred detail level: {detail}

        Pasan full profile summary:
        {_BASE_PROFILE}

        Category-specific profile summary:
        {category_profile}

        Style constraints:
        - {tone_prompt}
        - {detail_prompt}
        - Make it feel playful for developers.
        """
    ).strip()

    return [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]
