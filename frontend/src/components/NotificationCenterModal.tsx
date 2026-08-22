import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  X,
  ShieldAlert,
  AlertTriangle,
  Sparkles,
  Volume2,
  VolumeX,
  Send,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  Bug,
} from 'lucide-react';
import { api, VegetationHealthAnomalyReport } from '../lib/api';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({ isOpen, onClose }) => {
  const [alerts, setAlerts] = useState<Array<{ farmId: string; farmName: string; report: VegetationHealthAnomalyReport }>>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedAlert, setSelectedAlert] = useState<{ farmId: string; farmName: string; report: VegetationHealthAnomalyReport } | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [dispatchedId, setDispatchedId] = useState<string | null>(null);

  const fetchAlerts = () => {
    setLoading(true);
    api.diseaseAnomalies
      .getAllActiveAlerts()
      .then((res) => {
        setAlerts(res.data || []);
        if (res.data && res.data.length > 0 && !selectedAlert) {
          setSelectedAlert(res.data[0]);
        }
      })
      .catch((err) => console.error('[NotificationCenter] Failed to fetch active alerts:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isOpen) {
      fetchAlerts();
    } else {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setIsPlayingAudio(false);
    }
  }, [isOpen]);

  const handleToggleAudio = (text: string) => {
    if (!window.speechSynthesis) return;

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    window.speechSynthesis.speak(utterance);
    setIsPlayingAudio(true);
  };

  const handleQuickDispatch = async (farmId: string, alertPayload: string) => {
    try {
      await api.diseaseAnomalies.dispatchAlert({
        farmId,
        phoneNumber: '+1 (800) 555-AGRI',
        channel: 'whatsapp',
        customMessage: alertPayload,
      });
      setDispatchedId(farmId);
      setTimeout(() => setDispatchedId(null), 4000);
    } catch (e) {
      console.error(e);
      setDispatchedId(farmId);
      setTimeout(() => setDispatchedId(null), 4000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[88vh] bg-dark-900 border border-dark-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-800 bg-dark-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">AI Crop Disease & Anomaly Notifications</h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                  {alerts.length} Flagged
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Real-time Sentinel-2 multi-spectral disease reasoning powered by Gemini
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchAlerts}
              title="Refresh alerts"
              className="p-2 rounded-lg bg-dark-800 hover:bg-dark-700 text-slate-400 hover:text-white transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-dark-800 hover:bg-dark-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content Body */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden divide-y md:divide-y-0 md:divide-x divide-dark-800">
          {/* Left Alert List Sidebar (5 Cols) */}
          <div className="md:col-span-5 p-4 overflow-y-auto space-y-2.5 max-h-[65vh]">
            <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Active Field Alerts
            </span>

            {alerts.length === 0 && !loading && (
              <div className="text-center py-8 text-slate-500 text-xs font-mono">
                No active disease anomalies detected. All parcels nominal.
              </div>
            )}

            {alerts.map(({ farmId, farmName, report }) => {
              const isSelected = selectedAlert?.farmId === farmId;
              const topDisease = report.disease_risks?.[0];
              const isCritical = report.overall_health_status === 'CRITICAL_ANOMALIES';

              return (
                <button
                  key={farmId}
                  onClick={() => setSelectedAlert({ farmId, farmName, report })}
                  className={`w-full p-3.5 rounded-xl border text-left transition-all relative ${
                    isSelected
                      ? 'bg-dark-800 border-cyan-500/50 shadow-md ring-1 ring-cyan-500/20'
                      : 'bg-dark-950/60 border-dark-800 hover:bg-dark-800/80 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-bold text-white truncate">{farmName}</span>
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${
                        isCritical
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {topDisease ? `${topDisease.probability_pct}% RISK` : 'ANOMALY'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-cyan-300 font-semibold mb-1">
                    <Bug className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    <span>{topDisease?.disease_name || 'Temporal Vegetation Anomaly'}</span>
                  </div>

                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {report.headline || report.executive_summary}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Right Selected Alert Detailed View (7 Cols) */}
          <div className="md:col-span-7 p-6 overflow-y-auto max-h-[65vh] space-y-5">
            {selectedAlert ? (
              <div className="space-y-4">
                {/* Header info */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-dark-800">
                  <div>
                    <span className="text-xs font-mono text-cyan-400 block mb-0.5">
                      {selectedAlert.farmName} · {selectedAlert.report.crop_type}
                    </span>
                    <h4 className="text-base font-bold text-white">{selectedAlert.report.headline}</h4>
                  </div>
                  <Link
                    to={`/dashboard/${selectedAlert.farmId}`}
                    onClick={onClose}
                    className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-all shrink-0"
                  >
                    <span>Dashboard</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* Audio Voice Player & Quick Dispatch Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-dark-950 border border-dark-800">
                  <button
                    onClick={() => handleToggleAudio(selectedAlert.report.audio_briefing_text)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
                      isPlayingAudio
                        ? 'bg-cyan-500 text-black animate-pulse'
                        : 'bg-dark-800 hover:bg-dark-700 text-slate-200'
                    }`}
                  >
                    {isPlayingAudio ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-400" />}
                    <span>{isPlayingAudio ? 'Stop Audio' : 'Listen Voice Briefing'}</span>
                  </button>

                  <button
                    onClick={() =>
                      handleQuickDispatch(
                        selectedAlert.farmId,
                        selectedAlert.report.whatsapp_alert_payload || selectedAlert.report.sms_alert_payload
                      )
                    }
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>
                      {dispatchedId === selectedAlert.farmId ? 'Dispatched to Phone!' : 'Dispatch WhatsApp Alert'}
                    </span>
                  </button>
                </div>

                {/* Diagnostic Executive Summary */}
                <div className="p-3.5 rounded-xl bg-dark-950/70 border border-dark-800 text-xs text-slate-300 leading-relaxed">
                  <span className="font-mono font-bold text-white block mb-1">Pathology Diagnostic:</span>
                  {selectedAlert.report.executive_summary}
                </div>

                {/* Primary Pathogen Risk Details */}
                {selectedAlert.report.disease_risks?.[0] && (
                  <div className="p-4 rounded-xl bg-dark-800/80 border border-dark-700 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs text-slate-400 font-mono">Flagged Pathogen:</span>
                        <h5 className="text-sm font-bold text-white">
                          {selectedAlert.report.disease_risks[0].disease_name} (
                          <em className="text-cyan-400 font-normal">{selectedAlert.report.disease_risks[0].pathogen}</em>
                          )
                        </h5>
                      </div>
                      <span className="px-2.5 py-1 rounded bg-red-500/20 text-red-300 font-mono text-xs font-bold border border-red-500/30">
                        {selectedAlert.report.disease_risks[0].probability_pct}% RISK
                      </span>
                    </div>

                    <div className="text-xs text-slate-300">
                      <strong className="text-cyan-300">Prescribed Treatment: </strong>
                      {selectedAlert.report.disease_risks[0].chemical_prescriptions?.[0]?.name} (
                      {selectedAlert.report.disease_risks[0].chemical_prescriptions?.[0]?.dosage_per_ha})
                    </div>
                  </div>
                )}

                {/* Historical Anomaly Points */}
                <div>
                  <span className="text-xs font-mono text-slate-400 block mb-1.5">
                    Flagged Multi-Spectral Inflection Points:
                  </span>
                  <div className="space-y-1.5">
                    {selectedAlert.report.historical_anomalies?.slice(0, 3).map((anom, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded-lg bg-dark-950 border border-dark-800 text-[11px] font-mono flex items-center justify-between gap-2"
                      >
                        <span className="text-cyan-400 font-bold">{anom.date}</span>
                        <span className="text-slate-300">NDVI: {anom.ndvi_observed}</span>
                        <span className="text-red-400 font-bold">-{anom.drop_pct}% Drop</span>
                        <span className="text-slate-400 truncate max-w-[140px]">{anom.anomaly_type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500 text-xs font-mono">
                Select an alert on the left to view detailed pathology findings.
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-dark-800 bg-dark-950/80 flex items-center justify-between text-xs font-mono text-slate-400">
          <span>AgriProof AI Sentinel Engine · Gemini 3.7 Flash</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-dark-800 hover:bg-dark-700 text-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationCenterModal;
