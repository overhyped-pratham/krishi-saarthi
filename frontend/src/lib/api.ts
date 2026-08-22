import axios from 'axios'
import { supabase } from './supabase'

const BASE_URL = import.meta.env.VITE_API_URL ?? ''

// Base API URL


export interface Farm {
  id: string
  name: string
  commitment_hash: string
  polygon_hash?: string
  crop_type: string
  sowing_date: string
  policy_id: string
  center_lat: number
  center_lon: number
  area_hectares: number
  status: string
  created_at: string
  polygon_coordinates?: number[][]
}

export interface AnalysisResult {
  id: string
  farm_id: string
  crop_health_score: number
  damage_probability: number
  damage_prob?: number
  claim_eligible?: boolean
  stress_level: string
  ndvi_current: number
  ndvi_baseline: number
  ndvi_drop_pct: number
  evi_current: number
  evi?: number
  ndwi_current: number
  ndwi?: number
  ndmi_current: number
  cloud_cover_pct?: number
  rainfall_mm_30d: number
  rainfall_anomaly_pct: number
  temperature_mean: number
  heat_stress_score: number
  drought_risk: number
  flood_risk: number
  overall_environmental_risk: string
  expected_yield: number
  expected_loss_pct: number
  confidence: number
  risk_score: number
  risk_category: string
  ndvi_time_series: Array<{ date: string; ndvi: number; evi: number; cloud_cover: number }>
  created_at: string
}

export interface Claim {
  id: string
  farm_id: string
  claim_id: string
  satellite_evidence_hash: string
  prediction_hash: string
  zk_proof: Record<string, unknown>
  zk_proof_hash: string
  eligible: boolean
  ndvi_drop_scaled: number
  rain_anomaly_scaled: number
  yield_loss_scaled: number
  block_hash: string
  previous_block_hash: string
  block_index: number
  payout_amount?: number
  created_at: string
}

export interface LandZoningZone {
  pct: number
  hectares: number
  color: string
  label: string
}

export interface LandAnalysisResult {
  farm_id: string
  farm_name: string
  crop_type: string
  area_hectares: number
  center_lat: number
  center_lon: number
  land_zoning: {
    vigorous_canopy: LandZoningZone
    moderate_stress: LandZoningZone
    severe_degradation: LandZoningZone
    bare_soil_fallow: LandZoningZone
  }
  indices_comparison: {
    ndvi: { baseline: number; current: number; change_pct: number }
    evi:  { baseline: number; current: number; change_pct: number }
    ndwi: { baseline: number; current: number; change_pct: number }
    ndmi: { baseline: number; current: number; change_pct: number }
    savi: { baseline: number; current: number; change_pct: number }
    bsi:  { baseline: number; current: number; change_pct: number }
  }
  soil_and_surface: {
    soil_moisture_vwc_pct: number
    soil_moisture_status: string
    surface_temperature_c: number
    thermal_anomaly_c: number
    biomass_density_g_m2: number
    canopy_cover_pct: number
  }
  spectral_reflectance_curve: Array<{
    band: string
    wavelength_nm: number
    baseline: number
    current: number
    delta: string
  }>
  satellite_metadata: {
    sensor: string
    ground_sample_distance_m: number
    baseline_pass: string
    current_pass: string
    cloud_cover_pct: number
    atmospheric_correction: string
  }
  ml_proof?: {
    model_name: string
    damage_probability: number
    predicted_loss_pct: number
    confidence: number
    total_analyzed_area_ha: number
    damage_segmented_area_ha: number
    analyzed_pixels_count: number
    evidence_hash: string
    zk_status: string
    anomaly_detected: boolean
  }
}

export interface VerificationResult {
  claim_id: string
  farm_id?: string
  valid?: boolean
  zk_proof_valid: boolean
  zk_proof_message: string
  ledger_valid: boolean
  overall_valid: boolean
  payout_eligible?: boolean
  payout_amount?: number
  block_hash?: string
}

export interface LedgerVerification {
  valid: boolean
  block_count: number
  broken_at: number | null
  message?: string
}

// ── AI Explainer Types ───────────────────────────────────────────────────────

