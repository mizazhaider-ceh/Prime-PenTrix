"""
Prime PenTrix - Brain API Configuration
Lightweight RAG: BM25 + OpenAI API Embeddings
"""

import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings for the lightweight Brain API."""

    # ── App ─────────────────────────────────────────────────
    app_name: str = "Prime PenTrix Brain API"
    version: str = "3.0.0"
    debug: bool = True

    # ── Database (PostgreSQL + pgvector) ────────────────────
    database_url: str = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:password@localhost:5432/prime_pentrix",
    )

    # ── OpenAI API (for embeddings only) ────────────────────
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    openai_embedding_model: str = "text-embedding-3-small"
    openai_embedding_dim: int = 1536
    openai_base_url: str = "https://api.openai.com/v1"

    # ── RAG Config ──────────────────────────────────────────
    chunk_size: int = 500          # Target characters per chunk
    chunk_overlap: int = 50        # Overlap between chunks
    max_context_chunks: int = 5    # Max chunks injected into prompt
    top_k: int = 10                # Search results to consider
    bm25_weight: float = 0.4      # BM25 weight in hybrid search
    semantic_weight: float = 0.6   # Semantic weight in hybrid search
    rrf_k: int = 60                # RRF constant

    # ── CORS ────────────────────────────────────────────────
    cors_origins: list = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
    ]

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
