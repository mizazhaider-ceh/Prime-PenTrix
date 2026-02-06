"""
Prime PenTrix - Database Connector
===================================
PostgreSQL with pgvector support using psycopg2-binary.
Lightweight sync driver (no asyncpg dependency).

Tables used (created by Prisma in web/):
- documents: Document metadata
- document_chunks: Text chunks with embeddings (pgvector)
"""

import json
import logging
from typing import List, Dict, Any, Optional, Tuple
from contextlib import contextmanager

import psycopg2
import psycopg2.extras
from psycopg2.pool import ThreadedConnectionPool

from config import settings

logger = logging.getLogger(__name__)

# ── Connection Pool ─────────────────────────────────────────

_pool: Optional[ThreadedConnectionPool] = None


def init_db() -> ThreadedConnectionPool:
    """Initialize database connection pool."""
    global _pool

    if _pool is not None:
        return _pool

    logger.info("Connecting to database...")

    _pool = ThreadedConnectionPool(
        minconn=2,
        maxconn=10,
        dsn=settings.database_url,
    )

    # Ensure pgvector extension exists
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("CREATE EXTENSION IF NOT EXISTS vector")
            conn.commit()

    logger.info("✅ Database connection pool created (psycopg2)")
    return _pool


def close_db() -> None:
    """Close database connection pool."""
    global _pool
    if _pool:
        _pool.closeall()
        _pool = None
        logger.info("Database connection pool closed")


@contextmanager
def get_connection():
    """Get a connection from the pool (context manager)."""
    if _pool is None:
        init_db()

    conn = _pool.getconn()
    try:
        yield conn
    finally:
        _pool.putconn(conn)


# ═══════════════════════════════════════════════════════════════
# DOCUMENT OPERATIONS
# ═══════════════════════════════════════════════════════════════


def update_document_status(
    document_id: str,
    status: str,
    error_message: Optional[str] = None,
    processed_at: Optional[str] = None,
) -> None:
    """Update document processing status."""
    with get_connection() as conn:
        with conn.cursor() as cur:
            if processed_at:
                cur.execute(
                    """
                    UPDATE documents
                    SET status = %s, "errorMessage" = %s, "processedAt" = NOW()
                    WHERE id = %s::uuid
                    """,
                    (status, error_message, document_id),
                )
            else:
                cur.execute(
                    """
                    UPDATE documents
                    SET status = %s, "errorMessage" = %s
                    WHERE id = %s::uuid
                    """,
                    (status, error_message, document_id),
                )
            conn.commit()


def delete_chunks_for_document(document_id: str) -> Tuple[int, List[str]]:
    """Delete all chunks for a document. Returns (count deleted, chunk IDs)."""
    with get_connection() as conn:
        with conn.cursor() as cur:
            # First get the chunk IDs before deleting
            cur.execute(
                """
                SELECT id FROM document_chunks
                WHERE "documentId" = %s::uuid
                """,
                (document_id,),
            )
            chunk_ids = [str(row[0]) for row in cur.fetchall()]
            
            # Now delete the chunks
            cur.execute(
                """
                DELETE FROM document_chunks
                WHERE "documentId" = %s::uuid
                """,
                (document_id,),
            )
            count = cur.rowcount
            conn.commit()
            return count, chunk_ids


# ═══════════════════════════════════════════════════════════════
# CHUNK STORAGE
# ═══════════════════════════════════════════════════════════════


def store_chunks(
    document_id: str,
    chunks: List[Dict[str, Any]],
) -> int:
    """
    Store document chunks with embeddings in PostgreSQL (pgvector).

    Args:
        document_id: UUID of parent document
        chunks: List of dicts with keys:
            - content: str
            - embedding: List[float] | None (1536-dim)
            - chunk_index: int
            - page_number: int | None
            - start_char: int | None
            - end_char: int | None

    Returns:
        Number of chunks stored
    """
    with get_connection() as conn:
        with conn.cursor() as cur:
            stored = 0
            for chunk in chunks:
                embedding = chunk.get("embedding")

                # Format embedding as pgvector string: [0.1, 0.2, ...]
                embedding_str = None
                if embedding:
                    embedding_str = (
                        "[" + ",".join(str(v) for v in embedding) + "]"
                    )

                cur.execute(
                    """
                    INSERT INTO document_chunks
                    (id, content, embedding, "chunkIndex", "pageNumber",
                     "startChar", "endChar", "documentId", "createdAt")
                    VALUES (
                        gen_random_uuid(), %s,
                        %s::vector(1536),
                        %s, %s, %s, %s, %s::uuid, NOW()
                    )
                    """,
                    (
                        chunk["content"],
                        embedding_str,
                        chunk["chunk_index"],
                        chunk.get("page_number"),
                        chunk.get("start_char"),
                        chunk.get("end_char"),
                        document_id,
                    ),
                )
                stored += 1

            conn.commit()
            return stored


