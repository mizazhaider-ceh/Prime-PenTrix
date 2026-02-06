"""
Configuration for S2-Sentinel Brain API
"""

import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """Application settings"""
    
    # App config
    app_name: str = "Prime PenTrix Brain API"
    version: str = "3.0.0"
    debug: bool = True
    
    # Database
    database_url: str = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/prime_pentrix")
    
    # AI Models
    cerebras_api_key: str = os.getenv("CEREBRAS_API_KEY", "")
    cerebras_model: str = "llama-3.3-70b"
    
    gemini_api_key: str = os.getenv("GOOGLE_GEMINI_API_KEY", "")
    gemini_model: str = "gemini-1.5-flash"
    
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    
    # Embedding model (sentence-transformers)
    embedding_model: str = "all-MiniLM-L6-v2"
    embedding_dim: int = 384
    
    # RAG config
    chunk_size: int = 500
    chunk_overlap: int = 50
    max_context_chunks: int = 5
    top_k: int = 20
    min_similarity: float = 0.5
    
    # Vector DB (pgvector)
    use_pgvector: bool = True
    
    # ChromaDB (alternative)
    chroma_persist_dir: str = "./data/chromadb"
    
    # CORS
    cors_origins: list = ["http://localhost:3000", "http://localhost:3001"]
    
    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()
