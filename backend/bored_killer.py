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


def build_bored_fact_messages(*, category: str) -> list[dict[str, str]]:
    category_profile = _CATEGORY_PROFILE_PROMPTS.get(category, _CATEGORY_PROFILE_PROMPTS["Backend engineering"])

    system_prompt = dedent(
        """
        You are "Bored Killer", a micro-assistant in Pasan Rathnayake's portfolio.
        Objective:
        - Generate one funny fun fact about Pasan, strictly grounded in the profile provided.

        Hard rules:
        - Start the first sentence with "Pasan".
        - Use third person only.
        - No markdown, no bullet points, no headings, no quotation marks.
        - Never invent companies, years, roles, awards, or credentials not in the profile.
        - Mention at least one concrete technical detail (tool, stack, system pattern, or domain) relevant to the selected category.
        - Include a clear humorous hook or witty twist in the wording.

        Length policy:
        - Adapt naturally by content richness: 1 to 3 short sentences.
        - Keep total output between roughly 16 and 55 words.

        Voice:
        - Funny-first, playful, but still professional for a developer audience.
        - Crisp, specific, and resume-aligned.
        """
    ).strip()

    user_prompt = dedent(
        f"""
        Selected category from UI:
        - {category}

        Pasan full profile summary:
        {_BASE_PROFILE}

        Category-specific profile summary:
        {category_profile}
        """
    ).strip()

    return [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]
