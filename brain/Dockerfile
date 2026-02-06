# ═══════════════════════════════════════════════════════════════
# Prime PenTrix Brain API - Dockerfile
# Lightweight RAG: BM25 + OpenAI API Embeddings (~100MB deps)
# NO sentence-transformers, NO torch, NO local models
# ═══════════════════════════════════════════════════════════════

FROM python:3.11-slim

WORKDIR /app

# System deps (libpq for psycopg2)
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps (lightweight — ~100MB total)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download NLTK data (for BM25 tokenization fallback)
RUN python -m nltk.downloader punkt stopwords punkt_tab

# Copy application code
COPY . .

# Create data directories
RUN mkdir -p /app/logs

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
