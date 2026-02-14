from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, EmailStr, Field


class ContactRequest(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    email: EmailStr
    subject: str = Field(min_length=1, max_length=120)
    message: str = Field(min_length=1, max_length=4000)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)


class BoredFactRequest(BaseModel):
    category: Literal[
        "Backend engineering",
        "AI and automation",
        "Cybersecurity",
        "Developer productivity",
    ]


class JournalPostCreateRequest(BaseModel):
    title: str = Field(min_length=4, max_length=140)
    summary: str = Field(min_length=12, max_length=500)
    mood: str = Field(min_length=2, max_length=40)
    read_time: str = Field(min_length=2, max_length=20)
    tags: list[str] = Field(default_factory=list)
    points: list[str] = Field(default_factory=list)
