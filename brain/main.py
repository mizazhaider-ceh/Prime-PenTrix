"""
Prime PenTrix - FastAPI Backend (Brain)
Where Penetration Testing Meets Intelligence
Python backend for AI/RAG operations
"""

import asyncio
import json
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
    semantic_search,
    get_all_chunks_for_subject,
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
    await init_db()
    # Pre-load RAG engine (downloads models on first run)
    get_rag_engine()
    logger.info("✅ Brain API ready")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Brain API...")
    await close_db()


# ═══════════════════════════════════════════════════════════════
# CREATE FASTAPI APP
# ═══════════════════════════════════════════════════════════════

app = FastAPI(
    title="Prime PenTrix Brain API",
    description="Where Penetration Testing Meets Intelligence - AI/RAG Backend",
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
    min_similarity: float = Field(default=0.5, ge=0.0, le=1.0)

class SearchResult(BaseModel):
    id: str
    content: str
    chunk_index: int
    page_number: Optional[int] = None
    document_id: str
    filename: str
    original_name: str
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
    }

@app.get("/health")
async def health_check():
    rag = get_rag_engine()
    return {
        "status": "healthy",
        "services": {
            "fastapi": "running",
            "rag_engine": "ready" if rag else "not initialized",
            "embedding_model": settings.embedding_model,
            "embedding_dim": settings.embedding_dim,
        },
    }


# ═══════════════════════════════════════════════════════════════
# EMBEDDING ENDPOINT
# ═══════════════════════════════════════════════════════════════

