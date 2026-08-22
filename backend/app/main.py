from contextlib import asynccontextmanager
from pathlib import Path
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from fastapi.staticfiles import StaticFiles

from app.api.routes import farms, claims, ledger, insurer, farmer_alerts, diagnostics, auth as auth_routes
from app.api.websocket import router as ws_router
from app.database import init_db
from app.config import get_settings
from app.services.ml.train import train_models

settings = get_settings()

static_dir = Path(__file__).resolve().parent.parent / "static"
static_dir.mkdir(parents=True, exist_ok=True)
(static_dir / "results").mkdir(parents=True, exist_ok=True)

# Ensure persistent storage directories exist
storage_dir = Path(settings.storage_dir)
storage_dir.mkdir(parents=True, exist_ok=True)
settings.uploads_dir.mkdir(parents=True, exist_ok=True)
settings.results_dir.mkdir(parents=True, exist_ok=True)
settings.zk_proofs_dir.mkdir(parents=True, exist_ok=True)

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    
    models_dir = Path(__file__).resolve().parent.parent.parent / "models"
    if not (models_dir / "xgboost_yield.pkl").exists():
        print("Models not found, starting training...")
        train_models()
    yield

app = FastAPI(
    title="AgriProof AI Backend",
    description="FastAPI backend for AgriProof AI",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")
app.mount("/storage", StaticFiles(directory=str(storage_dir)), name="storage")

app.include_router(farms.router, prefix="/api", tags=["Farms"])
app.include_router(claims.router, prefix="/api", tags=["Claims"])
app.include_router(ledger.router, prefix="/api", tags=["Ledger"])
app.include_router(insurer.router, prefix="/api", tags=["Insurer"])
app.include_router(farmer_alerts.router, prefix="/api", tags=["Farmer Alerts"])
app.include_router(diagnostics.router, prefix="/api", tags=["Crop Diagnostics & Doctor"])
app.include_router(auth_routes.router, tags=["Auth"])
app.include_router(ws_router, tags=["Websocket"])

@app.get("/health", tags=["Health"])
@app.get("/api/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "service": "AgriProof AI Parametric Engine",
        "version": "1.0.0",
        "environment": settings.app_env,
        "database": "connected",
        "satellite_pipeline": "Sentinel-2 L2A Ready",
        "zk_engine": "Groth16 SNARK Active",
    }
