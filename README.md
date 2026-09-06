<div align="center">

<img src="https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=1200&auto=format&fit=crop" width="100%" style="border-radius: 12px; border: 1px solid #00f3ff; box-shadow: 0 0 30px rgba(0,243,255,0.3);" alt="Krishi Saarthi Cooperative Agricultural Intelligence Network" />

# 🌾 KRISHI SAARTHI (कृषि सारथी)
### Cooperative Agricultural Intelligence Network & Zero-Trust Parametric Engine

<p align="center">
  <b>“From satellite intelligence to farmer action.”</b><br>
  <i>An Interoperable Digital Public Good (DPG) combining spaceborne earth observation, soil chemistry, deterministic weather risk forecasting, explainable ML crop recommendations, plant disease vision with Grad-CAM, grounded multilingual conversational AI, and cross-state model federation.</i>
</p>

[![License: MIT](https://img.shields.io/badge/License-MIT-00f3ff?style=for-the-badge&logo=opensourceinitiative&logoColor=000000&labelColor=000000)](https://opensource.org/licenses/MIT)
[![Sentinel-2 MSI](https://img.shields.io/badge/Satellite-Sentinel--2_MSI_L2A-00f3ff?style=for-the-badge&logo=nasa&logoColor=000000&labelColor=000000)](https://sentinels.copernicus.eu/)
[![Open-Meteo](https://img.shields.io/badge/Weather-Open--Meteo_API-00f3ff?style=for-the-badge&logo=open-meteo&logoColor=000000&labelColor=000000)](https://open-meteo.com/)
[![XGBoost ML](https://img.shields.io/badge/Suitability_ML-XGBoost_Explainable-00f3ff?style=for-the-badge&logo=scikit-learn&logoColor=000000&labelColor=000000)](https://xgboost.readthedocs.io/)
[![PlantVillage](https://img.shields.io/badge/Pathology-PlantVillage_+_Grad--CAM-00f3ff?style=for-the-badge&logo=pytorch&logoColor=000000&labelColor=000000)](https://plantvillage.psu.edu/)
[![Gemini AI](https://img.shields.io/badge/AI_Copilot-Gemini_Multimodal-00f3ff?style=for-the-badge&logo=google&logoColor=000000&labelColor=000000)](https://ai.google.dev/)
[![Circom 2.1](https://img.shields.io/badge/ZKP-Circom_2.1_Groth16-00f3ff?style=for-the-badge&logo=gnometerminal&logoColor=000000&labelColor=000000)](https://docs.circom.io/)

---

> ⚡ **THE BIG JUDGING DIFFERENTIATOR: COOPERATIVE AGRICULTURAL INTELLIGENCE LAYER**
> 
> *Agricultural intelligence across India has historically been fragmented across state departments and research institutes. **Krishi Saarthi** builds an interoperable **Digital Public Good (DPG)** where states (Madhya Pradesh, Gujarat, Maharashtra, Punjab, Karnataka) contribute and federate localized crop models, disease radars, and soil datasets into a single unified farmer-facing layer.*
> 
> **The Core Narrative:**
> 1. **Satellite** tells us *what* is happening in the field (NDVI 0.64, NDMI 0.41, canopy vigor).
> 2. **Weather & Soil** tell us *why* it may be happening (62 mm rainfall forecast in 72h, soil pH 7.2).
> 3. **AI** converts those signals into actionable intelligence (XGBoost ranked crop suitability with explainability bars, leaf disease diagnosis with Grad-CAM).
> 4. **Krishi Saarthi Copilot** explains it to the farmer in their native language (Hindi, Marathi, Gujarati, Telugu, English).
> 5. **The Cooperation Layer** allows state agriculture departments to share, version, and federate models across borders.
> 6. **AgriProof Parametric Settlement** provides zero-knowledge cryptographic payout guarantees when extreme environmental thresholds are triggered.

---

</div>

## 📑 Table of Contents
1. [Executive Overview & System Architecture](#-executive-overview--system-architecture)
2. [Unified Central Data Contract](#-unified-central-data-contract)
3. [The 8 Core Pillars](#-the-8-core-pillars)
   - [Pillar 1: Fullscreen Farmer Field Mapping](#pillar-1-fullscreen-farmer-field-mapping)
   - [Pillar 2: Sentinel-2 Satellite Intelligence](#pillar-2-sentinel-2-satellite-intelligence)
   - [Pillar 3: Open-Meteo Weather Risk Engine](#pillar-3-open-meteo-weather-risk-engine)
   - [Pillar 4: Soil Intelligence & State Soil Cards](#pillar-4-soil-intelligence--state-soil-cards)
   - [Pillar 5: Explainable XGBoost Crop Recommendation](#pillar-5-explainable-xgboost-crop-recommendation)
   - [Pillar 6: Crop Disease Vision with Grad-CAM](#pillar-6-crop-disease-vision-with-grad-cam)
   - [Pillar 7: Grounded Multilingual Krishi Saarthi AI Copilot](#pillar-7-grounded-multilingual-krishi-saarthi-ai-copilot)
   - [Pillar 8: State Cooperation & Model Registry Layer](#pillar-8-state-cooperation--model-registry-layer)
4. [Dual Capability: Zero-Knowledge Parametric Engine](#-dual-capability-zero-knowledge-parametric-engine)
5. [API Specifications](#-api-specifications)
6. [Judges Demo Journey (15-Step Script)](#-judges-demo-journey-15-step-script)
7. [Quickstart & Local Deployment](#-quickstart--local-deployment)
8. [Open Source References & Acknowledgments](#-open-source-references--acknowledgments)

---

## 🌐 Executive Overview & System Architecture

```text
                     ┌────────────────────────────────────────┐
                     │        FARMER / AGRI-OFFICER           │
                     └───────────────────┬────────────────────┘
                                         │ Native Regional Language (HI/EN/MR/GU/TE)
                                         ▼
                     ┌────────────────────────────────────────┐
                     │       KRISHI SAARTHI AI COPILOT        │
                     │  (Grounded Multilingual Conversational)│
                     └───────────────────┬────────────────────┘
                                         │
                                         ▼
                     ┌────────────────────────────────────────┐
                     │       CENTRAL DATA CONTRACT CORE       │
                     └───────────────────┬────────────────────┘
                                         │
        ┌───────────────────┬────────────┴──────────┬───────────────────┐
        ▼                   ▼                       ▼                   ▼
┌───────────────┐   ┌───────────────┐       ┌───────────────┐   ┌───────────────┐
│ SATELLITE     │   │ WEATHER       │       │ SOIL          │   │ DISEASE       │
│ ENGINE        │   │ ENGINE        │       │ ENGINE        │   │ VISION        │
│ Sentinel-2 L2A│   │ Open-Meteo    │       │ SoilProfile   │   │ PlantVillage  │
│ NDVI/NDMI/EVI │   │ 72h Risk Low/ │       │ N-P-K-pH-OC   │   │ Grad-CAM      │
│ Heatmap Mask  │   │ Med/High Risk │       │ Spatial Cards │   │ IPM Advisory  │
└───────┬───────┘   └───────┬───────┘       └───────┬───────┘   └───────┬───────┘
        │                   │                       │                   │
        └───────────────────┼───────────────────────┴───────────────────┘
                            ▼
           ┌────────────────────────────────────────┐
           │       AGRICULTURAL INTELLIGENCE        │
           │  • XGBoost Suitability Ranking         │
           │  • Feature Attribution Breakdown       │
           │  • Deterministic Weather Rules         │
           └────────────────┬───────────────────────┘
                            │
            ────────────────┴─────────────────
            STATE COOPERATION MODEL REGISTRY
            ────────────────┬─────────────────
                            │
       ┌────────────────────┼────────────────────┐
       ▼                    ▼                    ▼
Madhya Pradesh           Gujarat            Maharashtra
Soybean Suitability  Cotton Bollworm     Vidarbha Deficit
  Model v1.4           Radar v2.1           Model v1.2
```

---

## 📦 Unified Central Data Contract

All backend subsystems feed into a single canonical data structure consumed by Krishi Saarthi:

```typescript
interface CentralAgriculturalIntelligence {
  field: {
    field_id: string;
    name: string;
    area_hectares: number;
    crop: string;
    state: string;
    center_lat: number;
    center_lon: number;
    geometry: number[][];
  };
  satellite: {
    observation_date: string;
    sensor: "Sentinel-2 MSI Level-2A";
    cloud_coverage_pct: number;
    ndvi: number; // e.g. 0.64
    ndmi: number; // e.g. 0.41
    evi: number;  // e.g. 0.52
    vegetation_status: "Healthy" | "Moderate Stress" | "Degraded";
    health_score: number; // 0 - 100 (e.g. 82)
    change_vs_baseline_pct: number; // e.g. -8.4%
    is_live_telemetry: boolean;
    data_mode: "LIVE_ORBITAL_TELEMETRY" | "DEMO_FALLBACK";
  };
  weather: {
    temperature_c: number;
    rainfall_mm_30d: number;
    rainfall_forecast_72h_mm: number; // e.g. 62.0 mm
    humidity_pct: number;
    soil_moisture_vwc_pct: number;
    risks: {
      rainfall_risk: "LOW" | "MEDIUM" | "HIGH";
      temperature_risk: "LOW" | "MEDIUM" | "HIGH";
      drought_risk: "LOW" | "MEDIUM" | "HIGH";
      overall_risk: "LOW" | "MEDIUM" | "HIGH";
    };
    actionable_warnings: string[];
  };
  soil: {
    nitrogen_kg_ha: number;
    phosphorus_kg_ha: number;
    potassium_kg_ha: number;
    ph: number;
    organic_carbon_pct: number;
    soil_moisture_vwc_pct: number;
    soil_type: string;
    data_source: "farmer_entered" | "regional_spatial_default" | "state_soil_health_card";
  };
  crop_recommendations: Array<{
    crop: string;
    suitability_score: number;
    suitability_pct: number;
    rank: number;
    breakdown: {
      soil_suitability: number;
      rainfall_suitability: number;
      temperature_suitability: number;
      water_requirement_match: number;
      satellite_condition_fit: number;
    };
    rationale: string;
  }>;
  disease_diagnosis: {
    detected: boolean;
    crop: string;
    disease: string;
    confidence: number;
    severity: "Mild" | "Moderate" | "Critical";
    gradcam_bounding_boxes: Array<{ x: number; y: number; width: number; height: number; intensity: number }>;
    advisory_disclaimer: string;
    organic_remedies: string[];
    ipm_practices: string[];
  };
  state_cooperation: {
    origin_state: string;
    contributing_model: string;
    institution: string;
    version: string;
    federation_status: string;
  };
}
```

---

## 🏛️ The 8 Core Pillars

### Pillar 1: Fullscreen Farmer Field Mapping
- Fullscreen Leaflet GIS studio with satellite imagery basemap.
- Point-and-click or freehand touch vertex boundary placement.
- Real-time Shoelace geodesic area calculation in Hectares and Acres.
- Undo, Clear, Redraw, Fix Shape, and auto-closing polygon logic.
- Instant GeoJSON storage and automatic map viewport fitting upon save.

### Pillar 2: Sentinel-2 Satellite Intelligence
- Level-2A Bottom-Of-Atmosphere (BOA) surface reflectance processing (B2 Blue, B3 Green, B4 Red, B8 NIR, B11 SWIR).
- Spectral Vegetation Indices:
  - **NDVI** = $(B8 - B4) / (B8 + B4)$ (Canopy Vigor)
  - **NDMI** = $(B8 - B11) / (B8 + B11)$ (Canopy Moisture Stress)
  - **EVI** = $2.5 \times (B8 - B4) / (B8 + 6 \times B4 - 7.5 \times B2 + 1)$
- **Scientific Disclosure:** The UI explicitly communicates that NDVI is a remotely sensed spectral index, not an AI prediction.
- High-contrast vegetation health classification ("Healthy", "Moderate Stress", "Degraded").

### Pillar 3: Open-Meteo Weather Risk Engine
- Deterministic 3-tier risk engine evaluating 72-hour precipitation forecast, heat index, and soil moisture VWC:
  - **Rainfall Risk:** $\ge 50\text{ mm} \implies \text{HIGH}$, $\ge 25\text{ mm} \implies \text{MEDIUM}$, $< 25\text{ mm} \implies \text{LOW}$.
- Deterministic warning generator (e.g. *"⚠️ Heavy rainfall risk — HIGH: 62 mm rainfall expected within the next 72 hours. Postpone chemical spray and field irrigation."*).
- Never delegates risk threshold computation to unconstrained LLMs.

### Pillar 4: Soil Intelligence & State Soil Cards
- Accepts farmer-entered soil test metrics (N, P, K, pH, Organic Carbon, Moisture VWC).
- Pre-loaded with regional agro-climatic spatial baselines (Madhya Pradesh Malwa Vertisols, Maharashtra Vidarbha Black Loam, Gujarat Saurashtra Loam, Punjab Indo-Gangetic Alluvium, Karnataka Deccan Alfisols).
- Interactive nutrient adequacy ratings based on National Soil Health Card benchmarks.

### Pillar 5: Explainable XGBoost Crop Recommendation
- Evaluates soil chemistry, seasonal rainfall, temperature regime, NDMI water match, and satellite vigor.
- Ranks top crops (e.g. 1. Soybean 98%, 2. Maize 98%, 3. Cotton 98%, 4. Groundnut 90%, 5. Rice 81%).
- **Granular Explainability:** Feature attribution breakdown across Soil, Rainfall, Temperature, Water Requirement, and Satellite Fit.
- Plain-language agronomic rationale explaining *why* a crop was selected.

### Pillar 6: Crop Disease Vision with Grad-CAM
- Plant leaf classification across PlantVillage baseline classes (Wheat Yellow Rust, Potato Late Blight, Tomato Early Blight, Soybean Brown Spot, Rice Bacterial Blight).
- **Grad-CAM Attention Heatmap:** Visual bounding boxes indicating exactly where the deep learning model identified foliar lesions.
- Severity classification ("Mild", "Moderate", "Critical") and confidence score.
- Safe IPM (Integrated Pest Management) precautions and organic remedies without hallucinated pesticide dosages.
- Mandatory legal disclaimer: *"AI prediction based on visual symptoms. Always consult your local Krishi Vigyan Kendra (KVK)."*

### Pillar 7: Grounded Multilingual Krishi Saarthi AI Copilot
- Farmer conversational assistant with full support for **Hindi (हिन्दी / Hinglish), English, Marathi (मराठी), Gujarati (ગુજરાતી), and Telugu (తెలుగు)**.
- Injects authoritative structured telemetry context; strictly prevents hallucinations or invented sensor numbers.
- Scientific numbers (e.g. `NDVI 0.64`, `62 mm`) remain unchanged across translations.
- Web Speech Synthesis audio briefing for illiterate or voice-first farmers.

### Pillar 8: State Cooperation & Model Registry Layer
- **The Core Hackathon Differentiator:** An open registry enabling Indian states and agricultural institutes to share specialized AI models.
- Pre-seeded authentic state models:
  1. **Madhya Pradesh:** Malwa Soybean Suitability & Pod Borer Predictor v1.4 (MP Dept of Ag & DSR)
  2. **Gujarat:** Saurashtra Pink Bollworm Early Warning Radar v2.1 (Gujarat Krishi Parishad & AAU)
  3. **Maharashtra:** Vidarbha Rainfed Moisture Deficit & Wilting Forecaster v1.2 (Maharashtra Ag Bureau)
  4. **Punjab:** Yellow Rust Micro-Climate & Stubble Fire Risk Forecaster v3.0 (PRSC Ludhiana)
  5. **Karnataka:** Southern Dry Zone Finger Millet (Ragi) Drought Resilience v1.1 (KSRSAC)
- RESTful Model Registry APIs (`GET /models`, `POST /models`, `GET /states`, `GET /states/:state/models`).
- "Register State Model" modal form allowing state departments to register their models into the national exchange.

---

## ⛓️ Dual Capability: Zero-Knowledge Parametric Engine

All original winning functionalities of **AgriProof AI** remain fully operational:
- **Groth16 Zero-Knowledge Proofs on BN128:** Proves $\Delta\text{NDVI} \ge 30\%$ and drought anomalies without revealing exact farm GPS coordinates.
- **SHA-256 Merkle-Linked Ledger:** Tamper-evident claim block verification (`/ledger`).
- **Polygon PoS Smart Pool:** Simulated instant USDC claim disbursement (`/insurer`).

---

## 📡 API Specifications

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check, farms count, and registered state models count |
| `POST` | `/api/fields` | Save field geometry as GeoJSON with area calculation |
| `GET` | `/api/fields/:id` | Retrieve saved field geometry and metadata |
| `GET` | `/api/fields/:id/health` | Sentinel-2 spectral indices (NDVI, NDMI, EVI, health score) |
| `GET` | `/api/fields/:id/weather` | Open-Meteo telemetry & deterministic 3-tier risk warnings |
| `POST` | `/api/crop-recommendation` | XGBoost crop suitability ranking with feature contributions |
| `POST` | `/api/disease-diagnosis` | Plant leaf diagnosis with Grad-CAM heatmap coordinates |
| `GET` | `/api/soil-profiles/:state` | State soil health card baseline & nutrient evaluation |
| `GET` | `/api/states` | List connected states and active federated models |
| `GET` | `/api/models` | List shared models in the Agricultural Model Registry |
| `GET` | `/api/models/:id` | Detailed model card with input/output JSON schemas |
| `POST` | `/api/models` | Register a new state agricultural model |
| `GET` | `/api/krishi-saarthi/central-intelligence/:id` | Single authoritative agricultural intelligence contract |
| `POST` | `/api/krishi-saarthi/chat` | Grounded multilingual conversational copilot |

---

## 🎯 Judges Demo Journey (15-Step Script)

1. **Open Krishi Saarthi:** Navigate to `http://localhost:3000/`. Notice the product name **Krishi Saarthi** and tagline: *"From satellite intelligence to farmer action."*
2. **Select State Scenario:** Click on the **Madhya Pradesh (Soybean)** scenario preset button.
3. **Inspect Satellite Telemetry:** Point out the Sentinel-2 card displaying **NDVI 0.64**, **NDMI 0.41**, **Health Score 82/100**, and the notice that NDVI is a remotely sensed spectral index.
4. **Review Weather Risk Warning:** Point out the deterministic Open-Meteo warning: **Heavy rainfall risk — HIGH (62 mm in next 72 hours)**.
5. **Inspect Soil Intelligence:** Review the soil panel showing NPK, pH 7.2, and Organic Carbon 0.68%. Click "Adjust Soil Values" to show dynamic real-time adjustment.
6. **Review Crop Suitability:** Open the Crop Recommendation Card showing **Soybean (98%)** and **Maize (98%)** with feature attribution progress bars.
7. **Perform Crop Disease Diagnosis:** In the Crop Doctor card, click on the **Wheat Yellow Rust** preset. Observe the Grad-CAM visual attention overlay highlighting foliar lesions.
8. **Engage Krishi Saarthi Copilot in Hindi:** Click the quick prompt chip: *"Mere khet mein fasal kaisi hai?"*.
9. **Observe Grounded Output:** Notice the response quotes NDVI 0.64 and the 62 mm rainfall warning without any hallucinations.
10. **Test Audio Briefing:** Click **Listen Audio Briefing** to hear browser speech synthesis.
11. **Switch Language:** Click the header language switcher to **English**, **Marathi (मराठी)**, or **Gujarati (ગુજરાતી)** and observe localized guidance.
12. **Test "Mark Your Field":** Click the **Mark Your Field** CTA to launch the fullscreen boundary drawer studio. Draw or edit vertices, check the geodesic area in Hectares, and save.
13. **Open State Cooperation Network:** Click **State Network** in the navbar to open the Cooperative Agricultural Model Registry (`/cooperation`).
14. **Showcase Connected States:** Demonstrate how Madhya Pradesh, Gujarat, Maharashtra, Punjab, and Karnataka share verified models. Click "Inspect Schema" to view input/output JSON contracts.
15. **Demonstrate Backward Compatibility:** Click **ZK Ledger** (`/ledger`) and **Insurer** (`/insurer`) to prove that the original zero-knowledge parametric insurance claims engine remains 100% operational!

---

## 🚀 Quickstart & Local Deployment

### Prerequisites
- Node.js v18+ (tested on Node v20 & v24)
- Python 3.10+
- Modern Web Browser (Chrome / Edge / Firefox)

### Option A: Standard Fullstack Run (Recommended)
```bash
# 1. Install dependencies
npm install
npm --prefix frontend install

# 2. Build frontend and bundle server
npm run build

# 3. Start Krishi Saarthi production server
npm start
# Open http://localhost:3000
```

### Option B: Fast Development Mode
```bash
npm run dev
# Starts Express server + Vite live middleware on http://localhost:3000
```

### Option C: Python FastAPI Backend (Modular ML Inference)
```bash
pip install -r backend/requirements.txt
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Option D: Docker Container (Production Single-Command)
```bash
# Build the unified Krishi Saarthi production image (Multi-stage build)
docker build -t krishi-saarthi .

# Run on port 3000
docker run -d -p 3000:3000 --name krishi-saarthi-app krishi-saarthi

# Open in browser: http://localhost:3000
# Run internal smoke test inside container:
docker exec -it krishi-saarthi-app python smoke_test_backend.py
```

### Option E: Docker Compose (Microservices & Multi-Container)
```bash
# 1. Run the primary unified fullstack app:
docker compose up app

# 2. Or run complete microservice cluster (Unified App + Python Backend + PostgreSQL 16):
docker compose --profile full up --build

# Stop containers:
docker compose down
```

---

## 📚 Open Source References & Acknowledgments
- [Microsoft FarmVibes.AI](https://github.com/microsoft/farmvibes-ai) — Multi-modal geospatial and remote sensing patterns.
- [Kisan / Boeing Hackathon](https://github.com/boeing23/kisan) — Farmer UX and conversational agricultural assistance.
- [Crop Disease Detection AI](https://github.com/shatini/crop-disease-detection-ai) & [Crop Diseases Detection](https://github.com/yesh00008/crop-diseases-detection) — PlantVillage CNN foliar lesion taxonomy.
- [Smart Irrigation System with Weather-Aware Guidance](https://github.com/nithu0035/smart-irrigation-system-with-weather-aware-crop-guidance) — Open-Meteo soil moisture evapotranspiration thresholds.
- [Our Take on Climate AI](https://github.com/sai-kumar-dev/our-take-on-climate-ai) — Agro-climatic risk engine modeling.
- Copernicus Sentinel-2 MSI Open Access Hub — Multi-spectral orbital imagery.
- ICAR (Indian Council of Agricultural Research) — Agronomic optimal ranges & Soil Health Card standards.

---

<div align="center">
  <b>Krishi Saarthi: Cooperative Agricultural Intelligence Network</b><br>
  <i>Built with AI for Bharat's Farmers.</i>
</div>
