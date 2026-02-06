"""
Prime PenTrix - Database Connector
Async PostgreSQL with pgvector support for Brain API
"""

import json
import logging
from typing import List, Dict, Any, Optional
from contextlib import asynccontextmanager

import asyncpg
from pgvector.asyncpg import register_vector

from config import settings

logger = logging.getLogger(__name__)

# Global connection pool
_pool: Optional[asyncpg.Pool] = None


async def init_db() -> asyncpg.Pool:
    """Initialize database connection pool with pgvector support."""
    global _pool

    if _pool is not None:
        return _pool

    logger.info(f"Connecting to database...")

    _pool = await asyncpg.create_pool(
        dsn=settings.database_url,
        min_size=2,
        max_size=10,
        init=_init_connection,
    )

    logger.info("✅ Database connection pool created")
    return _pool


async def _init_connection(conn: asyncpg.Connection) -> None:
    """Initialize each connection with pgvector type."""
    await register_vector(conn)


async def close_db() -> None:
    """Close database connection pool."""
    global _pool
    if _pool:
        await _pool.close()
        _pool = None
        logger.info("Database connection pool closed")


async def get_pool() -> asyncpg.Pool:
    """Get or create connection pool."""
    if _pool is None:
        return await init_db()
    return _pool


# ═══════════════════════════════════════════════════════════════
# DOCUMENT OPERATIONS
# ═══════════════════════════════════════════════════════════════

async def update_document_status(
    document_id: str,
    status: str,
    error_message: Optional[str] = None,
    processed_at: Optional[str] = None,
) -> None:
    """Update document processing status."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        if processed_at:
            await conn.execute(
                """
                UPDATE documents 
                SET status = $1, error_message = $2, "processedAt" = NOW()
                WHERE id = $3::uuid
                """,
                status,
                error_message,
                document_id,
            )
        else:
            await conn.execute(
                """
                UPDATE documents 
                SET status = $1, error_message = $2
                WHERE id = $3::uuid
                """,
                status,
                error_message,
                document_id,
            )


async def store_chunks(
    document_id: str,
    chunks: List[Dict[str, Any]],
) -> int:
    """
    Store document chunks with embeddings in PostgreSQL.
    Uses pgvector for embedding storage.
    
    Args:
        document_id: UUID of parent document
        chunks: List of dicts with keys:
            - content: str
            - embedding: List[float] (384-dim)
            - chunk_index: int
            - page_number: int | None
            - start_char: int | None
            - end_char: int | None
            - term_frequency: dict | None
    
    Returns:
        Number of chunks stored
    """
    pool = await get_pool()
    
    async with pool.acquire() as conn:
        # Use a transaction for atomicity
        async with conn.transaction():
            stored = 0
            for chunk in chunks:
                embedding = chunk.get("embedding")
                tf = chunk.get("term_frequency")

                await conn.execute(
                    """
                    INSERT INTO document_chunks 
                    (id, content, embedding, "chunkIndex", "pageNumber", 
                     "startChar", "endChar", "termFrequency", "documentId", "createdAt")
                    VALUES (
                        gen_random_uuid(), $1, $2::vector(384), $3, $4,
                        $5, $6, $7::jsonb, $8::uuid, NOW()
                    )
                    """,
                    chunk["content"],
                    str(embedding) if embedding else None,
                    chunk["chunk_index"],
                    chunk.get("page_number"),
                    chunk.get("start_char"),
                    chunk.get("end_char"),
                    json.dumps(tf) if tf else None,
                    document_id,
                )
                stored += 1

            return stored


# ═══════════════════════════════════════════════════════════════
# VECTOR SEARCH OPERATIONS
# ═══════════════════════════════════════════════════════════════

async def semantic_search(
    query_embedding: List[float],
    subject_id: str,
    user_id: str,
    top_k: int = 20,
    min_similarity: float = 0.5,
) -> List[Dict[str, Any]]:
    """
    Perform semantic search using pgvector cosine distance.
    
    Returns list of chunks with similarity scores.
    """
    pool = await get_pool()

    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT 
                dc.id,
                dc.content,
                dc."chunkIndex" as chunk_index,
                dc."pageNumber" as page_number,
                dc."startChar" as start_char,
                dc."endChar" as end_char,
                dc."documentId" as document_id,
                d.filename,
                d."originalName" as original_name,
                1 - (dc.embedding <=> $1::vector(384)) AS similarity
            FROM document_chunks dc
            JOIN documents d ON d.id = dc."documentId"
            WHERE d."subjectId" = $2::uuid
              AND d."userId" = $3::uuid
              AND d.status = 'completed'
              AND dc.embedding IS NOT NULL
            ORDER BY dc.embedding <=> $1::vector(384)
            LIMIT $4
            """,
            str(query_embedding),
            subject_id,
            user_id,
            top_k,
        )

        results = []
        for row in rows:
            similarity = float(row["similarity"])
            if similarity >= min_similarity:
                results.append({
                    "id": str(row["id"]),
                    "content": row["content"],
                    "chunk_index": row["chunk_index"],
                    "page_number": row["page_number"],
                    "start_char": row["start_char"],
                    "end_char": row["end_char"],
                    "document_id": str(row["document_id"]),
                    "filename": row["filename"],
                    "original_name": row["original_name"],
                    "similarity": similarity,
                })

        return results


async def get_all_chunks_for_subject(
    subject_id: str,
    user_id: str,
) -> List[Dict[str, Any]]:
    """
    Get all chunk contents for BM25 search.
    Returns chunk IDs and content.
    """
    pool = await get_pool()

    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT 
                dc.id,
                dc.content,
                dc."chunkIndex" as chunk_index,
                dc."documentId" as document_id,
                d.filename,
                d."originalName" as original_name
            FROM document_chunks dc
            JOIN documents d ON d.id = dc."documentId"
            WHERE d."subjectId" = $1::uuid
              AND d."userId" = $2::uuid
              AND d.status = 'completed'
            ORDER BY d."uploadedAt" DESC, dc."chunkIndex" ASC
            """,
            subject_id,
            user_id,
        )

        return [
            {
                "id": str(row["id"]),
                "content": row["content"],
                "chunk_index": row["chunk_index"],
                "document_id": str(row["document_id"]),
                "filename": row["filename"],
                "original_name": row["original_name"],
            }
            for row in rows
        ]
