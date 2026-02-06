"""
Prime PenTrix - FastAPI Backend (Brain)
========================================
Lightweight RAG backend: BM25 + OpenAI API embeddings.
NO sentence-transformers, NO torch, NO local models.

Where Penetration Testing Meets Intelligence.
"""

import asyncio
import logging
from typing import List, Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import uvicorn

from config import settings
from rag.engine import get_rag_engine, RAGEngine
from rag.extractor import TextExtractor
from rag.chunker import ChunkingEngine, Chunk
from rag.database import (
    init_db,
    close_db,
    update_document_status,
    store_chunks,
    delete_chunks_for_document,
)

# ═══════════════════════════════════════════════════════════════
# LOGGING CONFIGURATION
# ═══════════════════════════════════════════════════════════════

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger("brain")


# ═══════════════════════════════════════════════════════════════
# APP LIFECYCLE
# ═══════════════════════════════════════════════════════════════

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    # Startup
    logger.info("🚀 Starting Prime PenTrix Brain API...")
    init_db()  # sync (psycopg2)
    engine = get_rag_engine()  # No model download, instant
    logger.info(f"✅ Brain API ready — {engine}")

    yield

    # Shutdown
    logger.info("Shutting down Brain API...")
    engine = get_rag_engine()
    await engine.close()
    close_db()


# ═══════════════════════════════════════════════════════════════
# CREATE FASTAPI APP
# ═══════════════════════════════════════════════════════════════

app = FastAPI(
    title="Prime PenTrix Brain API",
    description="Lightweight RAG: BM25 + OpenAI Embeddings — Where Penetration Testing Meets Intelligence",
    version="3.0.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global instances
chunking_engine = ChunkingEngine(
    chunk_size=settings.chunk_size,
    chunk_overlap=settings.chunk_overlap,
)


# ═══════════════════════════════════════════════════════════════
# REQUEST/RESPONSE MODELS
# ═══════════════════════════════════════════════════════════════

class DocumentProcessRequest(BaseModel):
    document_id: str
    content: str  # base64-encoded file content
    filename: str
    mime_type: str
    subject_id: str
    encoding: str = "base64"

class DocumentProcessResponse(BaseModel):
    document_id: str
    status: str
    chunks_created: int
    message: str

class EmbeddingRequest(BaseModel):
    texts: List[str] = Field(..., max_length=100)

class EmbeddingResponse(BaseModel):
    embeddings: List[List[float]]
    model: str
    dimensions: int

class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=1000)
    subject_id: str
    user_id: str
    top_k: int = Field(default=5, ge=1, le=20)
    search_type: str = Field(default="hybrid")  # semantic, bm25, hybrid

class SearchResult(BaseModel):
    id: str
    content: str
    chunk_index: int = 0
    page_number: Optional[int] = None
    document_id: str = ""
    filename: str = ""
    original_name: str = ""
    score: float
    search_type: str

class SearchResponse(BaseModel):
    results: List[SearchResult]
    query: str
    search_type: str
    total: int

class QueryRequest(BaseModel):
    query: str
    subject_id: str
    user_id: str
    conversation_id: Optional[str] = None
    mode: str = "chat"
    top_k: int = 5
    search_type: str = "hybrid"

class QueryResponse(BaseModel):
    context_chunks: List[str]
    chunk_ids: List[str]
    model: str


# ═══════════════════════════════════════════════════════════════
# HEALTH & STATUS
# ═══════════════════════════════════════════════════════════════

@app.get("/")
async def root():
    return {
        "service": "Prime PenTrix Brain API",
        "version": "3.0.0",
        "status": "healthy",
        "architecture": "BM25 + OpenAI Embeddings (Lightweight)",
    }

@app.get("/health")
async def health_check():
    engine = get_rag_engine()
    return {
        "status": "healthy",
        "services": {
            "fastapi": "running",
            "rag_engine": repr(engine),
            "openai_configured": engine.embedding_client.is_configured,
            "embedding_model": settings.openai_embedding_model,
            "embedding_dim": settings.openai_embedding_dim,
            "bm25_index_size": engine.bm25_index.size,
        },
    }


# ═══════════════════════════════════════════════════════════════
# EMBEDDING ENDPOINT
# ═══════════════════════════════════════════════════════════════

