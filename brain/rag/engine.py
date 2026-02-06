"""
Prime PenTrix - RAG Engine Module
Handles semantic search, BM25, reranking, and context building
Where Penetration Testing Meets Intelligence
"""

from typing import List, Dict, Any, Optional
from sentence_transformers import SentenceTransformer, CrossEncoder
from rank_bm25 import BM25Okapi
import numpy as np

class RAGEngine:
    """
    Hybrid RAG engine combining:
    - Semantic search (pgvector via database.py)
    - BM25 keyword search
    - Cross-encoder reranking
    - Reciprocal Rank Fusion (RRF)
    """
    
    def __init__(
        self,
        embedding_model: str = "all-MiniLM-L6-v2",
        rerank_model: str = "cross-encoder/ms-marco-MiniLM-L-6-v2",
    ):
        """Initialize RAG engine with embedding and reranking models"""
        print(f"🚀 Initializing Prime PenTrix RAG Engine...")
        print(f"   Embedding Model: {embedding_model}")
        print(f"   Reranking Model: {rerank_model}")
        
        # Load embedding model (384 dimensions)
        self.embedding_model = SentenceTransformer(embedding_model)
        
        # Load cross-encoder for reranking
        self.rerank_model = CrossEncoder(rerank_model)
        
        print("✅ RAG Engine initialized successfully")
    
    def generate_embedding(self, text: str) -> List[float]:
        """Generate embedding for a single text"""
        return self.embedding_model.encode(text, convert_to_numpy=True).tolist()
    
    def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for multiple texts"""
        embeddings = self.embedding_model.encode(texts, convert_to_numpy=True)
        return embeddings.tolist()
    
    async def semantic_search(
        self,
        query_embedding: List[float],
        subject_id: str,
        top_k: int = 20,
    ) -> List[Dict[str, Any]]:
        """
        Perform semantic search using pgvector.
        NOTE: Actual pgvector queries are in rag/database.py
        This method is kept for standalone usage without the full DB setup.
        """
        from .database import semantic_search as db_semantic_search
        return await db_semantic_search(
            query_embedding=query_embedding,
            subject_id=subject_id,
            user_id="",  # Requires user_id in full implementation
            top_k=top_k,
        )
    
    def bm25_search(
        self,
        query: str,
        documents: List[str],
        top_k: int = 20,
    ) -> List[int]:
        """
        Perform BM25 keyword search
        Returns indices of top documents
        """
        # Tokenize documents
        tokenized_docs = [doc.lower().split() for doc in documents]
        
        # Initialize BM25
        bm25 = BM25Okapi(tokenized_docs)
        
        # Get scores
        tokenized_query = query.lower().split()
        scores = bm25.get_scores(tokenized_query)
        
        # Get top-k indices
        top_indices = np.argsort(scores)[::-1][:top_k]
        
        return top_indices.tolist()
    
    def reciprocal_rank_fusion(
        self,
        rankings: List[List[int]],
        k: int = 60,
    ) -> List[int]:
        """
        Combine multiple rankings using Reciprocal Rank Fusion (RRF)
        """
        scores: Dict[int, float] = {}
        
        for ranking in rankings:
            for rank, doc_id in enumerate(ranking, start=1):
                if doc_id not in scores:
                    scores[doc_id] = 0
                scores[doc_id] += 1 / (k + rank)
        
        # Sort by score (descending)
        sorted_docs = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        
        return [doc_id for doc_id, _ in sorted_docs]
    
    def rerank(
        self,
        query: str,
        documents: List[str],
        top_k: int = 5,
    ) -> List[Dict[str, Any]]:
        """
        Rerank documents using cross-encoder
        """
        # Create query-document pairs
        pairs = [[query, doc] for doc in documents]
        
        # Get scores
        scores = self.rerank_model.predict(pairs, convert_to_numpy=True)
        
        # Sort by score (descending)
        ranked_indices = np.argsort(scores)[::-1][:top_k]
        
        results = [
            {
                "index": int(idx),
                "content": documents[idx],
                "score": float(scores[idx]),
            }
            for idx in ranked_indices
        ]
        
        return results
    
    async def hybrid_search(
        self,
        query: str,
        subject_id: str,
        top_k: int = 5,
    ) -> List[Dict[str, Any]]:
        """
        Perform hybrid search combining semantic + BM25 + reranking.
        NOTE: Full hybrid search orchestration is in main.py /search endpoint.
        This provides a simpler standalone interface.
        """
        # 1. Generate query embedding
        query_embedding = self.generate_embedding(query)
        
        # 2. Semantic search via pgvector
        semantic_results = await self.semantic_search(
            query_embedding,
            subject_id,
            top_k=top_k * 4,
        )
        
        if not semantic_results:
            return []

        # 3. Rerank with cross-encoder
        docs = [r["content"] for r in semantic_results]
        reranked = self.rerank(query, docs, top_k=top_k)
        
        results = []
        for ranked in reranked:
            orig = semantic_results[ranked["index"]]
            results.append({
                **orig,
                "score": ranked["score"],
                "search_type": "hybrid",
            })
        
        return results

# Initialize global RAG engine instance
rag_engine = None

def get_rag_engine() -> RAGEngine:
    """Get or create RAG engine singleton"""
    global rag_engine
    if rag_engine is None:
        rag_engine = RAGEngine()
    return rag_engine
