import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Activity, Map, AlertTriangle, ShieldCheck } from 'lucide-react';
import StatCard from '../components/StatCard';
import RiskGauge from '../components/RiskGauge';
import HistoricalVegetationHealthChart from '../components/HistoricalVegetationHealthChart';
import WeatherRiskPanel from '../components/WeatherRiskPanel';
import PipelineProgress from '../components/PipelineProgress';
import AnalysisPipelineSnapshots from '../components/AnalysisPipelineSnapshots';
import LandSatelliteAnalysis from '../components/LandSatelliteAnalysis';
import PrecisionSatelliteGISConsole from '../components/PrecisionSatelliteGISConsole';
import FarmerAlertsDrawer from '../components/FarmerAlertsDrawer';
import LiveWeatherForecastWidget from '../components/LiveWeatherForecastWidget';
import GeminiDiseaseAnomalyNotificationSystem from '../components/GeminiDiseaseAnomalyNotificationSystem';
import { FarmAIExplainer } from '../components/FarmAIExplainer';
import { useAnalysis } from '../hooks/useAnalysis';
import { api, Farm, HistoricalAnomalyMarker } from '../lib/api';
import { OfflineStatusBanner } from '../components/OfflineStatusBanner';

export default function DashboardPage() {
  const { farmId }  = useParams<{ farmId: string }>();
  const navigate    = useNavigate();
  const { analysis, loading, isFromCache, cachedTime, refetch } = useAnalysis(farmId);
  const [farm, setFarm] = useState<Farm | null>(null);
  const [isGeneratingClaim, setIsGeneratingClaim] = useState(false);
  const [pipelineRunning, setPipelineRunning]     = useState(false);
  const [detectedAnomalies, setDetectedAnomalies] = useState<HistoricalAnomalyMarker[]>([]);

  useEffect(() => {
    if (!farmId) return;
    api.farms.get(farmId)
      .then(res => setFarm(res.data))
      .catch(err => console.error('[DashboardPage] Failed to fetch farm:', err));
  }, [farmId]);

  // Show pipeline if there's no analysis yet and we're not in a loading state
  useEffect(() => {
    if (!analysis && !loading) {
      setPipelineRunning(true);
    } else if (analysis) {
      setPipelineRunning(false);
    }
  }, [analysis, loading]);

  // Called by PipelineProgress when the WebSocket "done" message arrives
  const handlePipelineComplete = useCallback(async () => {
    await refetch();          // fetch fresh analysis from /api/farms/:id/analysis
    setPipelineRunning(false);
  }, [refetch]);

  const handleGenerateClaim = async () => {
    if (!farmId) return;
    setIsGeneratingClaim(true);
    try {
      const res = await api.claims.create({ farm_id: farmId });
      const targetId = res.data.claim_id || res.data.id;
      navigate(`/claim/${targetId}`);
    } catch (err) {
      console.error(err);
      alert('Failed to generate claim. Please try again.');
      setIsGeneratingClaim(false);
    }
  };

  if (!analysis && pipelineRunning) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-white mb-2">Running Farm Analysis</h1>
        <p className="text-slate-400 mb-8">
          Fetching satellite imagery, computing spectral indices, and running AI risk models…
        </p>
        <PipelineProgress farmId={farmId!} onComplete={handlePipelineComplete} />
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="p-8 text-center text-slate-400">
        {loading ? 'Loading analysis data…' : 'No analysis found for this farm.'}
      </div>
    );
  }

  const normNdviDropPct = analysis.ndvi_drop_pct != null
    ? (Math.abs(analysis.ndvi_drop_pct) > 1.0 ? analysis.ndvi_drop_pct : analysis.ndvi_drop_pct * 100)
    : 36.7;

  const normLossPct = analysis.expected_loss_pct != null
    ? (Math.abs(analysis.expected_loss_pct) > 1.0 ? analysis.expected_loss_pct : analysis.expected_loss_pct * 100)
    : (analysis.damage_probability != null ? (Math.abs(analysis.damage_probability) > 1.0 ? analysis.damage_probability : analysis.damage_probability * 100) : 35.0);

  const isEligible  = (analysis.risk_score ?? 0) > 60 || normLossPct > 20;
  const healthScore = Math.round((analysis.crop_health_score ?? (1 - (normLossPct / 100))) * 100);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Title Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            {farm?.name || 'Farm Dashboard'}
            <span className="px-3 py-1 bg-dark-800 text-slate-400 text-sm rounded-full font-mono font-normal border border-dark-700">
              ID: {farmId}
            </span>
          </h1>
          <p className="text-slate-400 mt-2">
            Real-time multi-spectral analysis, satellite land snapshots, and insurance eligibility overview.
          </p>
        </div>
        <Link
          to={`/dashboard/${farmId}/satellite`}
          className="bg-dark-800 hover:bg-dark-700 border border-dark-600 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors font-medium text-sm shadow"
        >
          <Map className="w-4 h-4 text-primary-400" /> View High-Res Satellite Map
        </Link>
      </div>

      {/* Offline Satellite Telemetry Cache Status Banner */}
      <OfflineStatusBanner
        isFromCache={isFromCache}
        cachedTime={cachedTime}
        isLoading={loading}
        onRefresh={refetch}
      />

      {/* Multi-Spectral Processing Pipeline Visual Snapshots (Reference Diagram Feature) */}
      <div className="bg-dark-800/90 rounded-2xl border border-dark-700 p-6 shadow-xl backdrop-blur">
        <AnalysisPipelineSnapshots
          farmName={farm?.name}
          cropType={farm?.crop_type}
          centerLat={farm?.center_lat}
          centerLon={farm?.center_lon}
          areaHa={farm?.area_hectares}
          ndviCurrent={analysis.ndvi_current}
          ndviBaseline={analysis.ndvi_baseline}
          ndviDropPct={normNdviDropPct}
          evi={analysis.evi_current}
          ndwi={analysis.ndwi_current}
          cloudCover={4.2}
          damageProb={analysis.damage_probability != null ? (analysis.damage_probability > 1.0 ? analysis.damage_probability / 100 : analysis.damage_probability) : 0.35}
          riskCategory={analysis.risk_category || 'MODERATE'}
          allowDemoRun={true}
        />
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Crop Health"
          value={`${healthScore}%`}
          icon={<Activity className="w-6 h-6" />}
          variant={healthScore > 70 ? 'green' : healthScore > 40 ? 'yellow' : 'red'}
          trend={{ value: -parseFloat(normNdviDropPct.toFixed(1)), label: 'vs baseline' }}
        />
        <div className="bg-dark-800 rounded-xl border border-dark-700 p-6 flex flex-col items-center justify-center shadow-sm">
          <p className="text-sm font-medium text-slate-400 mb-2 w-full">Risk Assessment</p>
          <RiskGauge score={analysis.risk_score ?? 50} category={analysis.risk_category || 'MODERATE'} label="Overall Risk" />
        </div>
        <StatCard
          title="Predicted Loss"
          value={`${normLossPct.toFixed(1)}%`}
          subtitle={`Exp. Yield: ${(analysis.expected_yield ?? 2.8).toFixed(1)} tons/ha`}
          icon={<AlertTriangle className="w-6 h-6" />}
          variant={normLossPct > 20 ? 'red' : 'yellow'}
        />
        <div className={`rounded-xl border p-6 flex flex-col justify-center shadow-sm ${isEligible ? 'bg-success/10 border-success/30' : 'bg-dark-800 border-dark-700'}`}>
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck className={`w-8 h-8 ${isEligible ? 'text-success' : 'text-slate-500'}`} />
            <h4 className="text-lg font-bold text-white">Insurance Status</h4>
          </div>
          <div className={`text-2xl font-black mt-2 ${isEligible ? 'text-success' : 'text-slate-400'}`}>
            {isEligible ? 'LIKELY ELIGIBLE' : 'NOT ELIGIBLE'}
          </div>
          <p className="text-sm text-slate-400 mt-2">Based on current algorithmic assessment.</p>
        </div>
      </div>

      {/* AI Farm Scenario & Report Explainer (Simplified Language & Voice Briefing) */}
      {farm && (
        <FarmAIExplainer
          farm={farm}
          analysis={analysis}
          weather={{
            temperature: analysis.temperature_mean,
            rainfall_30d: analysis.rainfall_mm_30d,
            rainfall_anomaly: analysis.rainfall_anomaly_pct,
          }}
        />
      )}

      {/* Satellite Land Surface & Crop Canopy Analysis Section */}
      {farmId && <LandSatelliteAnalysis farmId={farmId} />}

      {/* Actionable Agronomy & Low-Bandwidth Alerts Drawer */}
      {farmId && <FarmerAlertsDrawer farmId={farmId} />}

      {/* Real-time Open-Meteo Weather Forecast & Agricultural Climate Ingest */}
      <LiveWeatherForecastWidget
        lat={farm?.center_lat || 36.7783}
        lon={farm?.center_lon || -119.4179}
        farmName={farm?.name || 'Registered Farm Basin'}
        cropType={farm?.crop_type || 'Agricultural Crop'}
      />

      {/* Precision GIS Multi-Spectral Satellite Intelligence Studio (Sentinel Hub / EOS Crop Monitoring) */}
      <PrecisionSatelliteGISConsole
        farmId={farmId}
        farmName={farm?.name || 'Registered Farm Parcel'}
        cropType={farm?.crop_type || 'Agricultural Crop'}
        areaHa={farm?.area_hectares || 9.6}
        centerLat={farm?.center_lat || 49.8880}
        centerLon={farm?.center_lon || 28.8644}
        currentNdvi={analysis?.ndvi_current || 0.41}
        baselineNdvi={analysis?.ndvi_baseline || 0.68}
        stressLevel={analysis?.stress_level || 'MODERATE'}
        isProcessing={false}
      />

      {/* AI Disease Anomaly & Sentinel Remote Sensing Notification System */}
      {farmId && (
        <GeminiDiseaseAnomalyNotificationSystem
          farmId={farmId}
          farmName={farm?.name || 'Registered Farm Parcel'}
          cropType={farm?.crop_type || 'Agricultural Crop'}
          onAnomaliesDetected={(anomalies) => setDetectedAnomalies(anomalies)}
        />
      )}

      {/* Historical 6-Month Vegetation Health & Spectral Trajectory Section */}
      <HistoricalVegetationHealthChart
        data={analysis.ndvi_time_series}
        baseline={analysis.ndvi_baseline}
        cropType={farm?.crop_type || 'Crop'}
        farmName={farm?.name || 'Farm Parcel'}
        stressThreshold={0.30}
        currentDropPct={analysis.ndvi_drop_pct * 100}
        anomalies={detectedAnomalies}
      />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-dark-800 rounded-xl border border-dark-700 p-6 shadow-md">
            <h3 className="text-lg font-semibold text-white mb-4">Damage Analysis (Feature Impact)</h3>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-sm text-slate-400 mb-1">Stress Level</p>
                <p className="text-xl font-bold text-white capitalize">{(analysis.stress_level || 'MODERATE').replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-1">Damage Probability</p>
                <p className="text-xl font-bold text-warning">{(((analysis.damage_probability) || 0) * 100).toFixed(1)}%</p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <p className="text-sm text-slate-400 font-medium">Key Contributing Factors:</p>
              {[
                { label: 'NDVI Drop',        width: Math.min((analysis.ndvi_drop_pct || 0) * 2, 100), color: 'bg-danger' },
                { label: 'Rainfall Anomaly', width: Math.min(Math.abs(analysis.rainfall_anomaly_pct || 0), 100), color: 'bg-warning' },
                { label: 'Heat Stress',      width: (analysis.heat_stress_score || 0) * 100, color: 'bg-orange-500' },
              ].map(({ label, width, color }) => (
                <div key={label} className="flex items-center gap-4">
                  <span className="w-36 text-sm text-slate-300">{label}</span>
                  <div className="flex-1 h-2 bg-dark-900 rounded-full">
                    <div className={`h-full ${color} rounded-full`} style={{ width: `${width}%` }} />
                  </div>
                  <span className="text-xs text-slate-500 w-10 text-right">{width.toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <WeatherRiskPanel
            drought_risk={analysis.drought_risk}
            flood_risk={analysis.flood_risk}
            heat_stress={analysis.heat_stress_score}
            rainfall_mm_30d={analysis.rainfall_mm_30d}
            rainfall_anomaly_pct={analysis.rainfall_anomaly_pct}
          />

          <div className="bg-dark-800 rounded-xl border border-dark-700 p-6 shadow-md relative overflow-hidden">
            {isEligible && <div className="absolute top-0 left-0 w-full h-1 bg-success" />}
            <h3 className="text-lg font-semibold text-white mb-4">Claim Generation</h3>
            <p className="text-slate-400 text-sm mb-6">
              Generate a Zero-Knowledge proof of crop damage cryptographically verifying the satellite and AI findings.
            </p>
            <button
              onClick={handleGenerateClaim}
              disabled={!isEligible || isGeneratingClaim}
              className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all ${
                isEligible
                  ? 'bg-primary-600 hover:bg-primary-500 hover:shadow-primary-600/20'
                  : 'bg-dark-700 text-slate-500 cursor-not-allowed'
              }`}
            >
              {isGeneratingClaim ? 'Generating Proof…' : 'Generate ZK Proof & Claim'}
            </button>
            {!isEligible && (
              <p className="text-xs text-center text-slate-500 mt-3">Criteria for claim not met.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
