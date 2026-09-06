"""
Central Agricultural Intelligence Data Contract — Krishi Saarthi
Aggregates Sentinel-2 remote sensing, Open-Meteo weather risk engine,
Soil chemistry profiles, XGBoost crop rankings, crop disease diagnostics,
and State Cooperation Federation into one authoritative payload.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime

def build_central_intelligence_object(
    field_data: Dict[str, Any],
    satellite_telemetry: Optional[Dict[str, Any]] = None,
    weather_telemetry: Optional[Dict[str, Any]] = None,
    soil_profile: Optional[Dict[str, Any]] = None,
    crop_recommendations: Optional[List[Dict[str, Any]]] = None,
    disease_diagnosis: Optional[Dict[str, Any]] = None,
    active_state_model: Optional[Dict[str, Any]] = None,
    is_demo: bool = False
) -> Dict[str, Any]:
    """Assembles the single canonical agricultural intelligence data contract."""
    
    # 1. Normalized Field Record
    center_lat = field_data.get("center_lat", 22.63497)
    center_lon = field_data.get("center_lon", 75.84983)
    area_ha = field_data.get("area_hectares", 2.4)
    crop = field_data.get("crop_type", field_data.get("crop", "Soybean"))
    state = field_data.get("state", "Madhya Pradesh")
    field_id = field_data.get("id", field_data.get("field_id", "FIELD_001"))
    field_name = field_data.get("name", "Indore Malwa Soybean Parcel")
    polygon = field_data.get("polygon_coordinates", field_data.get("geometry", []))

    # 2. Normalized Satellite Observation
    sat = satellite_telemetry or {}
    ndvi = sat.get("ndvi", sat.get("ndvi_current", 0.64))
    ndmi = sat.get("ndmi", sat.get("ndmi_current", 0.41))
    evi = sat.get("evi", sat.get("evi_current", 0.52))
    cloud_cover = sat.get("cloud_coverage", sat.get("cloud_cover_pct", 6.0))
    baseline_ndvi = sat.get("ndvi_baseline", 0.70)
    ndvi_change = round(((ndvi - baseline_ndvi) / max(0.01, baseline_ndvi)) * 100.0, 1)

    health_score = int(min(100, max(20, (ndvi / 0.75) * 85 + (ndmi / 0.50) * 15)))
    health_status = "Healthy" if health_score >= 75 else ("Moderate Stress" if health_score >= 50 else "Degraded")

    satellite_block = {
        "observation_date": sat.get("observation_date", datetime.utcnow().strftime("%Y-%m-%d")),
        "sensor": "Sentinel-2 MSI Level-2A",
        "spatial_resolution_m": 10,
        "cloud_coverage_pct": cloud_cover,
        "ndvi": round(ndvi, 3),
        "ndmi": round(ndmi, 3),
        "evi": round(evi, 3),
        "vegetation_status": health_status,
        "health_score": health_score,
        "change_vs_baseline_pct": ndvi_change,
        "is_live_telemetry": not is_demo,
        "data_mode": "DEMO_FALLBACK" if is_demo else "LIVE_ORBITAL_TELEMETRY"
    }

    # 3. Normalized Weather Risk Telemetry
    w = weather_telemetry or {}
    temp = w.get("temperature", w.get("temperature_mean", 28.5))
    rain_30d = w.get("rainfall_mm_30d", 84.0)
    rain_72h = w.get("rainfall_forecast_72h_mm", 62.0)
    humidity = w.get("humidity", w.get("humidity_mean", 72.0))
    wind = w.get("wind_speed_kmh", 14.5)
    soil_moisture = w.get("soil_moisture_vwc_pct", 23.8)

    # Deterministic Risk Engine Evaluation
    rainfall_risk = "HIGH" if rain_72h >= 50.0 else ("MEDIUM" if rain_72h >= 25.0 else "LOW")
    temp_risk = "HIGH" if temp >= 38.0 or temp <= 8.0 else ("MEDIUM" if temp >= 33.0 else "LOW")
    drought_risk = "HIGH" if soil_moisture < 15.0 and rain_30d < 30.0 else ("MEDIUM" if soil_moisture < 20.0 else "LOW")

    risk_levels = [rainfall_risk, temp_risk, drought_risk]
    overall_risk = "HIGH" if "HIGH" in risk_levels else ("MEDIUM" if "MEDIUM" in risk_levels else "LOW")

    warnings = []
    if rainfall_risk == "HIGH":
        warnings.append(f"Heavy rainfall risk — HIGH: {int(rain_72h)} mm rainfall expected within the next 72 hours. Postpone irrigation and fertilizer top-dressing.")
    if drought_risk == "HIGH":
        warnings.append("Soil moisture critical deficit detected — Protective micro-irrigation advised.")
    if temp_risk == "HIGH":
        warnings.append("Heat stress alert — Elevated evapotranspiration rates.")

    weather_block = {
        "temperature_c": temp,
        "rainfall_mm_30d": rain_30d,
        "rainfall_forecast_72h_mm": rain_72h,
        "humidity_pct": humidity,
        "wind_speed_kmh": wind,
        "soil_moisture_vwc_pct": soil_moisture,
        "risks": {
            "rainfall_risk": rainfall_risk,
            "temperature_risk": temp_risk,
            "drought_risk": drought_risk,
            "overall_risk": overall_risk
        },
        "actionable_warnings": warnings
    }

    # 4. Normalized Soil Chemistry
    s = soil_profile or {}
    soil_block = {
        "nitrogen_kg_ha": s.get("nitrogen_kg_ha", 42.0),
        "phosphorus_kg_ha": s.get("phosphorus_kg_ha", 22.0),
        "potassium_kg_ha": s.get("potassium_kg_ha", 48.0),
        "ph": s.get("ph", 7.2),
        "organic_carbon_pct": s.get("organic_carbon_pct", 0.68),
        "soil_type": s.get("soil_type", "Medium Black Soil (Vertisol)"),
        "data_source": s.get("data_source", "regional_spatial_default")
    }

    # 5. Crop Suitability Recommendations
    crops_block = crop_recommendations or []

    # 6. Disease Diagnosis
    disease_block = disease_diagnosis

    # 7. State Cooperation Layer Connection
    cooperation_block = active_state_model or {
        "state": state,
        "contributing_model": "Malwa Soybean Suitability & Pod Borer Predictor v1.4",
        "institution": "MP State Agriculture & DSR Indore",
        "federation_status": "Active Node"
    }

    return {
        "field": {
            "field_id": field_id,
            "name": field_name,
            "area_hectares": area_ha,
            "crop": crop,
            "state": state,
            "center_lat": center_lat,
            "center_lon": center_lon,
            "geometry": polygon
        },
        "satellite": satellite_block,
        "weather": weather_block,
        "soil": soil_block,
        "crop_recommendations": crops_block,
        "disease": disease_block,
        "state_cooperation": cooperation_block,
        "assembled_at": datetime.utcnow().isoformat() + "Z"
    }
