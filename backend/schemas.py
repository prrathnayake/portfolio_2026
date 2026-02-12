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
