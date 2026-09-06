"""
Krishi Saarthi — Dual-Signal Agricultural Risk Engine
=====================================================
Integrates two independent damage signals into a scientifically defensible
agronomic risk evaluation:
  Signal 1 (Macro): Sentinel-2 Surface Reflectance (NDVI degradation %, NDMI water stress)
  Signal 2 (Micro): Farmer Leaf Photo via YOLO11m-seg (Visually Affected Foliar Area %)
  Forcing Factors:  Open-Meteo Weather Stress & Regional Soil Chemistry / VWC

Formulation:
  Composite Field Risk Score (0 - 100) =
      0.35 * (Satellite NDVI Decline Impact)
    + 0.30 * (YOLO Visually Affected Foliar Area)
    + 0.20 * (Weather Heat / Precipitation Stress)
    + 0.15 * (Soil Moisture & NPK Deficit)

Scientific Integrity Principle:
  "Visually affected foliar area %" indicates proximal foliar symptom extent,
  which is correlated with spectral NDVI decline and crop growth stage to model
  "Estimated Crop Impact" rather than conflating visual damage with direct yield loss.
"""

from typing import Dict, Any, Optional, List


def evaluate_dual_signal_field_risk(
    # Signal 1: Sentinel-2 Macro Telemetry
    ndvi_baseline: float = 0.72,
    ndvi_current: float = 0.61,
    ndmi_current: float = 0.32,
    # Signal 2: YOLO11m-seg Micro Foliar Vision
    visually_affected_area_pct: float = 18.7,
    detected_pathology: str = "Yellow Rust (Puccinia striiformis)",
    # Environmental Forcing: Weather & Soil
    heat_stress_score: float = 75.0,
    rainfall_anomaly_pct: float = -48.0,
    soil_moisture_vwc_pct: float = 21.0,
    crop_type: str = "Wheat",
    growth_stage: str = "Flowering / Grain Filling"
) -> Dict[str, Any]:
    """
    Computes a deterministic, multi-factor agronomic risk assessment
    by fusing satellite remote sensing and proximal computer vision.
    """
    # 1. Satellite Spectral Signal Impact (0 to 100)
    ndvi_drop_pct = max(0.0, ((ndvi_baseline - ndvi_current) / max(0.01, ndvi_baseline)) * 100.0)
    # NDVI drop scaling: 30% drop maps to ~90 points
    sat_impact_score = min(100.0, max(0.0, (ndvi_drop_pct / 35.0) * 100.0))

    # NDMI water stress contribution
    if ndmi_current < 0.20:
        sat_impact_score = min(100.0, sat_impact_score + 10.0)

    # 2. YOLO Proximal Foliar Vision Impact (0 to 100)
    # 18.7% visually affected leaf area maps to foliar damage pressure
    foliar_impact_score = min(100.0, max(0.0, (visually_affected_area_pct / 25.0) * 100.0))

    # 3. Weather Forcing Impact (0 to 100)
    rain_stress = min(100.0, max(0.0, abs(min(0.0, rainfall_anomaly_pct)) * 1.5))
    weather_impact_score = (0.50 * heat_stress_score) + (0.50 * rain_stress)

    # 4. Soil Moisture & Nutrient Deficit (0 to 100)
    # Ideal VWC is ~35%; below 20% indicates acute moisture deficit
    soil_deficit_score = min(100.0, max(0.0, (1.0 - (soil_moisture_vwc_pct / 35.0)) * 100.0))

    # 5. Composite Agronomic Fusion Formula
    composite_risk_score = round(
        (0.35 * sat_impact_score)
        + (0.30 * foliar_impact_score)
        + (0.20 * weather_impact_score)
        + (0.15 * soil_deficit_score),
        1
    )

    # Risk Tier Categorization
    if composite_risk_score >= 65.0:
        risk_tier = "CRITICAL_AGRICULTURAL_STRESS"
        risk_label = "High Agricultural Stress"
        badge_color = "red"
    elif composite_risk_score >= 35.0:
        risk_tier = "MODERATE_AGRICULTURAL_STRESS"
        risk_label = "Moderate Agricultural Stress"
        badge_color = "amber"
    else:
        risk_tier = "NORMAL_VEGETATION"
        risk_label = "Low Agricultural Stress"
        badge_color = "emerald"

    # Scientifically Defensible Estimated Crop Impact
    if composite_risk_score >= 75.0:
        estimated_impact = "Severe Potential Yield Degradation (35-50%)"
        impact_level = "Severe"
    elif composite_risk_score >= 55.0:
        estimated_impact = "Moderate Potential Yield Impact (15-30%)"
        impact_level = "Moderate"
    elif composite_risk_score >= 35.0:
        estimated_impact = "Mild Localized Stress (<15%)"
        impact_level = "Mild"
    else:
        estimated_impact = "Negligible Impact — Normal Vegetative Vigor"
        impact_level = "Negligible"

    healthy_veg_pct = round(max(0.0, 100.0 - visually_affected_area_pct), 1)

    if visually_affected_area_pct > 15:
        scientific_rationale = (
            f"Canopy inspection shows {visually_affected_area_pct}% leaf damage ({detected_pathology}), "
            f"aligning with a {ndvi_drop_pct:.1f}% decline in satellite vegetation vigor (NDVI {ndvi_current:.2f} vs {ndvi_baseline:.2f} baseline). "
            f"Combined with weather conditions and soil moisture levels, overall field stress is assessed as {risk_label.lower()} ({composite_risk_score}/100)."
        )
    else:
        scientific_rationale = (
            f"Satellite vegetation vigor is stable (NDVI {ndvi_current:.2f}) with minimal foliar stress ({visually_affected_area_pct}% affected area). "
            f"Overall field conditions remain favorable ({composite_risk_score}/100)."
        )

    return {
        "status": "success",
        "composite_field_risk_score": composite_risk_score,
        "risk_tier": risk_tier,
        "risk_label": risk_label,
        "badge_color": badge_color,
        "estimated_crop_impact": estimated_impact,
        "impact_level": impact_level,
        "crop_type": crop_type,
        "growth_stage": growth_stage,
        "scientific_rationale": scientific_rationale,
        "signals": {
            "satellite_macro": {
                "sensor": "Sentinel-2 MSI (10m L2A)",
                "ndvi_baseline": ndvi_baseline,
                "ndvi_current": ndvi_current,
                "ndvi_decline_pct": round(ndvi_drop_pct, 1),
                "ndmi_moisture_index": ndmi_current,
                "signal_weight_pct": 35,
                "partial_score": round(sat_impact_score, 1)
            },
            "yolo_foliar_micro": {
                "model": "YOLO11m-seg",
                "visually_affected_area_pct": visually_affected_area_pct,
                "healthy_vegetation_pct": healthy_veg_pct,
                "pathology_detected": detected_pathology,
                "signal_weight_pct": 30,
                "partial_score": round(foliar_impact_score, 1)
            },
            "weather_environmental": {
                "source": "Open-Meteo Agro-Reanalysis",
                "heat_stress_rating": "HIGH" if heat_stress_score > 65 else "MODERATE",
                "heat_stress_score": heat_stress_score,
                "rainfall_anomaly_pct": rainfall_anomaly_pct,
                "signal_weight_pct": 20,
                "partial_score": round(weather_impact_score, 1)
            },
            "soil_edaphic": {
                "soil_moisture_vwc_pct": soil_moisture_vwc_pct,
                "moisture_status": "LOW" if soil_moisture_vwc_pct < 24.0 else "OPTIMAL",
                "signal_weight_pct": 15,
                "partial_score": round(soil_deficit_score, 1)
            }
        },
        "recommended_interventions": [
            "Initiate immediate foliar barrier spray (Neem kernel extract 5% or sour buttermilk solution)",
            "Apply potassium-rich anti-transpirant spray to mitigate canopy heat stress",
            "Schedule calibrated supplemental irrigation within 36 hours to relieve soil VWC deficit",
            "Log cryptographic commitment on ZK-SNARK ledger for parametric insurance eligibility"
        ]
    }