# ═══════════════════════════════════════════════════════════════
# VECTOR SEARCH (pgvector cosine similarity)
# ═══════════════════════════════════════════════════════════════


def semantic_search(
    query_embedding: List[float],
    subject_id: str,
    user_id: str,
    top_k: int = 10,
    min_similarity: float = 0.3,
) -> List[Dict[str, Any]]:
    """
    Perform semantic search using pgvector cosine distance.

    Returns list of chunks with similarity scores, sorted by relevance.
    """
    if not query_embedding:
        return []

    embedding_str = "[" + ",".join(str(v) for v in query_embedding) + "]"

    with get_connection() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """
                SELECT
                    dc.id,
                    dc.content,
                    dc."chunkIndex" AS chunk_index,
                    dc."pageNumber" AS page_number,
                    dc."documentId" AS document_id,
                    d.filename,
                    d."originalName" AS original_name,
                    1 - (dc.embedding <=> %s::vector(1536)) AS similarity
                FROM document_chunks dc
                JOIN documents d ON d.id = dc."documentId"
                WHERE d."subjectId" = %s::uuid
                  AND d."userId" = %s
                  AND d.status = 'completed'
                  AND dc.embedding IS NOT NULL
                ORDER BY dc.embedding <=> %s::vector(1536)
                LIMIT %s
                """,
                (
                    embedding_str,
                    subject_id,
                    user_id,
                    embedding_str,
                    top_k,
                ),
            )

            rows = cur.fetchall()

    results = []
    for row in rows:
        similarity = float(row["similarity"])
        if similarity >= min_similarity:
            results.append({
                "id": str(row["id"]),
                "content": row["content"],
                "chunk_index": row["chunk_index"],
                "page_number": row["page_number"],
                "document_id": str(row["document_id"]),
                "filename": row["filename"],
                "original_name": row["original_name"],
                "similarity": similarity,
            })

    return results


# ═══════════════════════════════════════════════════════════════
# BM25 CHUNK RETRIEVAL
# ═══════════════════════════════════════════════════════════════


def get_all_chunks_for_subject(
    subject_id: str,
    user_id: str,
) -> List[Dict[str, Any]]:
    """
    Get all chunks for a subject/user (for BM25 index building).
    Returns chunk IDs, content, and document info.
    """
    with get_connection() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """
                SELECT
                    dc.id,
                    dc.content,
                    dc."chunkIndex" AS chunk_index,
                    dc."pageNumber" AS page_number,
                    dc."documentId" AS document_id,
                    d.filename,
                    d."originalName" AS original_name
                FROM document_chunks dc
                JOIN documents d ON d.id = dc."documentId"
                WHERE d."subjectId" = %s::uuid
                  AND d."userId" = %s
                  AND d.status = 'completed'
                ORDER BY d."uploadedAt" DESC, dc."chunkIndex" ASC
                """,
                (subject_id, user_id),
            )

            return [
                {
                    "id": str(row["id"]),
                    "content": row["content"],
                    "chunk_index": row["chunk_index"],
                    "page_number": row["page_number"],
                    "document_id": str(row["document_id"]),
                    "filename": row["filename"],
                    "original_name": row["original_name"],
                }
                for row in cur.fetchall()
            ]


def get_document_chunk_count(document_id: str) -> int:
    """Get the number of chunks for a document."""
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT COUNT(*) FROM document_chunks
                WHERE "documentId" = %s::uuid
                """,
                (document_id,),
            )
            return cur.fetchone()[0]
