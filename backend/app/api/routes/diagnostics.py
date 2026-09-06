""" Diagnostics & Crop Doctor API Routes — AgriProof AI (inspired by ArogyaKrishi)
Endpoints:
- POST /api/diagnostics/detect-damage -> YOLO/AI leaf disease detection & severity
- POST /api/diagnostics/ml-snapshot-analysis -> Full ML analysis on leaf snapshot
- POST /api/diagnostics/calculate-dosage -> NPK & fertilizer dosage calculation
- POST /api/diagnostics/crop-recommendation -> Crop recommendation from soil NPK
- POST /api/diagnostics/gemini-consult -> Multimodal Gemini Agronomist chat
"""

from fastapi import APIRouter, File, UploadFile, Body
from typing import Dict, Any, Optional
from pydantic import BaseModel

from app.services.ai.damage_vision import detect_leaf_damage, DISEASE_KNOWLEDGE_BASE
from app.services.ai.dosage_planner import calculate_dosage_plan, IDEAL_NPK_REQUIREMENTS
from app.services.ai.gemini_advisor import query_gemini_agronomist
from app.services.ml.yield_model import YieldModel
from app.services.ml.damage_detection import DamageDetector
from app.services.ml.risk_model import RiskModel
from app.services.agri_intelligence.crop_recommender import rank_crops_for_field

router = APIRouter(prefix="/diagnostics", tags=["Diagnostics & Crop Doctor"])

class LeafDetectRequest(BaseModel):
    image_base64: Optional[str] = None
    crop_hint: Optional[str] = None
    filename: Optional[str] = None

class DosageRequest(BaseModel):
    crop: str = "wheat"
    area: float = 1.0
    unit: str = "hectare"
    current_n: float = 40.0
    current_p: float = 20.0
    current_k: float = 20.0
    growth_stage: str = "vegetative"

class MLSnapshotRequest(BaseModel):
    image_base64: Optional[str] = None
    filename: Optional[str] = None
    crop_type: str = "wheat"
    soil_n: float = 58.0
    soil_p: float = 32.0
    soil_k: float = 38.0
    soil_ph: float = 7.0
    ndvi_current: float = 0.60
    ndvi_baseline: float = 0.72
    rainfall_mm: float = 30.0
    rainfall_anomaly_pct: float = -20.0
    temp_mean: float = 28.0
    humidity: float = 50.0
    area_hectares: float = 2.5
    days_since_sowing: int = 90

class CropRecommendationRequest(BaseModel):
    soil_n: float = 58.0
    soil_p: float = 32.0
    soil_k: float = 38.0
    soil_ph: float = 7.0
    soil_oc: float = 0.5
    state: str = "Madhya Pradesh"
    season: str = "Kharif"
    temp_mean: float = 28.0
    rainfall_seasonal_mm: float = 600.0
    humidity_mean: float = 55.0
    ndvi_current: float = 0.60
    ndmi_current: float = 0.40

class GeminiConsultRequest(BaseModel):
    prompt: str
    crop: Optional[str] = "Wheat"
    disease: Optional[str] = None
    area: Optional[float] = 2.5
    language: Optional[str] = "en"

CROP_TYPE_ENCODING = {"wheat": 0, "rice": 1, "soybean": 2, "corn": 3, "cotton": 4}

@router.post("/detect-damage")
async def detect_damage_endpoint(req: Optional[LeafDetectRequest] = None):
    """Detect plant leaf disease and visual damage bounding boxes."""
    filename = req.filename if req else None
    image_b64 = req.image_base64 if req else None
    res = detect_leaf_damage(image_b64=image_b64, filename=filename)
    return res