export interface AIKeyInsight {
  title: string
  value: string
  description: string
  status: 'good' | 'warning' | 'alert' | 'info'
}

export interface AIFaq {
  question: string
  answer: string
}

export interface AIScorecardBreakpoint {
  label: string
  value: string
  detail: string
}

export interface AIFollowUp {
  question: string
}

export interface AIExplanationResult {
  headline: string
  simpleSummary: string
  soilAndWaterStatus: string
  insuranceAndRiskExplanation: string
  audioSummaryText: string
  keyInsights: AIKeyInsight[]
  faqs: AIFaq[]
  actionableRecommendations: string[]
  scorecard: {
    breakpoints: AIScorecardBreakpoint[]
    followUps: AIFollowUp[]
  }
  generatedAt: string
  language: string
  tone: string
}

export interface AIAskResponse {
  answer: string
  confidence: number
  bulletPoints?: string[]
  suggestedFollowUps?: string[]
  sources?: string[]
  followUp?: string[]
}

export interface ClaimPayoutEstimate {
  farm_id: string
  farm_name: string
  policy_id: string
  policy_name: string
  crop_type: string
  area_hectares: number
  overall_crop_damage_pct: number
  damage_severity: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'
  damage_severity_color: string
  ndvi_decline_pct: number
  stressed_crop_area_pct: number
  ai_predicted_yield_loss_pct: number
  weather_anomaly_contribution_pct: number
  analysis_confidence_score_pct: number
  policy_threshold_pct: number
  total_insured_amount: number
  maximum_payout_allowed: number
  estimated_payout_amount: number
  claim_eligibility_status: 'ELIGIBLE' | 'BELOW_TRIGGER'
  evidence_verification_status: string
  payout_disclaimer: string
  formula_breakdown: {
    base_coverage: string
    damage_weighting: string
    payout_factor: string
    final_formula: string
  }
}

export interface HistoricalAnomalyMarker {
  date: string
  severity: 'CRITICAL' | 'WARNING' | 'ADVISORY' | 'NORMAL'
  ndvi_observed: number
  expected_baseline: number
  drop_pct: number
  anomaly_type: string
  flagged_disease_risk?: string
  description: string
  recommended_action: string
}

export interface DiseaseRiskAssessment {
  id: string
  disease_name: string
  pathogen: string
  risk_level: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW'
  probability_pct: number
  incubation_window_days: number
  progression_stage: string
  primary_symptoms: string[]
  spectral_signature_match: string
  potential_yield_loss_pct: number
  organic_treatments: string[]
  chemical_prescriptions: Array<{
    name: string
    active_ingredient: string
    dosage_per_ha: string
    application_method: string
  }>
  preventive_measures: string[]
  irrigation_advisory: string
}

export interface VegetationHealthAnomalyReport {
  farm_id: string
  farm_name: string
  crop_type: string
  analyzed_points_count: number
  overall_health_status: 'CRITICAL_ANOMALIES' | 'MODERATE_RISK' | 'STABLE_VIGOR'
  headline: string
  executive_summary: string
  disease_risks: DiseaseRiskAssessment[]
  historical_anomalies: HistoricalAnomalyMarker[]
  environmental_triggers: {
    temperature_anomaly_c: number
    rainfall_deficit_pct: number
    humidity_pressure: string
    canopy_moisture_stress: string
  }
  audio_briefing_text: string
  sms_alert_payload: string
  whatsapp_alert_payload: string
  generated_at: string
  model_used: string
  confidence_score: number
}

// ────────────────────────────────────────────────────────────────────────────

const client = axios.create({ baseURL: BASE_URL })

client.interceptors.request.use(async (config) => {
  try {
    const { data } = await supabase.auth.getSession()
    const token = data?.session?.access_token
    if (token) {
      config.headers = config.headers ?? {}
      config.headers['Authorization'] = `Bearer ${token}`
    }
  } catch (err) {
    // Ignore auth session error so API requests still proceed
  }
  return config
})

