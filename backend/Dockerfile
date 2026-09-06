# ─── Krishi Saarthi & AgriProof AI — Python Intelligence Backend ──────────────
FROM python:3.12-slim

WORKDIR /app

# Install system dependencies needed by geospatial and imaging packages
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        gdal-bin \
        libgdal-dev \
        libgeos-dev \
        libproj-dev \
        curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt \
    && pip install --no-cache-dir asyncpg psycopg2-binary

# Copy application code
COPY . .

# Create directories for user uploads, pipeline artifacts, and static caches
RUN mkdir -p /app/storage/uploads \
             /app/storage/results \
             /app/storage/zk_proofs \
             /app/static/results

# Cloud Run dynamically assigns PORT (default 8080)
EXPOSE 8080 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:${PORT:-8080}/health || exit 1

# Launch uvicorn on $PORT for Google Cloud Run
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}"]

