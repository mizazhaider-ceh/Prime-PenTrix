"""
Prime PenTrix - RAG Engine Package
Hybrid Retrieval-Augmented Generation with pgvector + BM25 + Cross-Encoder
"""

from .engine import RAGEngine, get_rag_engine
from .extractor import TextExtractor
from .chunker import ChunkingEngine, Chunk
from .database import (
    init_db,
    close_db,
    store_chunks,
    semantic_search,
    get_all_chunks_for_subject,
    update_document_status,
)

__all__ = [
    "RAGEngine",
    "get_rag_engine",
    "TextExtractor",
    "ChunkingEngine",
    "Chunk",
    "init_db",
    "close_db",
    "store_chunks",
    "semantic_search",
    "get_all_chunks_for_subject",
    "update_document_status",
]
