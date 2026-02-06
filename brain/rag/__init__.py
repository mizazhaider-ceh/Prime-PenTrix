"""
Prime PenTrix - RAG Engine Package
Lightweight Hybrid RAG: BM25 + OpenAI API Embeddings + pgvector
NO sentence-transformers, NO torch, NO local models.
"""

from .engine import RAGEngine, get_rag_engine
from .extractor import TextExtractor
from .chunker import ChunkingEngine, Chunk
from .bm25 import BM25Index
from .embeddings import EmbeddingClient, get_embedding_client
from .query_expander import QueryExpander
from .database import (
    init_db,
    close_db,
    store_chunks,
    semantic_search,
    get_all_chunks_for_subject,
    update_document_status,
    delete_chunks_for_document,
    get_document_chunk_count,
)

__all__ = [
    # Engine
    "RAGEngine",
    "get_rag_engine",
    # Extraction & Chunking
    "TextExtractor",
    "ChunkingEngine",
    "Chunk",
    # Search components
    "BM25Index",
    "EmbeddingClient",
    "get_embedding_client",
    "QueryExpander",
    # Database
    "init_db",
    "close_db",
    "store_chunks",
    "semantic_search",
    "get_all_chunks_for_subject",
    "update_document_status",
    "delete_chunks_for_document",
    "get_document_chunk_count",
]