@router.post("/ml-snapshot-analysis")
async def ml_snapshot_analysis_endpoint(req: MLSnapshotRequest):
    """Run full ML analysis pipeline on uploaded leaf snapshot.
    Returns YOLO detection + XGBoost yield prediction + damage classification + risk score.
    """
    # 1. Run leaf damage detection
    detection = detect_leaf_damage(image_b64=req.image_base64, filename=req.filename)
    damage_pct = detection.get("damage_score_pct", 0)
    disease_name = detection.get("disease_name", detection.get("disease", "Unknown"))

    # 2. Build ML features from snapshot + soil/weather context
    ndvi_drop_pct = max(0, ((req.ndvi_baseline - req.ndvi_current) / max(0.001, req.ndvi_baseline)) * 100)
    ml_features = {
        "ndvi_current": req.ndvi_current,
        "ndvi_baseline": req.ndvi_baseline,
        "ndvi_drop_pct": ndvi_drop_pct,
        "evi": req.ndvi_current * 0.85,
        "ndwi": req.ndvi_current * 0.6,
        "rainfall_mm": req.rainfall_mm,
        "rainfall_anomaly_pct": req.rainfall_anomaly_pct,
        "temp_mean": req.temp_mean,
        "humidity": req.humidity,
        "crop_type_encoded": CROP_TYPE_ENCODING.get(req.crop_type.lower(), 0),
        "days_since_sowing": max(1, req.days_since_sowing),
        "area_hectares": req.area_hectares,
    }

    # 3. XGBoost yield prediction
    yield_model = YieldModel()
    yield_pred = yield_model.predict(ml_features)

    # 4. Damage classification
    damage_detector = DamageDetector()
    damage_pred = damage_detector.classify_stress(ml_features)

    # 5. Unified risk score
    crop_health = max(0.0, 1.0 - (ndvi_drop_pct / 100.0))
    risk_model = RiskModel()
    unified_risk = risk_model.compute_unified_risk_score(
        crop_health_score=crop_health,
        weather_risk=min(1.0, max(0.0, (-req.rainfall_anomaly_pct / 100.0) * 0.7)),
        yield_loss_pct=yield_pred["expected_loss_pct"],
        ndvi_drop_pct=ndvi_drop_pct
    )

    # 6. Feature importance for explainability
    feature_importance = yield_model.get_feature_importance(ml_features)

    return {
        "detection": detection,
        "ml_analysis": {
            "expected_yield_t_ha": yield_pred["expected_yield"],
            "expected_loss_pct": yield_pred["expected_loss_pct"],
            "yield_confidence": yield_pred["confidence"],
            "stress_level": damage_pred["stress_level"],
            "damage_probability": damage_pred["damage_probability"],
            "risk_score": unified_risk["risk_score"],
            "risk_category": unified_risk["risk_category"],
            "risk_components": unified_risk["components"],
            "feature_importance": feature_importance,
            "crop_health_index": round(crop_health, 3),
            "ndvi_drop_pct": round(ndvi_drop_pct, 1),
        },
        "soil_context": {
            "n_kg_ha": req.soil_n,
            "p_kg_ha": req.soil_p,
            "k_kg_ha": req.soil_k,
            "ph": req.soil_ph,
        }
    }

@router.post("/crop-recommendation")
async def crop_recommendation_from_soil(req: CropRecommendationRequest):
    """Rank suitable crops based on soil NPK, weather, and satellite data."""
    rankings = rank_crops_for_field(
        soil_n=req.soil_n,
        soil_p=req.soil_p,
        soil_k=req.soil_k,
        soil_ph=req.soil_ph,
        soil_oc=req.soil_oc,
        temp_mean=req.temp_mean,
        rainfall_seasonal_mm=req.rainfall_seasonal_mm,
        humidity_mean=req.humidity_mean,
        ndvi_current=req.ndvi_current,
        ndmi_current=req.ndmi_current,
        state=req.state,
        season=req.season,
    )
    return {"status": "success", "rankings": rankings}

@router.post("/calculate-dosage")
async def calculate_dosage_endpoint(req: DosageRequest):
    """Calculate tailored NPK fertilizer dosage and split schedule."""
    plan = calculate_dosage_plan(
        crop=req.crop,
        area=req.area,
        unit=req.unit,
        current_n=req.current_n,
        current_p=req.current_p,
        current_k=req.current_k,
        growth_stage=req.growth_stage
    )
    return plan

@router.post("/gemini-consult")
async def gemini_consult_endpoint(req: GeminiConsultRequest):
    """Query the Gemini AI Agronomist for guidance and recovery recommendations."""
    context = {
        "crop": req.crop,
        "disease": req.disease,
        "area": req.area
    }
    advice = query_gemini_agronomist(prompt=req.prompt, context=context, language=req.language)
    return advice

@router.get("/disease-classes")
async def list_disease_classes():
    """List all supported plant disease classes and their crop associations."""
    classes = [
        {"key": k, "crop": v["crop"], "disease": v["disease"], "severity": v["severity"]}
        for k, v in DISEASE_KNOWLEDGE_BASE.items()
    ]
    return {"total": len(classes), "classes": classes}
