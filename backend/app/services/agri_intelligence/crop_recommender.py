"""
Crop Recommendation Engine — Krishi Saarthi Agricultural Intelligence Core
Authoritative crop suitability ranking grounded in soil chemistry, weather telemetry,
Sentinel-2 spectral health, and regional agronomic benchmarks (ICAR guidelines).
"""

from typing import List, Dict, Any, Optional
import math

# Agronomic optimal ranges for major Indian crops (ICAR standards)
AGRONOMIC_PROFILES: Dict[str, Dict[str, Any]] = {
    "Soybean": {
        "n_opt": (20, 50),
        "p_opt": (35, 65),
        "k_opt": (25, 55),
        "ph_opt": (6.0, 7.5),
        "oc_opt": (0.5, 1.2),
        "temp_opt": (22.0, 32.0),
        "rainfall_opt": (600, 1000),
        "humidity_opt": (60, 85),
        "ndvi_min": 0.40,
        "seasons": ["Kharif"],
        "major_states": ["Madhya Pradesh", "Maharashtra", "Rajasthan"],
        "description": "Thrives in well-drained medium black soils with balanced phosphorus and moderate seasonal rainfall."
    },
    "Maize": {
        "n_opt": (60, 120),
        "p_opt": (40, 70),
        "k_opt": (30, 60),
        "ph_opt": (5.8, 7.8),
        "oc_opt": (0.4, 1.0),
        "temp_opt": (20.0, 30.0),
        "rainfall_opt": (500, 900),
        "humidity_opt": (55, 80),
        "ndvi_min": 0.35,
        "seasons": ["Kharif", "Rabi"],
        "major_states": ["Madhya Pradesh", "Karnataka", "Bihar", "Gujarat"],
        "description": "High yield potential in alluvial and loamy soils with adequate nitrogen top-dressing."
    },
    "Cotton": {
        "n_opt": (50, 90),
        "p_opt": (25, 50),
        "k_opt": (30, 60),
        "ph_opt": (6.5, 8.2),
        "oc_opt": (0.4, 0.9),
        "temp_opt": (24.0, 35.0),
        "rainfall_opt": (500, 850),
        "humidity_opt": (50, 75),
        "ndvi_min": 0.30,
        "seasons": ["Kharif"],
        "major_states": ["Maharashtra", "Gujarat", "Telangana", "Punjab"],
        "description": "Deep black soils (Regur) with good water retention and warm sunny growing season."
    },
    "Wheat": {
        "n_opt": (80, 140),
        "p_opt": (40, 60),
        "k_opt": (30, 50),
        "ph_opt": (6.0, 7.5),
        "oc_opt": (0.5, 1.2),
        "temp_opt": (15.0, 25.0),
        "rainfall_opt": (250, 500),
        "humidity_opt": (45, 70),
        "ndvi_min": 0.45,
        "seasons": ["Rabi"],
        "major_states": ["Punjab", "Haryana", "Madhya Pradesh", "Uttar Pradesh"],
        "description": "Prefers cool vegetative phase and temperate ripening conditions in fertile clay-loam."
    },
    "Groundnut": {
        "n_opt": (15, 30),
        "p_opt": (35, 60),
        "k_opt": (35, 65),
        "ph_opt": (6.0, 7.0),
        "oc_opt": (0.4, 0.8),
        "temp_opt": (22.0, 32.0),
        "rainfall_opt": (450, 750),
        "humidity_opt": (50, 75),
        "ndvi_min": 0.35,
        "seasons": ["Kharif", "Rabi"],
        "major_states": ["Gujarat", "Andhra Pradesh", "Tamil Nadu", "Rajasthan"],
        "description": "Sandy-loam well aerated soils allow effortless peg penetration and pod formation."
    },
    "Rice (Paddy)": {
        "n_opt": (80, 150),
        "p_opt": (30, 60),
        "k_opt": (30, 60),
        "ph_opt": (5.0, 6.8),
        "oc_opt": (0.6, 1.5),
        "temp_opt": (24.0, 35.0),
        "rainfall_opt": (1000, 1800),
        "humidity_opt": (70, 95),
        "ndvi_min": 0.50,
        "seasons": ["Kharif"],
        "major_states": ["West Bengal", "Punjab", "Uttar Pradesh", "Andhra Pradesh"],
        "description": "Heavy clay soils with high water holding capacity and steady standing water availability."
    },
    "Chickpea (Gram)": {
        "n_opt": (15, 30),
        "p_opt": (40, 60),
        "k_opt": (20, 40),
        "ph_opt": (6.5, 7.8),
        "oc_opt": (0.4, 0.9),
        "temp_opt": (18.0, 28.0),
        "rainfall_opt": (200, 450),
        "humidity_opt": (40, 65),
        "ndvi_min": 0.30,
        "seasons": ["Rabi"],
        "major_states": ["Madhya Pradesh", "Maharashtra", "Rajasthan", "Karnataka"],
        "description": "Requires residual soil moisture in medium to heavy soils; sensitive to frost and waterlogging."
    },
    "Mustard": {
        "n_opt": (60, 90),
        "p_opt": (30, 50),
        "k_opt": (20, 40),
        "ph_opt": (6.0, 7.5),
        "oc_opt": (0.4, 0.9),
        "temp_opt": (15.0, 25.0),
        "rainfall_opt": (150, 350),
        "humidity_opt": (45, 70),
        "ndvi_min": 0.35,
        "seasons": ["Rabi"],
        "major_states": ["Rajasthan", "Haryana", "Madhya Pradesh", "Uttar Pradesh"],
        "description": "Cool dry climate with moderate soil moisture; excellent oil synthesis during bright sunny days."
    }
}

