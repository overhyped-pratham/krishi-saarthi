"""
Soil Intelligence Engine — Krishi Saarthi
Provides structured SoilProfile management, regional spatial soil telemetry,
and state Soil Health Card interoperability adapters.
"""

from typing import Dict, Any, Optional
from pydantic import BaseModel, Field

class SoilProfile(BaseModel):
    nitrogen_kg_ha: float = Field(..., description="Available Nitrogen in kg/ha")
    phosphorus_kg_ha: float = Field(..., description="Available Phosphorus (P2O5) in kg/ha")
    potassium_kg_ha: float = Field(..., description="Available Potassium (K2O) in kg/ha")
    ph: float = Field(..., description="Soil pH index (0-14)")
    organic_carbon_pct: float = Field(..., description="Organic Carbon percentage")
    soil_moisture_vwc_pct: Optional[float] = Field(22.0, description="Volumetric Water Content %")
    soil_type: str = Field("Medium Black Soil", description="Classified soil taxonomic category")
    data_source: str = Field("farmer_entered", description="farmer_entered | regional_spatial_default | state_soil_health_card")
    state_origin: Optional[str] = Field(None, description="Origin state for official soil health records")

# Regional Agro-climatic spatial soil baselines across key agricultural zones
REGIONAL_SOIL_BASELINES: Dict[str, Dict[str, Any]] = {
    "Madhya Pradesh": {
        "region_name": "Malwa Plateau & Narmada Basin",
        "soil_type": "Medium to Deep Black Cotton Soil (Vertisol)",
        "nitrogen_kg_ha": 42.0,
        "phosphorus_kg_ha": 22.0,
        "potassium_kg_ha": 48.0,
        "ph": 7.2,
        "organic_carbon_pct": 0.68,
        "cation_exchange_capacity": 45.0,
        "soil_moisture_vwc_pct": 24.5,
        "deficiencies": ["Zinc", "Sulfur"],
        "management_tip": "High clay content requires careful drainage management during heavy monsoon spells."
    },
    "Maharashtra": {
        "region_name": "Vidarbha & Marathwada Black Soil Belt",
        "soil_type": "Basaltic Black Clay Loam",
        "nitrogen_kg_ha": 38.0,
        "phosphorus_kg_ha": 18.0,
        "potassium_kg_ha": 52.0,
        "ph": 7.6,
        "organic_carbon_pct": 0.55,
        "cation_exchange_capacity": 48.0,
        "soil_moisture_vwc_pct": 21.0,
        "deficiencies": ["Boron", "Zinc"],
        "management_tip": "Prone to severe moisture stress during dry spells; deep tillage and mulching recommended."
    },
    "Gujarat": {
        "region_name": "Saurashtra & Central Alluvial Plain",
        "soil_type": "Sandy Clay Loam / Medium Black",
        "nitrogen_kg_ha": 40.0,
        "phosphorus_kg_ha": 26.0,
        "potassium_kg_ha": 44.0,
        "ph": 7.8,
        "organic_carbon_pct": 0.62,
        "cation_exchange_capacity": 38.0,
        "soil_moisture_vwc_pct": 20.5,
        "deficiencies": ["Iron", "Sulfur"],
        "management_tip": "Slight alkalinity; gypsum amendment helps enhance groundnut pod yield."
    },
    "Punjab": {
        "region_name": "Indo-Gangetic Alluvial Plains",
        "soil_type": "Coarse Loam / Alluvial Sandy Loam",
        "nitrogen_kg_ha": 58.0,
        "phosphorus_kg_ha": 32.0,
        "potassium_kg_ha": 38.0,
        "ph": 7.4,
        "organic_carbon_pct": 0.48,
        "cation_exchange_capacity": 28.0,
        "soil_moisture_vwc_pct": 25.0,
        "deficiencies": ["Zinc", "Manganese"],
        "management_tip": "Intensive cropping requires green manuring to rebuild organic carbon reserves."
    },
    "Karnataka": {
        "region_name": "Deccan Southern Plateau",
        "soil_type": "Red Sandy Loam to Clay (Alfisols)",
        "nitrogen_kg_ha": 34.0,
        "phosphorus_kg_ha": 16.0,
        "potassium_kg_ha": 36.0,
        "ph": 6.4,
        "organic_carbon_pct": 0.52,
        "cation_exchange_capacity": 22.0,
        "soil_moisture_vwc_pct": 19.5,
        "deficiencies": ["Phosphorus", "Boron"],
        "management_tip": "Slightly acidic; phosphorus fixing is common. Use rock phosphate with PSB culture."
    }
}

def get_regional_soil_profile(state: str) -> SoilProfile:
    """Retrieves authoritative regional spatial soil profile for given state."""
    data = REGIONAL_SOIL_BASELINES.get(state, REGIONAL_SOIL_BASELINES["Madhya Pradesh"])
    return SoilProfile(
        nitrogen_kg_ha=data["nitrogen_kg_ha"],
        phosphorus_kg_ha=data["phosphorus_kg_ha"],
        potassium_kg_ha=data["potassium_kg_ha"],
        ph=data["ph"],
        organic_carbon_pct=data["organic_carbon_pct"],
        soil_moisture_vwc_pct=data["soil_moisture_vwc_pct"],
        soil_type=data["soil_type"],
        data_source="regional_spatial_default",
        state_origin=state
    )

def evaluate_soil_health(profile: SoilProfile) -> Dict[str, Any]:
    """Evaluates nutrient adequacy according to National Soil Health Card benchmarks."""
    n_status = "Deficient" if profile.nitrogen_kg_ha < 30 else ("Sufficient" if profile.nitrogen_kg_ha <= 60 else "Surplus")
    p_status = "Deficient" if profile.phosphorus_kg_ha < 20 else ("Sufficient" if profile.phosphorus_kg_ha <= 50 else "Surplus")
    k_status = "Deficient" if profile.potassium_kg_ha < 30 else ("Sufficient" if profile.potassium_kg_ha <= 60 else "Surplus")
    
    ph_status = "Acidic" if profile.ph < 6.5 else ("Optimal Neutral" if profile.ph <= 7.5 else "Alkaline")
    oc_status = "Low (<0.5%)" if profile.organic_carbon_pct < 0.50 else ("Medium (0.5-0.75%)" if profile.organic_carbon_pct <= 0.75 else "High (>0.75%)")

    score = 100
    if n_status == "Deficient": score -= 15
    if p_status == "Deficient": score -= 15
    if k_status == "Deficient": score -= 10
    if ph_status != "Optimal Neutral": score -= 10
    if profile.organic_carbon_pct < 0.5: score -= 15

    return {
        "overall_soil_health_score": max(30, score),
        "ratings": {
            "nitrogen": n_status,
            "phosphorus": p_status,
            "potassium": k_status,
            "ph": ph_status,
            "organic_carbon": oc_status
        },
        "recommendation": "Maintain balanced NPK fertilization. Incorporate bio-fertilizers and crop residue to enhance organic carbon."
    }
