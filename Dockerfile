# ─── Krishi Saarthi Unified Production Container ──────────────────────────────
# Multi-stage build for optimal image size and security

# ── Stage 1: Build Frontend SPA ───────────────────────────────────────────────
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

# Install frontend dependencies
COPY frontend/package*.json ./
RUN npm ci || npm install

# Copy frontend source and build
COPY frontend/ ./
RUN npm run build

# ── Stage 2: Build Node Backend Server ─────────────────────────────────────────
FROM node:20-alpine AS server-builder
WORKDIR /app

# Install root dependencies
COPY package*.json ./
RUN npm ci || npm install

# Copy source and bundle server with esbuild
COPY server.ts krishiSaarthiService.ts tsconfig.json ./
RUN npx esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs

# ── Stage 3: Production Runner ────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

# Install runtime utilities (curl, wget, python for smoke tests)
RUN apk add --no-cache curl wget python3 py3-pip

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Install production dependencies only
COPY package*.json ./
RUN npm install --omit=dev || npm install --production

# Copy compiled backend bundle
COPY --from=server-builder /app/dist/server.cjs ./dist/server.cjs
COPY --from=server-builder /app/dist/server.cjs.map ./dist/server.cjs.map

# Copy compiled frontend assets into dist so server serves them as SPA
COPY --from=frontend-builder /app/frontend/dist ./dist

# Copy supporting data and demo assets
COPY data/ ./data/
COPY demo_media/ ./demo_media/
COPY models/ ./models/
COPY smoke_test_backend.py ./smoke_test_backend.py

# Install httpx in python for containerized smoke testing
RUN pip install --no-cache-dir --break-system-packages httpx || true

# Expose production port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start Krishi Saarthi server
CMD ["node", "dist/server.cjs"]
