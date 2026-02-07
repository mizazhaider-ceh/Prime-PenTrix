"""
Prime PenTrix - Brain API Configuration
Lightweight RAG: BM25 + OpenAI API Embeddings
"""

import os
import logging
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings for the lightweight Brain API."""

    # ── App ─────────────────────────────────────────────────
    app_name: str = "Prime PenTrix Brain API"
    version: str = "3.0.0"
    debug: bool = False  # SECURITY: Never enable in production!

    # ── Security ────────────────────────────────────────────
    brain_api_key: str = os.getenv("BRAIN_API_KEY", "")

    # ── Database (PostgreSQL + pgvector) ────────────────────
    database_url: str = os.getenv(
        "DATABASE_URL",
        "",  # SECURITY: No default password - must be set in .env!
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


# ═══════════════════════════════════════════════════════════════
# VALIDATE SETTINGS
# ═══════════════════════════════════════════════════════════════

settings = Settings()

# SECURITY: Validate critical settings
if not settings.database_url:
    raise ValueError(
        "DATABASE_URL is not set! Copy .env.example to .env and set a strong password."
    )

if "password@" in settings.database_url.lower():
    raise ValueError(
        "DATABASE_URL contains the default password 'password'! "
        "Use a strong password in your .env file."
    )

if settings.debug:
    logger = logging.getLogger("brain")
    logger.warning("⚠️  DEBUG MODE ENABLED - Never use in production!")

if not settings.brain_api_key:
    logger = logging.getLogger("brain")
    logger.warning(
        "⚠️  BRAIN_API_KEY not set! API has NO AUTHENTICATION. "
        "Generate one with: python -c 'import secrets; print(secrets.token_urlsafe(32))'"
    )


settings = Settings()