@app.post("/embeddings", response_model=EmbeddingResponse)
async def generate_embeddings(request: EmbeddingRequest):
    """Generate embeddings for a list of texts."""
    try:
        if not request.texts:
            raise HTTPException(status_code=400, detail="No texts provided")

        if len(request.texts) > 100:
            raise HTTPException(
                status_code=400,
                detail="Maximum 100 texts per request",
            )

        rag = get_rag_engine()
        embeddings = rag.generate_embeddings(request.texts)

        return EmbeddingResponse(
            embeddings=embeddings,
            model=settings.embedding_model,
            dimensions=settings.embedding_dim,
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
    2. Chunk text with sentence-aware splitting
    3. Generate embeddings for each chunk
    4. Compute term frequencies for BM25
    5. Store chunks + embeddings in pgvector
    6. Update document status
    """
    try:
        logger.info(f"📄 Processing document: {filename} ({document_id})")

        # Update status to processing
        await update_document_status(document_id, "processing")

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

        logger.info(
            f"  Extracted {len(text)} chars, {page_count} pages"
        )

        # ── Step 2: Chunk text ────────────────────────────────
        logger.info("  Step 2: Chunking text...")
        chunks: List[Chunk] = chunking_engine.chunk_text(
            text, page_count=page_count, strategy="sentence"
        )

        if not chunks:
            raise Exception("No chunks could be created from document")

        logger.info(f"  Created {len(chunks)} chunks")

        # ── Step 3: Generate embeddings ───────────────────────
        logger.info("  Step 3: Generating embeddings...")
        rag = get_rag_engine()
        chunk_texts = [chunk.content for chunk in chunks]

        # Batch embeddings (process in batches of 32)
        all_embeddings = []
        batch_size = 32
        for i in range(0, len(chunk_texts), batch_size):
            batch = chunk_texts[i : i + batch_size]
            batch_embeddings = rag.generate_embeddings(batch)
            all_embeddings.extend(batch_embeddings)

        logger.info(f"  Generated {len(all_embeddings)} embeddings")

        # ── Step 4: Compute term frequencies ──────────────────
        logger.info("  Step 4: Computing term frequencies for BM25...")
        term_frequencies = [
            chunking_engine.compute_term_frequencies(chunk.content)
            for chunk in chunks
        ]

        # ── Step 5: Store in database ─────────────────────────
        logger.info("  Step 5: Storing chunks in pgvector...")
        chunk_data = []
        for i, chunk in enumerate(chunks):
            chunk_data.append({
                "content": chunk.content,
                "embedding": all_embeddings[i] if i < len(all_embeddings) else None,
                "chunk_index": chunk.chunk_index,
                "page_number": chunk.page_number,
                "start_char": chunk.start_char,
                "end_char": chunk.end_char,
                "term_frequency": term_frequencies[i] if i < len(term_frequencies) else None,
            })

        stored_count = await store_chunks(document_id, chunk_data)

        # ── Step 6: Update status ─────────────────────────────
        await update_document_status(
            document_id, "completed", processed_at="now"
        )

        logger.info(
            f"✅ Document processed: {filename} - "
            f"{stored_count} chunks stored"
        )

    except Exception as e:
        logger.error(f"❌ Processing failed for {document_id}: {e}")
        await update_document_status(
            document_id, "failed", error_message=str(e)
        )


# ═══════════════════════════════════════════════════════════════
# SEARCH ENDPOINT
# ═══════════════════════════════════════════════════════════════

@app.post("/search", response_model=SearchResponse)
async def search_documents(request: SearchRequest):
    """
    Search documents using hybrid search:
    semantic (pgvector) + BM25 + cross-encoder reranking.
    """
    try:
        rag = get_rag_engine()
        results = []

        if request.search_type in ("semantic", "hybrid"):
            # ── Semantic Search ───────────────────────────────
            query_embedding = rag.generate_embedding(request.query)

            semantic_results = await semantic_search(
                query_embedding=query_embedding,
                subject_id=request.subject_id,
                user_id=request.user_id,
                top_k=request.top_k * 4,  # Get more for reranking
                min_similarity=request.min_similarity,
            )

            if request.search_type == "semantic":
                # Pure semantic search - just rerank and return
                if semantic_results:
                    docs = [r["content"] for r in semantic_results]
                    reranked = rag.rerank(
                        request.query, docs, top_k=request.top_k
                    )
                    for ranked in reranked:
                        orig = semantic_results[ranked["index"]]
                        results.append(
                            SearchResult(
                                id=orig["id"],
                                content=orig["content"],
                                chunk_index=orig["chunk_index"],
                                page_number=orig.get("page_number"),
                                document_id=orig["document_id"],
                                filename=orig["filename"],
                                original_name=orig["original_name"],
                                score=ranked["score"],
                                search_type="semantic",
                            )
                        )
            else:
                # Hybrid search: combine semantic + BM25
                # ── BM25 Search ───────────────────────────────
                all_chunks = await get_all_chunks_for_subject(
                    request.subject_id, request.user_id
                )

                if all_chunks:
                    chunk_contents = [c["content"] for c in all_chunks]
                    bm25_indices = rag.bm25_search(
                        request.query,
                        chunk_contents,
                        top_k=request.top_k * 4,
                    )

                    # Build semantic ranking (by index in semantic_results)
                    semantic_ranking = list(range(len(semantic_results)))

                    # Map BM25 results to global indices
                    # We need to find which semantic results correspond
                    semantic_ids = {r["id"]: i for i, r in enumerate(semantic_results)}
                    bm25_ranking = []
                    bm25_id_map = {}
                    for bm25_idx in bm25_indices:
                        if bm25_idx < len(all_chunks):
                            chunk_id = all_chunks[bm25_idx]["id"]
                            bm25_id_map[len(bm25_ranking)] = all_chunks[bm25_idx]
                            bm25_ranking.append(len(bm25_ranking))

                    # ── RRF Fusion ────────────────────────────
                    # Combine rankings using Reciprocal Rank Fusion
                    all_candidates = {}

                    # Add semantic results
                    for rank, sem_result in enumerate(semantic_results):
                        doc_id = sem_result["id"]
                        rrf_score = 1.0 / (60 + rank + 1)
                        all_candidates[doc_id] = {
                            **sem_result,
                            "rrf_score": rrf_score,
                        }

                    # Add BM25 results
                    for rank, bm25_idx in enumerate(bm25_indices):
                        if bm25_idx < len(all_chunks):
                            chunk = all_chunks[bm25_idx]
                            doc_id = chunk["id"]
                            rrf_score = 1.0 / (60 + rank + 1)
                            if doc_id in all_candidates:
                                all_candidates[doc_id]["rrf_score"] += rrf_score
                            else:
                                all_candidates[doc_id] = {
                                    **chunk,
                                    "rrf_score": rrf_score,
                                    "similarity": 0.0,
                                }

                    # Sort by RRF score
                    sorted_candidates = sorted(
                        all_candidates.values(),
                        key=lambda x: x["rrf_score"],
                        reverse=True,
                    )

                    # ── Cross-Encoder Reranking ───────────────
                    top_candidates = sorted_candidates[: request.top_k * 2]
                    if top_candidates:
                        candidate_texts = [c["content"] for c in top_candidates]
                        reranked = rag.rerank(
                            request.query,
                            candidate_texts,
                            top_k=request.top_k,
                        )

                        for ranked in reranked:
                            orig = top_candidates[ranked["index"]]
                            results.append(
                                SearchResult(
                                    id=orig["id"],
                                    content=orig["content"],
                                    chunk_index=orig.get("chunk_index", 0),
                                    page_number=orig.get("page_number"),
                                    document_id=orig.get("document_id", ""),
                                    filename=orig.get("filename", ""),
                                    original_name=orig.get("original_name", ""),
                                    score=ranked["score"],
                                    search_type="hybrid",
                                )
                            )
                else:
                    # No BM25 data, fall back to semantic only
                    for sem_result in semantic_results[: request.top_k]:
                        results.append(
                            SearchResult(
                                id=sem_result["id"],
                                content=sem_result["content"],
                                chunk_index=sem_result["chunk_index"],
                                page_number=sem_result.get("page_number"),
                                document_id=sem_result["document_id"],
                                filename=sem_result["filename"],
                                original_name=sem_result["original_name"],
                                score=sem_result["similarity"],
                                search_type="semantic",
                            )
                        )

        elif request.search_type == "bm25":
            # ── Pure BM25 Search ──────────────────────────────
            all_chunks = await get_all_chunks_for_subject(
                request.subject_id, request.user_id
            )

            if all_chunks:
                chunk_contents = [c["content"] for c in all_chunks]
                bm25_indices = rag.bm25_search(
                    request.query,
                    chunk_contents,
                    top_k=request.top_k,
                )

                for i, idx in enumerate(bm25_indices):
                    if idx < len(all_chunks):
                        chunk = all_chunks[idx]
                        results.append(
                            SearchResult(
                                id=chunk["id"],
                                content=chunk["content"],
                                chunk_index=chunk.get("chunk_index", 0),
                                page_number=None,
                                document_id=chunk.get("document_id", ""),
                                filename=chunk.get("filename", ""),
                                original_name=chunk.get("original_name", ""),
                                score=1.0 / (i + 1),  # Reciprocal rank as score
                                search_type="bm25",
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
        rag = get_rag_engine()

        # Generate query embedding
        query_embedding = rag.generate_embedding(request.query)

        # Semantic search
        semantic_results = await semantic_search(
            query_embedding=query_embedding,
            subject_id=request.subject_id,
            user_id=request.user_id,
            top_k=request.top_k * 3,
            min_similarity=0.4,  # Lower threshold for context
        )

        if not semantic_results:
            return QueryResponse(
                context_chunks=[],
                chunk_ids=[],
                model=settings.embedding_model,
            )

        # Rerank with cross-encoder
        docs = [r["content"] for r in semantic_results]
        reranked = rag.rerank(request.query, docs, top_k=request.top_k)

        context_chunks = []
        chunk_ids = []
        for ranked in reranked:
            if ranked["score"] > 0:  # Only include positive relevance
                orig = semantic_results[ranked["index"]]
                # Format context with source attribution
                source = orig.get("original_name", orig.get("filename", "unknown"))
                page = orig.get("page_number")
                attribution = f"[Source: {source}"
                if page:
                    attribution += f", Page {page}"
                attribution += "]"
                
                context_chunks.append(
                    f"{orig['content']}\n{attribution}"
                )
                chunk_ids.append(orig["id"])

        return QueryResponse(
            context_chunks=context_chunks,
            chunk_ids=chunk_ids,
            model=settings.embedding_model,
        )

    except Exception as e:
        logger.error(f"Query error: {e}")
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
