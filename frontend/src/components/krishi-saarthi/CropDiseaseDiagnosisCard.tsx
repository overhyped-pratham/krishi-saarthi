import React, { useState } from 'react';
import { Stethoscope, Upload, AlertTriangle, Eye, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { api } from '../../lib/api';

const SAMPLE_LEAF_PRESETS = [
  {
    id: 'wheat_rust',
    name: 'Wheat Yellow Rust',
    crop: 'Wheat',
    filename: 'wheat_yellow_rust.jpg',
    image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?q=80&w=400&auto=format&fit=crop'
  },
  {
    id: 'potato_blight',
    name: 'Potato Late Blight',
    crop: 'Potato',
    filename: 'potato_late_blight.jpg',
    image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?q=80&w=400&auto=format&fit=crop'
  },
  {
    id: 'tomato_blight',
    name: 'Tomato Early Blight',
    crop: 'Tomato',
    filename: 'tomato_early_blight.jpg',
    image: 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?q=80&w=400&auto=format&fit=crop'
  },
  {
    id: 'soybean_spot',
    name: 'Soybean Brown Spot',
    crop: 'Soybean',
    filename: 'soybean_early_blight.jpg',
    image: 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?q=80&w=400&auto=format&fit=crop'
  }
];

export const CropDiseaseDiagnosisCard: React.FC = () => {
  const { t } = useLanguage();
  const [selectedPreset, setSelectedPreset] = useState(SAMPLE_LEAF_PRESETS[0]);
  const [modelChoice, setModelChoice] = useState<'ensemble' | 'yolov11' | 'yolov8' | 'cnn'>('ensemble');
  const [viewMode, setViewMode] = useState<'mask' | 'bbox' | 'heatmap'>('mask');
  const [analyzing, setAnalyzing] = useState(false);
  const [diagnosis, setDiagnosis] = useState<any>({
    crop: 'Wheat',
    disease: 'Yellow Rust (Puccinia striiformis)',
    confidence: 0.94,
    severity: 'Moderate',
    detection_mode: 'yolo11m_seg_ensemble',
    active_models: [
      'Nick-Maximillien/Agrosight-YOLOv11-Crop-Disease',
      'iamnotpalak/yolov8-transfpn-crop-disease-detection'
    ],
    visually_affected_area_pct: 18.7,
    healthy_vegetation_pct: 81.3,
    segmentation_masks: [
      {
        id: 'mask_01',
        label: 'Active Foliar Sporulation',
        points: '28,38 32,35 48,34 68,41 72,55 64,63 42,60 30,52',
        area_pct: 12.4,
        color: 'rgba(239, 68, 68, 0.45)'
      },
      {
        id: 'mask_02',
        label: 'Chlorotic Margin Halo',
        points: '55,62 68,60 85,68 82,80 70,84 58,76',
        area_pct: 6.3,
        color: 'rgba(245, 158, 11, 0.40)'
      }
    ],
    gradcam_bounding_boxes: [
      { x: 28, y: 35, width: 44, height: 28, intensity: 0.92, label: 'Yellow Rust Stripe' },
      { x: 55, y: 62, width: 30, height: 22, intensity: 0.84, label: 'Secondary Spore Cluster' }
    ],
    advisory_disclaimer: 'Visually affected foliar area is 18.7%. This denotes proximal foliar symptom coverage, not direct yield loss. Correlated with Sentinel-2 for agronomic impact.',
    organic_remedies: [
      'Apply fermented buttermilk spray (50 ml/L water)',
      'Foliar spray of Trichoderma harzianum @ 5g/L',
      'Neem kernel extract (5%) as preventive barrier'
    ],
    chemical_treatment: 'Propiconazole 25% EC (Tilt) @ 1ml/L or Tebuconazole 25.9% EC @ 1.25ml/L.',
    ipm_practices: [
      'Avoid excessive early-stage urea top dressing which promotes soft succulence',
      'Maintain field drainage to prevent high morning humidity spikes'
    ],
    dual_signal_risk: {
      composite_field_risk_score: 74.2,
      risk_label: 'High Agricultural Stress',
      estimated_crop_impact: 'Moderate Potential Yield Impact (15-30%)',
      signals: {
        satellite_macro: { ndvi_baseline: 0.72, ndvi_current: 0.61, ndvi_decline_pct: 15.3 },
        yolo_foliar_micro: { visually_affected_area_pct: 18.7, healthy_vegetation_pct: 81.3 }
      }
    }
  });

  const handleRunDiagnosis = async (preset: typeof SAMPLE_LEAF_PRESETS[0], chosenModel = modelChoice) => {
    setSelectedPreset(preset);
    setAnalyzing(true);
    try {
      const res = await api.krishiSaarthi.diagnoseDisease({
        filename: preset.filename,
        model_choice: chosenModel
      });
      if (res.data) {
        setDiagnosis(res.data);
      }
    } catch (e) {
      console.error('Diagnosis request error:', e);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleModelChange = (m: 'ensemble' | 'yolov11' | 'yolov8' | 'cnn') => {
    setModelChoice(m);
    handleRunDiagnosis(selectedPreset, m);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const b64 = reader.result as string;
      setAnalyzing(true);
      try {
        const res = await api.krishiSaarthi.diagnoseDisease({
          image_base64: b64,
          filename: file.name,
          model_choice: modelChoice
        });
        if (res.data) setDiagnosis(res.data);
      } catch (err) {
        console.error('Upload error:', err);
      } finally {
        setAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-5 hover:border-amber-500/30 transition-all duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
            <Stethoscope className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h3 className="font-mono font-semibold text-sm text-white tracking-wide flex items-center gap-2">
              {t('cropDoctor')}
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono">
                Visual Inspection
              </span>
            </h3>
            <p className="text-[11px] text-white/40 font-mono">
              Foliar Pathology &amp; Leaf Lesion Identification
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Model Selector Pills */}
          <div className="flex items-center p-0.5 bg-black/60 border border-white/10 rounded-lg text-[10px] font-mono">
            <button
              onClick={() => handleModelChange('ensemble')}
              className={`px-2 py-1 rounded transition-all ${
                modelChoice === 'ensemble'
                  ? 'bg-amber-500 text-black font-bold shadow'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Ensemble (11+8)
            </button>
            <button
              onClick={() => handleModelChange('yolov11')}
              className={`px-2 py-1 rounded transition-all ${
                modelChoice === 'yolov11'
                  ? 'bg-amber-500 text-black font-bold shadow'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              YOLOv11
            </button>
            <button
              onClick={() => handleModelChange('yolov8')}
              className={`px-2 py-1 rounded transition-all ${
                modelChoice === 'yolov8'
                  ? 'bg-amber-500 text-black font-bold shadow'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              YOLOv8
            </button>
            <button
              onClick={() => handleModelChange('cnn')}
              className={`px-2 py-1 rounded transition-all ${
                modelChoice === 'cnn'
                  ? 'bg-emerald-500 text-black font-bold shadow'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              CNN (PlantVillage)
            </button>
          </div>

          <label className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.1] text-xs font-mono text-white/80 transition-all">
            <Upload className="w-3.5 h-3.5 text-amber-400" />
            <span>Upload Leaf</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
          </label>
        </div>
      </div>

      {/* Preset Selector */}
      <div className="mb-4">
        <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 block mb-2">
          Select Sample Leaf Observation:
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {SAMPLE_LEAF_PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => handleRunDiagnosis(p)}
              className={`p-2 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                selectedPreset.id === p.id
                  ? 'bg-amber-500/15 border-amber-500/40 text-white shadow-[0_0_10px_rgba(245,158,11,0.15)]'
                  : 'bg-black/40 border-white/[0.06] text-white/60 hover:text-white hover:border-white/20'
              }`}
            >
              <img src={p.image} alt={p.name} className="w-9 h-9 rounded-lg object-cover shrink-0" />
              <div className="min-w-0">
                <span className="text-xs font-mono font-semibold block truncate text-white">{p.name}</span>
                <span className="text-[10px] text-white/40 font-mono block">{p.crop}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Visual Heatmap & Analysis Output */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-black/40 border border-white/[0.06] rounded-xl p-4">
        {/* Left: Image with Grad-CAM Attention Heatmap & Segmentation Mask Overlay */}
        <div className="md:col-span-5 relative rounded-xl overflow-hidden border border-white/10 bg-black aspect-video md:aspect-square flex items-center justify-center">
          <img
            src={selectedPreset.image}
            alt="Leaf inspection"
            className="w-full h-full object-cover"
          />

          {/* View Mode Toggle Overlay */}
          <div className="absolute top-2 right-2 z-10 flex items-center p-0.5 bg-black/80 backdrop-blur-md border border-white/20 rounded-md text-[9px] font-mono shadow-lg">
            <button
              onClick={() => setViewMode('mask')}
              className={`px-1.5 py-0.5 rounded transition-all ${
                viewMode === 'mask' ? 'bg-amber-500 text-black font-bold' : 'text-white/60 hover:text-white'
              }`}
            >
              Mask
            </button>
            <button
              onClick={() => setViewMode('bbox')}
              className={`px-1.5 py-0.5 rounded transition-all ${
                viewMode === 'bbox' ? 'bg-amber-500 text-black font-bold' : 'text-white/60 hover:text-white'
              }`}
            >
              BBoxes
            </button>
            <button
              onClick={() => setViewMode('heatmap')}
              className={`px-1.5 py-0.5 rounded transition-all ${
                viewMode === 'heatmap' ? 'bg-amber-500 text-black font-bold' : 'text-white/60 hover:text-white'
              }`}
            >
              Heatmap
            </button>
          </div>

          {/* 1. SVG Foliar Segmentation Masks */}
          {(viewMode === 'mask' || viewMode === 'heatmap') && (
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              {diagnosis?.segmentation_masks?.map((m: any, idx: number) => (
                <g key={idx}>
                  <polygon
                    points={m.points}
                    fill={viewMode === 'heatmap' ? 'rgba(239, 68, 68, 0.65)' : (m.color || 'rgba(245, 158, 11, 0.50)')}
                    stroke="#ef4444"
                    strokeWidth="0.75"
                    strokeDasharray={viewMode === 'mask' ? '2,2' : undefined}
                    className="animate-pulse"
                  />
                </g>
              ))}
            </svg>
          )}

          {/* 2. YOLO Bounding Box Overlays */}
          {viewMode === 'bbox' &&
            diagnosis?.gradcam_bounding_boxes?.map((b: any, idx: number) => (
              <div
                key={idx}
                className="absolute border-2 border-dashed border-red-400 bg-red-500/25 rounded-lg pointer-events-none animate-pulse flex items-start justify-between p-1"
                style={{
                  left: `${b.x}%`,
                  top: `${b.y}%`,
                  width: `${b.width}%`,
                  height: `${b.height}%`,
                }}
              >
                <span className="text-[8px] font-mono bg-black/80 text-red-300 border border-red-500/40 px-1 rounded">
                  {b.label ? `${b.label.slice(0, 16)}` : 'Lesion'}
                </span>
                <span className="text-[8px] font-mono bg-red-600 text-white px-1 rounded font-bold">
                  {((b.intensity || 0.9) * 100).toFixed(0)}%
                </span>
              </div>
            ))}

          <div className="absolute bottom-2 left-2 right-2 px-2 py-1 rounded bg-black/80 backdrop-blur-md border border-white/10 flex items-center justify-between text-[10px] font-mono text-white/70">
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3 text-red-400" />
              YOLO11m-seg Foliar Vision
            </span>
            <span className="text-emerald-400 font-semibold">
              {diagnosis.active_models?.length ? `${diagnosis.active_models.length} Model Ensemble` : 'Agrosight YOLO'}
            </span>
          </div>

          {analyzing && (
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
              <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-mono text-amber-300">Computing YOLO11m-seg Masks...</span>
            </div>
          )}
        </div>

        {/* Right: Diagnosis Details & Multi-Factor Impact Engine */}
        <div className="md:col-span-7 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider block">
                    Foliar Pathology Diagnosis
                  </span>
                  {diagnosis.inference_latency_ms && (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/5 border border-white/10 text-white/50">
                      {diagnosis.inference_latency_ms}ms
                    </span>
                  )}
                </div>
                <h4 className="text-base font-mono font-bold text-white mt-0.5">
                  {diagnosis.disease}
                </h4>
              </div>

              <div className="text-right">
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                  diagnosis.severity === 'Critical'
                    ? 'bg-red-500/15 border-red-500/30 text-red-300'
                    : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                }`}>
                  Severity: {diagnosis.severity}
                </span>
                <span className="text-[11px] font-mono font-bold text-emerald-400 block mt-1">
                  {(diagnosis.confidence * 100).toFixed(0)}% Confidence
                </span>
              </div>
            </div>

            {/* Scientific Canopy Area Health Meter */}
            <div className="mt-2.5 p-3 rounded-xl bg-white/[0.03] border border-white/10">
              <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                <span className="flex items-center gap-1.5 text-rose-300 font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  Visually Affected: <strong>{diagnosis.visually_affected_area_pct || 18.7}%</strong>
                </span>
                <span className="flex items-center gap-1.5 text-emerald-300 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Healthy Canopy: <strong>{diagnosis.healthy_vegetation_pct || 81.3}%</strong>
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-black/60 overflow-hidden flex border border-white/10">
                <div
                  className="h-full bg-gradient-to-r from-rose-500 to-amber-500 transition-all duration-500"
                  style={{ width: `${diagnosis.visually_affected_area_pct || 18.7}%` }}
                />
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                  style={{ width: `${diagnosis.healthy_vegetation_pct || 81.3}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono text-white/40 mt-1">
                <span>Foliar Symptom Area</span>
                <span className="text-amber-300 font-semibold">Detected Stress: {diagnosis.severity || 'Moderate'}</span>
                <span>Photosynthetic Foliage</span>
              </div>
            </div>

            {/* Top-3 CNN Predictions — shown only in CNN mode */}
            {modelChoice === 'cnn' && diagnosis.top3_predictions && diagnosis.top3_predictions.length > 0 && (
              <div className="mt-2.5 p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20">
                <span className="text-[10px] font-mono text-emerald-400 font-semibold block mb-2 uppercase tracking-wider">
                  PlantVillage CNN — Top 3 Predictions
                </span>
                <div className="space-y-1.5">
                  {diagnosis.top3_predictions.map((pred: any, i: number) => (
                    <div key={i} className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-mono text-white/70 truncate flex-1">
                        {i === 0 && <span className="text-emerald-400 font-bold mr-1">▶</span>}
                        {pred.label.replace('___', ' — ').replace(/_/g, ' ')}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <div className="w-16 h-1.5 rounded-full bg-black/60 overflow-hidden border border-white/10">
                          <div
                            className={`h-full rounded-full transition-all ${i === 0 ? 'bg-emerald-400' : 'bg-white/30'}`}
                            style={{ width: `${(pred.confidence * 100).toFixed(0)}%` }}
                          />
                        </div>
                        <span className={`text-[10px] font-mono font-bold ${i === 0 ? 'text-emerald-400' : 'text-white/50'}`}>
                          {(pred.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-2.5 p-2.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-red-500/10 to-transparent border border-amber-500/30 flex items-center justify-between">
              <div>
                <span className="text-[9px] font-mono uppercase text-amber-300/80 tracking-wider block">
                  Agronomic Risk Model (YOLO Mask + Sentinel-2 NDVI + Climate)
                </span>
                <span className="text-xs font-mono font-bold text-white">
                  Estimated Crop Impact:{' '}
                  <span className="text-amber-400">
                    {diagnosis.dual_signal_risk?.estimated_crop_impact || 'Moderate Potential Yield Impact (15-30%)'}
                  </span>
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0 font-bold">
                Field Risk: {diagnosis.dual_signal_risk?.composite_field_risk_score || 74.2}/100
              </span>
            </div>

            {/* Organic Remedies & IPM Actions */}
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-sans">
              <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/20">
                <span className="text-[10px] font-mono text-emerald-400 font-semibold block mb-1">
                  🌿 Prescribed Organic Alternatives:
                </span>
                <ul className="text-[11px] text-white/70 space-y-1 list-disc list-inside">
                  {diagnosis.organic_remedies?.map((rem: string, i: number) => (
                    <li key={i}>{rem}</li>
                  ))}
                </ul>
              </div>

              <div className="p-2.5 rounded-lg bg-blue-950/20 border border-blue-500/20">
                <span className="text-[10px] font-mono text-blue-400 font-semibold block mb-1">
                  🛡️ Integrated Pest Management (IPM):
                </span>
                <ul className="text-[11px] text-white/70 space-y-1 list-disc list-inside">
                  {diagnosis.ipm_practices?.map((ipm: string, i: number) => (
                    <li key={i}>{ipm}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Chemical Treatment Prescription (if available) */}
            {diagnosis.chemical_treatment && (
              <div className="mt-2 p-2 rounded-lg bg-rose-950/20 border border-rose-500/20 text-xs font-sans">
                <span className="text-[10px] font-mono text-rose-300 font-semibold block mb-0.5">
                  🧪 Curative Chemical Treatment (KVK/CIBRC Guidelines):
                </span>
                <p className="text-[11px] text-white/70">
                  {diagnosis.chemical_treatment}
                </p>
              </div>
            )}
          </div>

          {/* Mandatory Responsible AI Advisory Disclaimer */}
          <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[10px] font-sans text-amber-200/90 leading-tight">
              <strong>Mandatory Notice:</strong> {diagnosis.advisory_disclaimer} Avoid applying unverified high-potency chemical dosages without local diagnostic verification.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
