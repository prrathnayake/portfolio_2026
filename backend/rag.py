from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

from pypdf import PdfReader
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


@dataclass(frozen=True)
class RagChunk:
    text: str
    source: str


@dataclass(frozen=True)
class RagStore:
    vectorizer: TfidfVectorizer
    matrix: object
    chunks: list[RagChunk]

    def query(self, query_text: str, top_k: int) -> list[tuple[RagChunk, float]]:
        if not query_text.strip() or not self.chunks:
            return []
        query_vec = self.vectorizer.transform([query_text])
        scores = cosine_similarity(self.matrix, query_vec).ravel()
        top_indices = scores.argsort()[::-1][:top_k]
        results: list[tuple[RagChunk, float]] = []
        for idx in top_indices:
            score = float(scores[idx])
            if score <= 0:
                continue
            results.append((self.chunks[idx], score))
        return results


def build_rag_store(knowledge_dir: Path, *, chunk_size: int, chunk_overlap: int) -> RagStore | None:
    files = list(_iter_knowledge_files(knowledge_dir))
    if not files:
        return None

    chunks: list[RagChunk] = []
    for path in files:
        text = _read_text(path)
        if not text:
            continue
        for chunk in _chunk_text(text, chunk_size, chunk_overlap):
            chunks.append(RagChunk(text=chunk, source=_format_source(path, knowledge_dir)))

    if not chunks:
        return None

    vectorizer = TfidfVectorizer(stop_words="english", max_features=50000)
    matrix = vectorizer.fit_transform([c.text for c in chunks])
    return RagStore(vectorizer=vectorizer, matrix=matrix, chunks=chunks)


def _iter_knowledge_files(root: Path) -> Iterable[Path]:
    if not root.exists():
        return []
    allowed = {".txt", ".md", ".pdf", ".json", ".yaml", ".yml"}
    for path in root.rglob("*"):
        if path.name.startswith("."):
            continue
        if path.is_dir():
            continue
        if path.suffix.lower() in allowed:
            yield path


def _read_text(path: Path) -> str:
    if path.suffix.lower() == ".pdf":
        return _read_pdf(path)
    try:
        return path.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        return ""


def _read_pdf(path: Path) -> str:
    try:
        reader = PdfReader(str(path))
        pages = [page.extract_text() or "" for page in reader.pages]
        return "\n".join(pages)
    except Exception:
        return ""


def _chunk_text(text: str, chunk_size: int, chunk_overlap: int) -> Iterable[str]:
    text = " ".join(text.split())
    if not text:
        return []
    step = max(1, chunk_size - chunk_overlap)
    chunks: list[str] = []
    for start in range(0, len(text), step):
        chunk = text[start : start + chunk_size].strip()
        if len(chunk) < max(120, chunk_size // 4):
            continue
        chunks.append(chunk)
    return chunks


def _format_source(path: Path, knowledge_dir: Path) -> str:
    try:
        return str(path.relative_to(knowledge_dir))
    except Exception:
        return path.name
