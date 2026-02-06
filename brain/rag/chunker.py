"""
Prime PenTrix - Text Chunking Engine
=====================================
Simple paragraph-based chunking with sentence-aware boundaries.
No ML dependencies - pure Python text splitting.

Strategies:
- paragraph: Groups paragraphs into ~500 char chunks (default, best for RAG)
- sentence: Sentence-aware splitting with overlap
- fixed: Fixed-size character splitting
"""

import re
import logging
from typing import List, Dict, Optional
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)


@dataclass
class Chunk:
    """Represents a text chunk with metadata."""

    content: str
    chunk_index: int
    page_number: Optional[int] = None
    start_char: int = 0
    end_char: int = 0
    metadata: dict = field(default_factory=dict)

    def __len__(self) -> int:
        return len(self.content)


class ChunkingEngine:
    """
    Text chunking engine for RAG document processing.

    Features:
    - Paragraph-based chunking (avoids splitting mid-paragraph)
    - Sentence-aware fallback for large paragraphs
    - Configurable overlap for context continuity
    - Page number estimation for PDFs
    """

    # Common abbreviations to avoid false sentence splits
    ABBREVIATIONS = frozenset([
        "Mr.", "Mrs.", "Ms.", "Dr.", "Prof.", "Inc.", "Ltd.", "Corp.",
        "Jr.", "Sr.", "e.g.", "i.e.", "etc.", "vs.", "fig.", "approx.",
        "dept.", "est.", "vol.", "No.", "St.", "Ave.",
    ])

    def __init__(
        self,
        chunk_size: int = 500,
        chunk_overlap: int = 50,
        min_chunk_size: int = 50,
    ):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.min_chunk_size = min_chunk_size

    def chunk_text(
        self,
        text: str,
        page_count: int = 1,
        strategy: str = "paragraph",
    ) -> List[Chunk]:
        """
        Chunk text using the specified strategy.

        Strategies:
        - "paragraph": Paragraph-based (default, best for RAG)
        - "sentence": Sentence-aware splitting
        - "fixed": Fixed-size character splitting
        """
        if not text or not text.strip():
            return []

        text = text.strip()

        if strategy == "sentence":
            chunks = self._chunk_by_sentences(text)
        elif strategy == "fixed":
            chunks = self._chunk_fixed(text)
        else:  # "paragraph" (default)
            chunks = self._chunk_by_paragraphs(text)

        # Assign page numbers for PDFs
        if page_count > 1:
            self._assign_page_numbers(chunks, text, page_count)

        # Filter out tiny chunks
        chunks = [
            c for c in chunks
            if len(c.content.strip()) >= self.min_chunk_size
        ]

        # Re-index after filtering
        for i, chunk in enumerate(chunks):
            chunk.chunk_index = i

        avg_size = (
            sum(len(c) for c in chunks) // max(len(chunks), 1)
        )
        logger.info(f"Created {len(chunks)} chunks (avg {avg_size} chars)")

        return chunks

    # ── Paragraph-Based Chunking (Default) ──────────────────

    def _chunk_by_paragraphs(self, text: str) -> List[Chunk]:
        """
        Paragraph-based chunking.
        Groups paragraphs into chunks of ~chunk_size characters.
        Large paragraphs are sub-chunked by sentences.
        """
        paragraphs = re.split(r"\n\s*\n", text)
        paragraphs = [p.strip() for p in paragraphs if p.strip()]

        chunks: List[Chunk] = []
        current_parts: List[str] = []
        current_length = 0
        char_offset = 0

        for para in paragraphs:
            para_len = len(para)

            # If single paragraph exceeds chunk_size, sub-chunk it
            if para_len > self.chunk_size:
                # Flush current buffer first
                if current_parts:
                    chunk_text = "\n\n".join(current_parts)
                    start = text.find(current_parts[0], char_offset)
                    if start == -1:
                        start = char_offset
                    chunks.append(Chunk(
                        content=chunk_text,
                        chunk_index=len(chunks),
                        start_char=start,
                        end_char=start + len(chunk_text),
                    ))
                    char_offset = start + len(chunk_text)
                    current_parts = []
                    current_length = 0

                # Sub-chunk the large paragraph using sentences
                sub_chunks = self._chunk_by_sentences(para)
                for sc in sub_chunks:
                    sc.start_char += char_offset
                    sc.end_char += char_offset
                    sc.chunk_index = len(chunks)
                    chunks.append(sc)
                char_offset += para_len
                continue

            # Check if adding this paragraph exceeds chunk_size
            if current_length + para_len > self.chunk_size and current_parts:
                chunk_text = "\n\n".join(current_parts)
                start = text.find(current_parts[0], char_offset)
                if start == -1:
                    start = char_offset
                chunks.append(Chunk(
                    content=chunk_text,
                    chunk_index=len(chunks),
                    start_char=start,
                    end_char=start + len(chunk_text),
                ))
                char_offset = start + len(chunk_text)
                current_parts = []
                current_length = 0

            current_parts.append(para)
            current_length += para_len + 2  # +2 for \n\n

        # Flush remaining
        if current_parts:
            chunk_text = "\n\n".join(current_parts)
            start = text.find(current_parts[0], char_offset)
            if start == -1:
                start = char_offset
            chunks.append(Chunk(
                content=chunk_text,
                chunk_index=len(chunks),
                start_char=start,
                end_char=start + len(chunk_text),
            ))

        return chunks

    # ── Sentence-Based Chunking ─────────────────────────────

    def _chunk_by_sentences(self, text: str) -> List[Chunk]:
        """
        Sentence-aware chunking with overlap.
        Groups sentences into chunks of ~chunk_size.
        """
        sentences = self._split_sentences(text)

        chunks: List[Chunk] = []
        current_parts: List[str] = []
        current_length = 0
        char_offset = 0

        for sentence in sentences:
            sentence_len = len(sentence)

            if (
                current_length + sentence_len > self.chunk_size
                and current_parts
            ):
                chunk_text = " ".join(current_parts)
                start = text.find(current_parts[0], char_offset)
                if start == -1:
                    start = char_offset

                chunks.append(Chunk(
                    content=chunk_text,
                    chunk_index=len(chunks),
                    start_char=start,
                    end_char=start + len(chunk_text),
                ))

                # Keep overlap
                overlap_parts: List[str] = []
                overlap_len = 0
                for part in reversed(current_parts):
                    if overlap_len + len(part) > self.chunk_overlap:
                        break
                    overlap_parts.insert(0, part)
                    overlap_len += len(part) + 1

                current_parts = overlap_parts
                current_length = overlap_len
                char_offset = start + len(chunk_text) - overlap_len

            current_parts.append(sentence)
            current_length += sentence_len + 1

        # Last chunk
        if current_parts:
            chunk_text = " ".join(current_parts)
            start = text.find(current_parts[0], char_offset)
            if start == -1:
                start = max(0, len(text) - len(chunk_text))
            chunks.append(Chunk(
                content=chunk_text,
                chunk_index=len(chunks),
                start_char=start,
                end_char=start + len(chunk_text),
            ))

        return chunks

    # ── Fixed-Size Chunking ─────────────────────────────────

    def _chunk_fixed(self, text: str) -> List[Chunk]:
        """Simple fixed-size chunking with overlap."""
        chunks: List[Chunk] = []
        start = 0

        while start < len(text):
            end = start + self.chunk_size
            chunk_text = text[start:end]

            # Try to break at a sentence boundary
            if end < len(text):
                last_period = max(
                    chunk_text.rfind(". "),
                    chunk_text.rfind("! "),
                    chunk_text.rfind("? "),
                    chunk_text.rfind(".\n"),
                )
                if last_period > self.chunk_size * 0.5:
                    end = start + last_period + 1
                    chunk_text = text[start:end]

            chunks.append(Chunk(
                content=chunk_text.strip(),
                chunk_index=len(chunks),
                start_char=start,
                end_char=end,
            ))

            start = end - self.chunk_overlap
            if start >= len(text):
                break

        return chunks

    # ── Helpers ──────────────────────────────────────────────

    def _split_sentences(self, text: str) -> List[str]:
        """Split text into sentences, handling common abbreviations."""
        # Replace abbreviations temporarily
        placeholders: Dict[str, str] = {}
        for i, abbr in enumerate(self.ABBREVIATIONS):
            placeholder = f"__ABBR{i}__"
            placeholders[placeholder] = abbr
            text = text.replace(abbr, placeholder)

        # Split on sentence boundaries
        sentences = re.split(r"(?<=[.!?])\s+", text)

        # Restore abbreviations
        restored = []
        for sentence in sentences:
            for placeholder, abbr in placeholders.items():
                sentence = sentence.replace(placeholder, abbr)
            sentence = sentence.strip()
            if sentence:
                restored.append(sentence)

        return restored

    def _assign_page_numbers(
        self,
        chunks: List[Chunk],
        full_text: str,
        page_count: int,
    ) -> None:
        """Estimate page numbers for chunks based on character position."""
        if page_count <= 1:
            for chunk in chunks:
                chunk.page_number = 1
            return

        text_length = len(full_text)
        chars_per_page = text_length / page_count

        for chunk in chunks:
            page = int(chunk.start_char / chars_per_page) + 1
            chunk.page_number = min(page, page_count)
