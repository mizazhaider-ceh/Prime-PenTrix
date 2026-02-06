# ═══════════════════════════════════════════════════════════════
# S2-Sentinel Brain API - Dockerfile
# Python FastAPI backend with AI/RAG capabilities
# ═══════════════════════════════════════════════════════════════

FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Download NLTK and spaCy data (for text processing)
RUN python -m nltk.downloader punkt stopwords
RUN python -m spacy download en_core_web_sm

# Copy application code
COPY . .

# Create data directories
RUN mkdir -p /app/data/chromadb /app/data/documents /app/logs

# Expose port
EXPOSE 8000

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