export const api = {
  farms: {
    list:            ()           => client.get<Farm[]>('/api/farms'),
    create:          (data: any)  => client.post<Farm>('/api/farms', data),
    get:             (id: string) => client.get<Farm>(`/api/farms/${id}`),
    analyze:         (id: string) => client.post(`/api/farms/${id}/analyze`),
    getAnalysis:     (id: string) => client.get<AnalysisResult>(`/api/farms/${id}/analysis`),
    getTimeseries:   (id: string) => client.get(`/api/farms/${id}/timeseries`),
    getLandAnalysis: (id: string) => client.get<LandAnalysisResult>(`/api/farms/${id}/land-analysis`),
    getAIExplanation: (id: string, params: { language?: string; tone?: string; prompt?: string; weather?: any }) =>
      client.post<AIExplanationResult>(`/api/farms/${id}/ai-explain`, params),
  },
  diseaseAnomalies: {
    analyze: (farmId: string, params?: { sensitivity?: string; customPrompt?: string; language?: string }) =>
      client.post<VegetationHealthAnomalyReport>(`/api/farms/${farmId}/ai-disease-anomalies`, params || {}),
    getLatest: (farmId: string) =>
      client.get<VegetationHealthAnomalyReport>(`/api/farms/${farmId}/ai-disease-anomalies`),
    dispatchAlert: (data: { farmId: string; phoneNumber: string; channel: 'sms' | 'whatsapp'; alertId?: string; customMessage?: string }) =>
      client.post<{ success: boolean; mode: string; status: string; delivery_receipt: string; timestamp: string }>('/api/notifications/dispatch-disease-alert', data),
    getAllActiveAlerts: () =>
      client.get<Array<{ farmId: string; farmName: string; report: VegetationHealthAnomalyReport }>>('/api/notifications/active-disease-alerts'),
  },
  claims: {
    create:      (data: any)   => client.post<Claim>('/api/claims', data),
    get:         (id: string)  => client.get<Claim>(`/api/claims/${id}`),
    verify:      (id: string)  => client.post<VerificationResult>(`/api/claims/${id}/verify`),
    getEstimate: (farmId: string) => client.get<ClaimPayoutEstimate>(`/api/claims/estimate/${farmId}`),
  },
  ledger: {
    getChain: () => client.get<{ chain: Claim[] }>('/api/ledger'),
    verify:   () => client.get<LedgerVerification>('/api/ledger/verify'),
  },
  insurer: {
    getRiskHeatmap: () => client.get('/api/insurer/risk-heatmap'),
    getFraudCheck: (claimId: string) => client.get(`/api/insurer/fraud-check/${claimId}`),
    disbursePayout: (data: { claim_id: string; wallet_address?: string; contract_address?: string; amount_usdc?: number }) =>
      client.post('/api/insurer/disburse-payout', data),
  },
  farmer: {
    getAlerts: (farmId: string) => client.get(`/api/farmer/alerts/${farmId}`),
    simulateDispatch: (data: { farm_id: string; phone_number: string; channel: string }) =>
      client.post('/api/farmer/simulate-dispatch', data),
  },
  ai: {
    askAdvisor: (data: { farmId: string; question: string; language?: string; tone?: string }) =>
      client.post<AIAskResponse>('/api/ai/ask', data),
  },
  diagnostics: {
    detectDamage: (data: { image_base64?: string; crop_hint?: string; filename?: string }) =>
      client.post('/api/diagnostics/detect-damage', data),
    calculateDosage: (data: { crop: string; area: number; unit?: string; current_n?: number; current_p?: number; current_k?: number; growth_stage?: string }) =>
      client.post('/api/diagnostics/calculate-dosage', data),
    geminiConsult: (data: { prompt: string; crop?: string; disease?: string; area?: number; language?: string }) =>
      client.post('/api/diagnostics/gemini-consult', data),
    getDiseaseClasses: () => client.get('/api/diagnostics/disease-classes'),
  },
}

/** Build the WebSocket URL for a given farm's analysis stream */
export function wsAnalysisUrl(farmId: string): string {
  const wsBase = (import.meta.env.VITE_WS_URL ?? 'ws://localhost:8000')
  return `${wsBase}/ws/analysis/${farmId}`
}