def _calculate_parameter_fit(value: float, min_val: float, max_val: float) -> float:
    """Calculates Gaussian-tapered suitability score (0 - 100) for a given agronomic parameter."""
    if min_val <= value <= max_val:
        return 100.0
    
    mid = (min_val + max_val) / 2.0
    half_width = (max_val - min_val) / 2.0
    diff = abs(value - mid) - half_width
    tolerance = half_width * 1.2
    
    fit = max(0.0, 100.0 - (diff / max(1.0, tolerance)) * 70.0)
    return round(fit, 1)

def rank_crops_for_field(
    soil_n: float,
    soil_p: float,
    soil_k: float,
    soil_ph: float,
    soil_oc: float,
    temp_mean: float,
    rainfall_seasonal_mm: float,
    humidity_mean: float,
    ndvi_current: float = 0.60,
    ndmi_current: float = 0.40,
    state: str = "Madhya Pradesh",
    season: str = "Kharif",
    top_k: int = 5
) -> List[Dict[str, Any]]:
    """
    Ranks suitable crops using agronomic multi-attribute scoring
    and provides feature attribution breakdown for explainability.
    """
    ranked_results = []

    for crop_name, profile in AGRONOMIC_PROFILES.items():
        # 1. Soil Suitability Score
        n_fit = _calculate_parameter_fit(soil_n, profile["n_opt"][0], profile["n_opt"][1])
        p_fit = _calculate_parameter_fit(soil_p, profile["p_opt"][0], profile["p_opt"][1])
        k_fit = _calculate_parameter_fit(soil_k, profile["k_opt"][0], profile["k_opt"][1])
        ph_fit = _calculate_parameter_fit(soil_ph, profile["ph_opt"][0], profile["ph_opt"][1])
        oc_fit = _calculate_parameter_fit(soil_oc, profile["oc_opt"][0], profile["oc_opt"][1])
        soil_score = round(0.25 * n_fit + 0.25 * p_fit + 0.20 * k_fit + 0.20 * ph_fit + 0.10 * oc_fit, 1)

        # 2. Weather / Temperature Suitability
        temp_score = _calculate_parameter_fit(temp_mean, profile["temp_opt"][0], profile["temp_opt"][1])

        # 3. Rainfall Suitability
        rain_score = _calculate_parameter_fit(rainfall_seasonal_mm, profile["rainfall_opt"][0], profile["rainfall_opt"][1])

        # 4. Water Requirement Match (using NDMI moisture + rainfall)
        moisture_indicator = max(0.0, min(1.0, (ndmi_current + 0.2) / 0.8)) * 100.0
        water_req_match = round(0.6 * rain_score + 0.4 * moisture_indicator, 1)

        # 5. Satellite Condition Fit (vegetation vigor match)
        sat_fit = min(100.0, round((ndvi_current / profile["ndvi_min"]) * 75.0, 1)) if profile["ndvi_min"] > 0 else 85.0

        # Regional & Seasonal Boosts
        regional_multiplier = 1.05 if state in profile["major_states"] else 0.95
        seasonal_multiplier = 1.10 if season in profile["seasons"] else 0.85

        # Weighted aggregate suitability
        raw_score = (
            0.30 * soil_score +
            0.25 * rain_score +
            0.20 * temp_score +
            0.15 * water_req_match +
            0.10 * sat_fit
        ) * regional_multiplier * seasonal_multiplier

        composite_score = round(min(0.98, max(0.35, raw_score / 100.0)), 2)

        # Contextual Rationale Generator
        rationale_parts = []
        if soil_score >= 85:
            rationale_parts.append(f"Optimal soil pH ({soil_ph}) and NPK balance")
        if rain_score >= 80:
            rationale_parts.append(f"Rainfall profile ({int(rainfall_seasonal_mm)} mm) aligns with growth stage")
        if temp_score >= 85:
            rationale_parts.append(f"Temperature regime ({temp_mean}°C) maximizes flowering")
        if sat_fit >= 80:
            rationale_parts.append(f"Satellite canopy index ({ndvi_current:.2f}) indicates favorable ground vigor")
        
        rationale = "; ".join(rationale_parts) if rationale_parts else profile["description"]

        ranked_results.append({
            "crop": crop_name,
            "suitability_score": composite_score,
            "suitability_pct": int(composite_score * 100),
            "breakdown": {
                "soil_suitability": int(soil_score),
                "rainfall_suitability": int(rain_score),
                "temperature_suitability": int(temp_score),
                "water_requirement_match": int(water_req_match),
                "satellite_condition_fit": int(sat_fit)
            },
            "rationale": rationale,
            "season_fit": season in profile["seasons"],
            "state_recommended": state in profile["major_states"]
        })

    # Sort descending by composite suitability score
    ranked_results.sort(key=lambda x: x["suitability_score"], reverse=True)
    
    # Assign ranks
    for idx, item in enumerate(ranked_results):
        item["rank"] = idx + 1

    return ranked_results[:top_k]