@app.post("/embeddings", response_model=EmbeddingResponse)
async def generate_embeddings(request: EmbeddingRequest):
    """Generate embeddings for a list of texts via OpenAI API."""
    try:
        if not request.texts:
            raise HTTPException(status_code=400, detail="No texts provided")
        if len(request.texts) > 100:
            raise HTTPException(
                status_code=400,
                detail="Maximum 100 texts per request",
            )

        engine = get_rag_engine()
        if not engine.embedding_client.is_configured:
            raise HTTPException(
                status_code=503,
                detail="OpenAI API key not configured — cannot generate embeddings",
            )

        embeddings = await engine.generate_embeddings(request.texts)
        # Filter out None results
        valid = [e for e in embeddings if e is not None]
        if not valid:
            raise HTTPException(
                status_code=500,
                detail="Embedding generation returned no results",
            )

        return EmbeddingResponse(
            embeddings=valid,
            model=settings.openai_embedding_model,
            dimensions=settings.openai_embedding_dim,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Embedding generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ═══════════════════════════════════════════════════════════════
# DOCUMENT PROCESSING ENDPOINT
# ═══════════════════════════════════════════════════════════════

@app.post("/documents/process", response_model=DocumentProcessResponse)
async def process_document(
    request: DocumentProcessRequest,
    background_tasks: BackgroundTasks,
):
    """
    Process a document: extract text → chunk → embed → store.
    Processing runs in the background.
    """
    try:
        # Validate MIME type
        if request.mime_type not in TextExtractor.SUPPORTED_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type: {request.mime_type}",
            )

        # Start background processing
        background_tasks.add_task(
            _process_document_pipeline,
            request.document_id,
            request.content,
            request.mime_type,
            request.filename,
            request.subject_id,
        )

        return DocumentProcessResponse(
            document_id=request.document_id,
            status="processing",
            chunks_created=0,
            message="Document processing started",
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Process request error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


async def _process_document_pipeline(
    document_id: str,
    base64_content: str,
    mime_type: str,
    filename: str,
    subject_id: str,
) -> None:
    """
    Full document processing pipeline (runs in background).

    Pipeline:
    1. Extract text from document
    2. Chunk text with paragraph-aware splitting
    3. Generate embeddings via OpenAI API
    4. Store chunks + embeddings in pgvector
    5. Index chunks in BM25 index
    6. Update document status
    """
    try:
        logger.info(f"📄 Processing document: {filename} ({document_id})")

        # Update status to processing
        update_document_status(document_id, "processing")

        # ── Step 1: Extract text ──────────────────────────────
        logger.info(f"  Step 1: Extracting text from {mime_type}...")
        extraction = TextExtractor.extract_from_base64(
            base64_content, mime_type, filename
        )

        if extraction["error"]:
            raise Exception(f"Text extraction failed: {extraction['error']}")

        text = extraction["text"]
        page_count = extraction["pages"]

        if not text.strip():
            raise Exception("No text could be extracted from document")

        logger.info(f"  Extracted {len(text)} chars, {page_count} pages")

        # ── Step 2: Chunk text ────────────────────────────────
        logger.info("  Step 2: Chunking text...")
        chunks: List[Chunk] = chunking_engine.chunk_text(
            text, page_count=page_count
        )

        if not chunks:
            raise Exception("No chunks could be created from document")

        logger.info(f"  Created {len(chunks)} chunks")

        # ── Step 3: Generate embeddings (OpenAI API) ──────────
        engine = get_rag_engine()
        all_embeddings: List[Optional[List[float]]] = []

        if engine.embedding_client.is_configured:
            logger.info("  Step 3: Generating embeddings via OpenAI API...")
            chunk_texts = [chunk.content for chunk in chunks]
            all_embeddings = await engine.generate_embeddings(chunk_texts)
            valid_count = sum(1 for e in all_embeddings if e is not None)
            logger.info(f"  Generated {valid_count}/{len(chunks)} embeddings")
        else:
            logger.warning("  Step 3: SKIPPED (OpenAI API not configured)")
            all_embeddings = [None] * len(chunks)

        # ── Step 4: Store in database ─────────────────────────
        logger.info("  Step 4: Storing chunks in pgvector...")
        chunk_data = []
        for i, chunk in enumerate(chunks):
            chunk_data.append({
                "content": chunk.content,
                "embedding": all_embeddings[i] if i < len(all_embeddings) else None,
                "chunk_index": chunk.chunk_index,
                "page_number": chunk.page_number,
                "start_char": chunk.start_char,
                "end_char": chunk.end_char,
            })

        stored_count = store_chunks(document_id, chunk_data)

        # ── Step 5: Index in BM25 ────────────────────────────
        logger.info("  Step 5: Indexing in BM25...")
        bm25_chunks = [
            {
                "id": f"{document_id}_{i}",
                "content": chunk.content,
                "chunk_index": chunk.chunk_index,
                "page_number": chunk.page_number,
                "document_id": document_id,
                "filename": filename,
                "original_name": filename,
            }
            for i, chunk in enumerate(chunks)
        ]
        engine.index_chunks(bm25_chunks)

        # ── Step 6: Update status ─────────────────────────────
        update_document_status(
            document_id, "completed", processed_at="now"
        )

        logger.info(
            f"✅ Document processed: {filename} — "
            f"{stored_count} chunks stored, BM25 indexed"
        )

    except Exception as e:
        logger.error(f"❌ Processing failed for {document_id}: {e}")
        update_document_status(
            document_id, "failed", error_message=str(e)
        )

# ═══════════════════════════════════════════════════════════════
# SEARCH ENDPOINT
# ═══════════════════════════════════════════════════════════════

@app.post("/search", response_model=SearchResponse)
async def search_documents(request: SearchRequest):
    """
    Search documents using BM25, semantic, or hybrid search.
    Hybrid = BM25 + OpenAI embeddings combined via RRF.
    """
    try:
        engine = get_rag_engine()
        results = []

        if request.search_type == "bm25":
            raw = engine.bm25_search(
                request.query, request.subject_id,
                request.user_id, top_k=request.top_k,
            )
        elif request.search_type == "semantic":
            raw = await engine.semantic_search_api(
                request.query, request.subject_id,
                request.user_id, top_k=request.top_k,
            )
        else:  # hybrid (default)
            raw = await engine.hybrid_search(
                request.query, request.subject_id,
                request.user_id, top_k=request.top_k,
            )

        for r in raw:
            results.append(
                SearchResult(
                    id=r.get("id", ""),
                    content=r.get("content", ""),
                    chunk_index=r.get("chunk_index", 0),
                    page_number=r.get("page_number"),
                    document_id=r.get("document_id", ""),
                    filename=r.get("filename", ""),
                    original_name=r.get("original_name", ""),
                    score=r.get("score", 0.0),
                    search_type=r.get("search_type", request.search_type),
                )
            )

        return SearchResponse(
            results=results,
            query=request.query,
            search_type=request.search_type,
            total=len(results),
        )

    except Exception as e:
        logger.error(f"Search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ═══════════════════════════════════════════════════════════════
# QUERY ENDPOINT (RAG-powered context retrieval for chat)
# ═══════════════════════════════════════════════════════════════

@app.post("/query", response_model=QueryResponse)
async def process_query(request: QueryRequest):
    """
    Retrieve RAG context for a chat query.
    Returns relevant document chunks to inject into the AI prompt.
    """
    try:
        engine = get_rag_engine()
        context_chunks, chunk_ids = await engine.get_context_for_query(
            query=request.query,
            subject_id=request.subject_id,
            user_id=request.user_id,
            top_k=request.top_k,
            search_type=request.search_type,
        )

        return QueryResponse(
            context_chunks=context_chunks,
            chunk_ids=chunk_ids,
            model=settings.openai_embedding_model,
        )

    except Exception as e:
        logger.error(f"Query error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ═══════════════════════════════════════════════════════════════
# DOCUMENT DELETE (cleanup BM25 index + DB)
# ═══════════════════════════════════════════════════════════════

@app.delete("/documents/{document_id}")
async def delete_document_chunks(document_id: str):
    """Delete all chunks for a document from DB and BM25 index."""
    try:
        # Delete from database and get chunk IDs
        deleted_count, chunk_ids = delete_chunks_for_document(document_id)
        
        # Remove from BM25 index to prevent deleted docs from appearing in search
        engine = get_rag_engine()
        if chunk_ids:
            engine.remove_document_from_index(chunk_ids)
            logger.info(f"Removed {len(chunk_ids)} chunks from BM25 index for document {document_id}")
        
        return {
            "document_id": document_id,
            "deleted_chunks": deleted_count,
            "removed_from_index": len(chunk_ids),
            "message": f"Deleted {deleted_count} chunks and removed from search index",
        }
    except Exception as e:
        logger.error(f"Delete error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ═══════════════════════════════════════════════════════════════
# MAIN ENTRY POINT
# ═══════════════════════════════════════════════════════════════

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
