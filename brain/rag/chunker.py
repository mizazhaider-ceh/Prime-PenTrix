"""
Prime PenTrix - Semantic Chunking Engine
Intelligent text chunking with overlap for RAG retrieval
"""

import re
import logging
from typing import List, Dict, Any, Optional
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
    Smart text chunking engine with multiple strategies.
    
    Features:
    - Sentence-aware chunking (avoids splitting mid-sentence)
    - Configurable overlap for context continuity
    - Page number tracking (for PDFs)
    - Heading-aware chunking for structured documents
    """

    def __init__(
        self,
        chunk_size: int = 500,
        chunk_overlap: int = 50,
        min_chunk_size: int = 50,
        respect_sentences: bool = True,
    ):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.min_chunk_size = min_chunk_size
        self.respect_sentences = respect_sentences

        # Sentence boundary patterns
        self._sentence_end = re.compile(
            r'(?<=[.!?])\s+(?=[A-Z])'  # Period/excl/question + space + capital
        )

        # Heading patterns (Markdown or plain text)
        self._heading = re.compile(
            r'^(?:#{1,6}\s+.+|[A-Z][A-Z\s]{5,}:?\s*$)',
            re.MULTILINE,
        )

    def chunk_text(
        self,
        text: str,
        page_count: int = 1,
        strategy: str = "sentence",
    ) -> List[Chunk]:
        """
        Chunk text using the specified strategy.
        
        Strategies:
        - "sentence": Sentence-aware chunking (default, best for RAG)
        - "fixed": Fixed-size character chunking  
        - "paragraph": Paragraph-based chunking
        """
        if not text or not text.strip():
            return []

        text = text.strip()

        if strategy == "paragraph":
            chunks = self._chunk_by_paragraphs(text)
        elif strategy == "fixed":
            chunks = self._chunk_fixed(text)
        else:  # "sentence" (default)
            chunks = self._chunk_by_sentences(text)

        # Assign page numbers if we have multiple pages
        if page_count > 1:
            self._assign_page_numbers(chunks, text, page_count)

        # Filter out chunks that are too small
        chunks = [c for c in chunks if len(c.content.strip()) >= self.min_chunk_size]

        # Re-index after filtering
        for i, chunk in enumerate(chunks):
            chunk.chunk_index = i

        logger.info(
            f"Created {len(chunks)} chunks "
            f"(avg {sum(len(c) for c in chunks) // max(len(chunks), 1)} chars)"
        )

        return chunks

    def _chunk_by_sentences(self, text: str) -> List[Chunk]:
        """
        Sentence-aware chunking.
        Splits text into sentences, then groups them into chunks
        of approximately chunk_size, never breaking mid-sentence.
        """
        # Split into sentences
        sentences = self._split_sentences(text)

        chunks = []
        current_chunk_parts: List[str] = []
        current_length = 0
        char_offset = 0

        for sentence in sentences:
            sentence_len = len(sentence)

            # If adding this sentence exceeds chunk_size and we have content
            if (
                current_length + sentence_len > self.chunk_size
                and current_chunk_parts
            ):
                # Finalize current chunk
                chunk_text = " ".join(current_chunk_parts)
                start = text.find(current_chunk_parts[0], char_offset)
                if start == -1:
                    start = char_offset

                chunks.append(
                    Chunk(
                        content=chunk_text,
                        chunk_index=len(chunks),
                        start_char=start,
                        end_char=start + len(chunk_text),
                    )
                )

                # Handle overlap: keep last N characters worth of sentences
                overlap_parts: List[str] = []
                overlap_len = 0
                for part in reversed(current_chunk_parts):
                    if overlap_len + len(part) > self.chunk_overlap:
                        break
                    overlap_parts.insert(0, part)
                    overlap_len += len(part) + 1  # +1 for space

                current_chunk_parts = overlap_parts
                current_length = overlap_len
                char_offset = start + len(chunk_text) - overlap_len

            current_chunk_parts.append(sentence)
            current_length += sentence_len + 1  # +1 for space

        # Don't forget the last chunk
        if current_chunk_parts:
            chunk_text = " ".join(current_chunk_parts)
            start = text.find(current_chunk_parts[0], char_offset)
            if start == -1:
                start = max(0, len(text) - len(chunk_text))

            chunks.append(
                Chunk(
                    content=chunk_text,
                    chunk_index=len(chunks),
                    start_char=start,
                    end_char=start + len(chunk_text),
                )
            )

        return chunks

    def _chunk_fixed(self, text: str) -> List[Chunk]:
        """Simple fixed-size chunking with overlap."""
        chunks = []
        start = 0

        while start < len(text):
            end = start + self.chunk_size
            chunk_text = text[start:end]

            # Try to break at a sentence boundary if possible
            if end < len(text) and self.respect_sentences:
                # Look for last sentence end within the chunk
                last_period = max(
                    chunk_text.rfind(". "),
                    chunk_text.rfind("! "),
                    chunk_text.rfind("? "),
                    chunk_text.rfind(".\n"),
                )
                if last_period > self.chunk_size * 0.5:
                    end = start + last_period + 1
                    chunk_text = text[start:end]

            chunks.append(
                Chunk(
                    content=chunk_text.strip(),
                    chunk_index=len(chunks),
                    start_char=start,
                    end_char=end,
                )
            )

            # Move forward with overlap
            start = end - self.chunk_overlap
            if start >= len(text):
                break

        return chunks

    def _chunk_by_paragraphs(self, text: str) -> List[Chunk]:
        """
        Paragraph-based chunking.
        Groups paragraphs into chunks, merging small paragraphs.
        """
        # Split by double newlines
        paragraphs = re.split(r"\n\s*\n", text)
        paragraphs = [p.strip() for p in paragraphs if p.strip()]

        chunks = []
        current_parts: List[str] = []
        current_length = 0
        char_offset = 0

        for para in paragraphs:
            para_len = len(para)

            # If single paragraph exceeds chunk_size, sub-chunk it
            if para_len > self.chunk_size:
                # Flush current buffer
                if current_parts:
                    chunk_text = "\n\n".join(current_parts)
                    start = text.find(current_parts[0], char_offset)
                    if start == -1:
                        start = char_offset
                    chunks.append(
                        Chunk(
                            content=chunk_text,
                            chunk_index=len(chunks),
                            start_char=start,
                            end_char=start + len(chunk_text),
                        )
                    )
                    char_offset = start + len(chunk_text)
                    current_parts = []
                    current_length = 0

                # Sub-chunk the large paragraph using sentence strategy
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
                chunks.append(
                    Chunk(
                        content=chunk_text,
                        chunk_index=len(chunks),
                        start_char=start,
                        end_char=start + len(chunk_text),
                    )
                )
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
            chunks.append(
                Chunk(
                    content=chunk_text,
                    chunk_index=len(chunks),
                    start_char=start,
                    end_char=start + len(chunk_text),
                )
            )

        return chunks

    def _split_sentences(self, text: str) -> List[str]:
        """Split text into sentences, handling common abbreviations."""
        # Simple sentence splitter that handles most cases
        # Avoid splitting on common abbreviations
        abbreviations = {
            "Mr.", "Mrs.", "Ms.", "Dr.", "Prof.",
            "Inc.", "Ltd.", "Corp.", "Jr.", "Sr.",
            "e.g.", "i.e.", "etc.", "vs.", "fig.",
            "approx.", "dept.", "est.", "vol.",
        }

        # Replace abbreviations temporarily
        placeholders = {}
        for i, abbr in enumerate(abbreviations):
            placeholder = f"__ABBR{i}__"
            placeholders[placeholder] = abbr
            text = text.replace(abbr, placeholder)

        # Split on sentence boundaries
        sentences = re.split(r'(?<=[.!?])\s+', text)

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
        """Estimate page numbers for each chunk based on position."""
        if page_count <= 1:
            for chunk in chunks:
                chunk.page_number = 1
            return

        text_length = len(full_text)
        chars_per_page = text_length / page_count

        for chunk in chunks:
            # Estimate page based on character position
            page = int(chunk.start_char / chars_per_page) + 1
            chunk.page_number = min(page, page_count)

    def compute_term_frequencies(self, text: str) -> Dict[str, float]:
        """
        Compute term frequency for BM25 index.
        Returns dict of {term: frequency}.
        """
        # Tokenize: lowercase, split on non-alphanumeric
        tokens = re.findall(r'\b[a-z0-9]+\b', text.lower())

        if not tokens:
            return {}

        # Count frequencies
        freq: Dict[str, int] = {}
        for token in tokens:
            freq[token] = freq.get(token, 0) + 1

        # Normalize by total tokens
        total = len(tokens)
        return {term: count / total for term, count in freq.items()}
