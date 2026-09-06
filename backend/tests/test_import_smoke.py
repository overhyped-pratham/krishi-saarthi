"""
Import Smoke Test Suite
Validates that every backend module — routes, services, models, and
infrastructure — can be imported without NameError, ImportError, or
circular-import failures.

Run with: pytest tests/test_import_smoke.py -v
"""

import importlib
import sys
import pytest


# ── All modules that must be importable ──────────────────────────────────────

ROUTE_MODULES = [
    "app.api.routes.krishi_saarthi",
    "app.api.routes.farms",
    "app.api.routes.claims",
    "app.api.routes.ledger",
    "app.api.routes.insurer",
    "app.api.routes.farmer_alerts",
    "app.api.routes.diagnostics",
    "app.api.routes.auth",
]

AI_SERVICE_MODULES = [
    "app.services.ai.damage_vision",
    "app.services.ai.yolo_detector",
    "app.services.ai.plant_disease_cnn",
    "app.services.ai.gemini_advisor",
    "app.services.ai.gemini_multimodal_service",
    "app.services.ai.tts_speech_service",
    "app.services.ai.dosage_planner",
    "app.services.ai.cv_leaf_analyzer",
]

AGRI_INTEL_MODULES = [
    "app.services.agri_intelligence.crop_recommender",
    "app.services.agri_intelligence.soil_intelligence",
    "app.services.agri_intelligence.state_registry",
    "app.services.agri_intelligence.risk_engine",
    "app.services.agri_intelligence.central_contract",
]

SATELLITE_MODULES = [
    "app.services.satellite.earth_engine_service",
    "app.services.satellite.fetch",
    "app.services.satellite.indices",
    "app.services.satellite.cloud_mask",
    "app.services.satellite.planet_service",
    "app.services.satellite.temporal",
    "app.services.satellite.pipeline_renderer",
]

INFRA_MODULES = [
    "app.services.weather.risk_engine",
    "app.services.zk.proof_generator",
    "app.services.zk.proof_verifier",
    "app.services.ledger.blockchain",
    "app.services.ledger.claim_hash",
    "app.services.insurance.rules_engine",
    "app.services.ml.train",
    "app.services.ml.yield_model",
    "app.services.ml.risk_model",
    "app.services.ml.damage_detection",
    "app.services.pipeline",
    "app.services.demo.seed",
]

MODEL_MODULES = [
    "app.models.farm",
    "app.models.claim",
]

CORE_MODULES = [
    "app.config",
    "app.database",
    "app.main",
]

WEBSOCKET_MODULE = "app.api.websocket"


# ── Test helpers ──────────────────────────────────────────────────────────────

def _importable(mod_name: str) -> bool:
    """Return True if the module can be imported without error."""
    try:
        importlib.import_module(mod_name)
        return True
    except Exception:
        return False


# ── Parametrized smoke tests ─────────────────────────────────────────────────

@pytest.mark.parametrize("module", ROUTE_MODULES, ids=lambda m: m.split(".")[-1])
def test_route_imports(module):
    """Every route module must be importable."""
    assert _importable(module), f"Failed to import {module}"


@pytest.mark.parametrize("module", AI_SERVICE_MODULES, ids=lambda m: m.split(".")[-1])
def test_ai_service_imports(module):
    """Every AI service module must be importable."""
    assert _importable(module), f"Failed to import {module}"


@pytest.mark.parametrize("module", AGRI_INTEL_MODULES, ids=lambda m: m.split(".")[-1])
def test_agri_intel_imports(module):
    """Every agricultural intelligence module must be importable."""
    assert _importable(module), f"Failed to import {module}"


@pytest.mark.parametrize("module", SATELLITE_MODULES, ids=lambda m: m.split(".")[-1])
def test_satellite_imports(module):
    """Every satellite module must be importable."""
    assert _importable(module), f"Failed to import {module}"


@pytest.mark.parametrize("module", INFRA_MODULES, ids=lambda m: m.split(".")[-1])
def test_infra_imports(module):
    """Every infrastructure module (weather, ZK, ledger, ML, pipeline) must be importable."""
    assert _importable(module), f"Failed to import {module}"


@pytest.mark.parametrize("module", MODEL_MODULES, ids=lambda m: m.split(".")[-1])
def test_model_imports(module):
    """Every ORM model module must be importable."""
    assert _importable(module), f"Failed to import {module}"


@pytest.mark.parametrize("module", CORE_MODULES, ids=lambda m: m.split(".")[-1])
def test_core_imports(module):
    """Core application modules (config, database, main) must be importable."""
    assert _importable(module), f"Failed to import {module}"


def test_websocket_import():
    """The WebSocket router module must be importable."""
    assert _importable(WEBSOCKET_MODULE), f"Failed to import {WEBSOCKET_MODULE}"


# ── Comprehensive cross-module wiring check ──────────────────────────────────

def test_all_modules_import_together():
    """
    Import every module in a single pass to catch circular-import
    issues that only surface when multiple modules are loaded together.
    """
    all_modules = (
        CORE_MODULES
        + ROUTE_MODULES
        + AI_SERVICE_MODULES
        + AGRI_INTEL_MODULES
        + SATELLITE_MODULES
        + INFRA_MODULES
        + MODEL_MODULES
        + [WEBSOCKET_MODULE]
    )
    failures = []
    for mod in all_modules:
        try:
            importlib.import_module(mod)
        except Exception as exc:
            failures.append(f"{mod}: {exc}")

    assert not failures, (
        f"Failed to import {len(failures)} module(s):\n"
        + "\n".join(f"  - {f}" for f in failures)
    )


def test_router_collections_accessible():
    """
    After all route modules are imported, verify each exposes a FastAPI
    APIRouter with at least one registered route.
    """
    from app.api.routes import (
        krishi_saarthi, farms, claims, ledger,
        insurer, farmer_alerts, diagnostics, auth,
    )

    routers = [
        ("krishi_saarthi", krishi_saarthi.router),
        ("farms", farms.router),
        ("claims", claims.router),
        ("ledger", ledger.router),
        ("insurer", insurer.router),
        ("farmer_alerts", farmer_alerts.router),
        ("diagnostics", diagnostics.router),
        ("auth", auth.router),
    ]

    for name, router in routers:
        assert len(router.routes) > 0, (
            f"Router '{name}' has no routes registered"
        )


def test_no_stale_modules_after_full_import():
    """
    After importing every module, confirm that no unexpected modules
    leaked into sys.modules under the app namespace (regression guard).
    """
    all_modules = (
        CORE_MODULES
        + ROUTE_MODULES
        + AI_SERVICE_MODULES
        + AGRI_INTEL_MODULES
        + SATELLITE_MODULES
        + INFRA_MODULES
        + MODEL_MODULES
        + [WEBSOCKET_MODULE]
    )

    loaded = {m for m in sys.modules if m.startswith("app.")}
    expected = set(all_modules)

    # Allow __init__ subpackages and __pycache__ artifacts
    unexpected = loaded - expected - {
        "app", "app.api", "app.api.routes", "app.services",
        "app.services.ai", "app.services.agri_intelligence",
        "app.services.satellite", "app.services.weather",
        "app.services.zk", "app.services.ledger",
        "app.services.insurance", "app.services.ml",
        "app.services.demo", "app.models",
    }

    # It's fine if loaded is a superset — we just don't want
    # modules that were never in our lists at all.
    known_names = {m.split(".")[-1] for m in all_modules}
    true_unknown = {
        m for m in unexpected
        if m.split(".")[-1] not in known_names
    }

    assert not true_unknown, (
        f"Unexpected modules loaded: {sorted(true_unknown)}"
    )
