import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Upload, AlertTriangle, ShieldCheck, Activity,
  Leaf, Microscope, CheckCircle2, ArrowRight,
  RefreshCw, Info, Sparkles
} from 'lucide-react';
import { api } from '../../lib/api';

// ── Types ───────────────────────────────────────────────────────────────────

export interface DiagnosisResult {
  status: string;
  analysis_path: string;
  detection_mode: string;
  heatmap_type: string;
  crop: string;
  disease: string;
  pathogen_type: string;
  confidence: number;
  severity: string;
  symptoms: string[];
  detected_classes: string[];
  visually_affected_area_pct: number;
  healthy_vegetation_pct: number;
  health_score: number;
  total_lamina_pixels: number | null;
  diseased_pixels: number | null;
  necrotic_pixels: number | null;
  chlorotic_pixels: number | null;
  segmentation_masks: Array<{
    id: string;
    label: string;
    points: string;
    area_pct: number;
    color: string;
  }>;
  gradcam_bounding_boxes: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    intensity: number;
    label: string;
  }>;
  heatmap_b64: string | null;
  organic_remedies: string[];
  chemical_treatment: string;
  ipm_practices: string[];
  advisory_disclaimer: string;
  dual_signal_risk?: Record<string, any>;
  inference_latency_ms: number | null;
}

// ── Processing Stages ───────────────────────────────────────────────────────

const STAGES = [
  { id: 'upload', label: 'Image Upload' },
  { id: 'preprocess', label: 'Preprocessing' },
  { id: 'detect', label: 'Crop Detection' },
  { id: 'segment', label: 'Damage Segmentation' },
  { id: 'severity', label: 'Severity Analysis' },
  { id: 'heatmap', label: 'Heatmap Generation' },
  { id: 'report', label: 'Final Report' },
] as const;

// ── Preset Leaf Samples ─────────────────────────────────────────────────────

const SAMPLE_PRESETS = [
  {
    id: 'wheat',
    filename: 'wheat_yellow_rust.jpg',
    name: 'Wheat Yellow Rust',
    crop: 'Wheat',
    thumb: '/sample_leaves/wheat_yellow_rust.jpg',
    description: 'Puccinia striiformis striation on wheat foliage'
  },
  {
    id: 'potato',
    filename: 'potato_late_blight.jpg',
    name: 'Potato Late Blight',
    crop: 'Potato',
    thumb: '/sample_leaves/potato_late_blight.jpg',
    description: 'Phytophthora infestans water-soaked necrotic lesions'
  },
  {
    id: 'tomato_early',
    filename: 'tomato_early_blight.jpg',
    name: 'Tomato Early Blight',
    crop: 'Tomato',
    thumb: '/sample_leaves/tomato_early_blight.jpg',
    description: 'Alternaria solani concentric target spot halos'
  },
  {
    id: 'tomato_healthy',
    filename: 'tomato_healthy.jpg',
    name: 'Tomato Healthy',
    crop: 'Tomato',
    thumb: '/sample_leaves/tomato_healthy.jpg',
    description: 'Uncompromised photosynthetic foliar tissue'
  }
];

// ── Severity styling & thresholds ───────────────────────────────────────────

function getSeverityBadge(severity: string) {
  const sev = (severity || '').toLowerCase();
  if (sev.includes('critical') || sev.includes('severe')) {
    return {
      text: 'Severe (>35% affected)',
      className: 'bg-red-500/15 text-red-400 border-red-500/30'
    };
  }
  if (sev.includes('moderate')) {
    return {
      text: 'Moderate (15–35% affected)',
      className: 'bg-amber-500/15 text-amber-300 border-amber-500/30'
    };
  }
  if (sev.includes('mild')) {
    return {
      text: 'Mild (5–15% affected)',
      className: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30'
    };
  }
  return {
    text: 'Healthy (<5% affected)',
    className: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
  };
}

interface CropDamageAnalyzerProps {
  onHealthScoreCalculated?: (healthScore: number, damagePct: number) => void;
}

export const CropDamageAnalyzer: React.FC<CropDamageAnalyzerProps> = ({
  onHealthScoreCalculated
}) => {
  const [currentImage, setCurrentImage] = useState<string>(SAMPLE_PRESETS[0].thumb);
  const [currentFilename, setCurrentFilename] = useState<string>(SAMPLE_PRESETS[0].filename);
  const [isUploaded, setIsUploaded] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [currentStageIdx, setCurrentStageIdx] = useState<number>(-1);
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);
  const [modelChoice, setModelChoice] = useState<'ensemble' | 'yolov11' | 'yolov8' | 'cnn'>('ensemble');
  const [activeView, setActiveView] = useState<'all' | 'original' | 'heatmap' | 'overlay'>('all');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Execute actual inference
  const executeInference = useCallback(async (
    payload: { filename?: string; image_base64?: string },
    chosenModel = modelChoice
  ) => {
    setAnalyzing(true);
    setErrorMsg(null);
    setCurrentStageIdx(0);

    // Staged animation progression (advancing through the real analysis stages)
    const stageInterval = setInterval(() => {
      setCurrentStageIdx((prev: number) => (prev < STAGES.length - 2 ? prev + 1 : prev));
    }, 180);

    try {
      const res = await api.krishiSaarthi.diagnoseDisease({
        ...payload,
        model_choice: chosenModel
      });

      clearInterval(stageInterval);
      setCurrentStageIdx(STAGES.length - 1); // Final report stage

      if (res.data) {
        const diag = res.data as DiagnosisResult;
        setDiagnosis(diag);
        if (onHealthScoreCalculated && diag.health_score !== undefined) {
          onHealthScoreCalculated(diag.health_score, diag.visually_affected_area_pct);
        }
      }
    } catch (err: any) {
      clearInterval(stageInterval);
      setErrorMsg(err?.message || 'Failed to reach ML inference service.');
    } finally {
      setTimeout(() => {
        setAnalyzing(false);
      }, 250);
    }
  }, [modelChoice, onHealthScoreCalculated]);

  // Initial auto-run on component mount
  useEffect(() => {
    executeInference({ filename: SAMPLE_PRESETS[0].filename });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle local user photo upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const b64 = reader.result as string;
      setCurrentImage(b64);
      setCurrentFilename(file.name);
      setIsUploaded(true);
      executeInference({ image_base64: b64, filename: file.name });
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPreset = (preset: typeof SAMPLE_PRESETS[0]) => {
    setCurrentImage(preset.thumb);
    setCurrentFilename(preset.filename);
    setIsUploaded(false);
    executeInference({ filename: preset.filename });
  };

  const handleModelChange = (model: 'ensemble' | 'yolov11' | 'yolov8' | 'cnn') => {
    setModelChoice(model);
    if (isUploaded) {
      executeInference({ image_base64: currentImage, filename: currentFilename }, model);
    } else {
      executeInference({ filename: currentFilename }, model);
    }
  };

  const severityBadge = diagnosis ? getSeverityBadge(diagnosis.severity) : null;

  return (
    <div className="bg-neutral-900/90 border border-white/10 rounded-2xl p-4 sm:p-6 text-white space-y-6">

      {/* Dual Path Architecture Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
              Path 2: Crop Image Analysis
            </span>
            <span className="text-white/40 text-xs">•</span>
            <span className="text-[11px] font-mono text-white/50">
              Foliar Computer Vision &amp; Deep Learning
            </span>
          </div>
          <h2 className="text-xl font-bold font-mono text-white mt-1 flex items-center gap-2">
            <Microscope className="w-5 h-5 text-amber-400" />
            Crop Damage &amp; Foliar Pathology ML Engine
          </h2>
          <p className="text-xs text-white/60 font-sans mt-0.5">
            Real inference on leaf/plant imagery via OpenCV pixel decomposition &amp; YOLOv11/v8 segmentation.
          </p>
        </div>

        {/* Model Selector & Upload Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-black/60 border border-white/10 rounded-lg p-1 text-[11px] font-mono">
            <button
              onClick={() => handleModelChange('ensemble')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                modelChoice === 'ensemble'
                  ? 'bg-amber-500 text-black font-bold'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              YOLO Ensemble
            </button>
            <button
              onClick={() => handleModelChange('yolov11')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                modelChoice === 'yolov11'
                  ? 'bg-amber-500 text-black font-bold'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              YOLOv11
            </button>
            <button
              onClick={() => handleModelChange('cnn')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                modelChoice === 'cnn'
                  ? 'bg-emerald-500 text-black font-bold'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              PlantVillage CNN
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-black font-mono font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Crop Image</span>
          </button>
        </div>
      </div>

      {/* Preset Selector */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider">
            Or select calibrated agricultural benchmark sample:
          </span>
          {isUploaded && (
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Custom Upload Active: {currentFilename}
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {SAMPLE_PRESETS.map((p) => {
            const isSelected = !isUploaded && currentFilename === p.filename;
            return (
              <button
                key={p.id}
                onClick={() => handleSelectPreset(p)}
                className={`flex items-center gap-2.5 p-2 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.18)] text-white'
                    : 'bg-black/40 border-white/10 text-white/70 hover:border-white/25 hover:text-white'
                }`}
              >
                <img
                  src={p.thumb}
                  alt={p.name}
                  className="w-10 h-10 rounded-lg object-cover shrink-0 border border-white/10"
                />
                <div className="min-w-0">
                  <p className="text-xs font-mono font-bold truncate text-white">{p.name}</p>
                  <p className="text-[10px] font-mono text-white/40 truncate">{p.crop}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Processing Stages Bar (Animated during inference) */}
      {analyzing && (
        <div className="bg-black/60 border border-amber-500/30 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-amber-300 flex items-center gap-1.5 font-bold">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
              Live Inference Running: {STAGES[currentStageIdx]?.label || 'Processing...'}
            </span>
            <span className="text-white/40 text-[10px]">
              Stage {Math.max(1, currentStageIdx + 1)} of {STAGES.length}
            </span>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {STAGES.map((st, idx) => {
              const isPast = idx < currentStageIdx;
              const isCurrent = idx === currentStageIdx;
              return (
                <div key={st.id} className="space-y-1">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      isPast
                        ? 'bg-emerald-400'
                        : isCurrent
                        ? 'bg-amber-400 animate-pulse'
                        : 'bg-white/10'
                    }`}
                  />
                  <p
                    className={`text-[8px] font-mono truncate text-center ${
                      isPast
                        ? 'text-emerald-400'
                        : isCurrent
                        ? 'text-amber-300 font-bold'
                        : 'text-white/20'
                    }`}
                  >
                    {st.label.split(' ')[0]}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Error Banner if any */}
      {errorMsg && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2 text-xs font-mono text-red-300">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 3-Column Visual Panel: Original Image | Damage Heatmap | Detection Overlay */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-white/50">
            Tri-Pane Inspection &amp; Explainability Visualization
          </span>
          {/* View Toggles for Mobile / Focused View */}
          <div className="flex items-center bg-black/60 border border-white/10 rounded-lg p-0.5 text-[10px] font-mono">
            <button
              onClick={() => setActiveView('all')}
              className={`px-2 py-0.5 rounded ${activeView === 'all' ? 'bg-white/20 text-white' : 'text-white/40'}`}
            >
              Side-by-Side (All 3)
            </button>
            <button
              onClick={() => setActiveView('original')}
              className={`px-2 py-0.5 rounded ${activeView === 'original' ? 'bg-white/20 text-white' : 'text-white/40'}`}
            >
              Original
            </button>
            <button
              onClick={() => setActiveView('heatmap')}
              className={`px-2 py-0.5 rounded ${activeView === 'heatmap' ? 'bg-white/20 text-white' : 'text-white/40'}`}
            >
              Heatmap
            </button>
            <button
              onClick={() => setActiveView('overlay')}
              className={`px-2 py-0.5 rounded ${activeView === 'overlay' ? 'bg-white/20 text-white' : 'text-white/40'}`}
            >
              Overlay
            </button>
          </div>
        </div>

        <div className={`grid gap-3 ${
          activeView === 'all' ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1'
        }`}>

          {/* Pane 1: Original Image */}
          {(activeView === 'all' || activeView === 'original') && (
            <div className="bg-black/60 border border-white/10 rounded-xl overflow-hidden flex flex-col">
              <div className="px-3 py-1.5 bg-neutral-950 border-b border-white/10 flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-white/80">
                  1. ORIGINAL IMAGE
                </span>
                <span className="text-[9px] font-mono text-white/40 truncate max-w-[120px]">
                  {currentFilename}
                </span>
              </div>
              <div className="relative aspect-square bg-neutral-950 flex items-center justify-center p-2">
                <img
                  src={currentImage}
                  alt="Original input leaf"
                  className="w-full h-full object-contain rounded-lg"
                />
                <div className="absolute bottom-3 left-3 px-2 py-0.5 rounded bg-black/80 backdrop-blur-sm border border-white/20 text-[9px] font-mono text-white/90">
                  Healthy Lamina: {diagnosis?.healthy_vegetation_pct ?? 100}%
                </div>
              </div>
            </div>
          )}

          {/* Pane 2: Damage Mask / Heatmap (Pixel-Level via OpenCV JET Colormap) */}
          {(activeView === 'all' || activeView === 'heatmap') && (
            <div className="bg-black/60 border border-white/10 rounded-xl overflow-hidden flex flex-col">
              <div className="px-3 py-1.5 bg-neutral-950 border-b border-white/10 flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-amber-400">
                  2. DAMAGE HEATMAP
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  {diagnosis?.heatmap_type === 'opencv_hsv_segmentation'
                    ? 'Pixel-Level (OpenCV HSV)'
                    : 'Region-Level Heatmap'}
                </span>
              </div>
              <div className="relative aspect-square bg-neutral-950 flex items-center justify-center p-2">
                {diagnosis?.heatmap_b64 ? (
                  <img
                    src={`data:image/jpeg;base64,${diagnosis.heatmap_b64}`}
                    alt="Damage Heatmap"
                    className="w-full h-full object-contain rounded-lg"
                  />
                ) : (
                  /* Fallback display if heatmap is generating */
                  <div className="relative w-full h-full flex items-center justify-center">
                    <img
                      src={currentImage}
                      alt="Heatmap base"
                      className="w-full h-full object-contain rounded-lg opacity-40"
                    />
                    <div className="absolute inset-0 bg-red-500/20 mix-blend-multiply rounded-lg" />
                  </div>
                )}
                <div className="absolute bottom-3 left-3 px-2 py-0.5 rounded bg-black/80 backdrop-blur-sm border border-white/20 text-[9px] font-mono text-rose-300 font-bold">
                  Affected Area: {diagnosis?.visually_affected_area_pct ?? 0}%
                </div>
                <div className="absolute top-3 right-3 px-1.5 py-0.5 rounded bg-black/80 text-[8px] font-mono text-white/50 border border-white/10">
                  JET: Red=Necrotic, Blue=Healthy
                </div>
              </div>
            </div>
          )}

          {/* Pane 3: Bounding Box & Segmentation Mask Overlay */}
          {(activeView === 'all' || activeView === 'overlay') && (
            <div className="bg-black/60 border border-white/10 rounded-xl overflow-hidden flex flex-col">
              <div className="px-3 py-1.5 bg-neutral-950 border-b border-white/10 flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-emerald-400">
                  3. DETECTION OVERLAY
                </span>
                <span className="text-[9px] font-mono text-white/50">
                  {diagnosis?.segmentation_masks?.length || 0} Lesions / {diagnosis?.gradcam_bounding_boxes?.length || 0} Boxes
                </span>
              </div>
              <div className="relative aspect-square bg-neutral-950 flex items-center justify-center p-2 overflow-hidden">
                <img
                  src={currentImage}
                  alt="Detection Overlay Base"
                  className="w-full h-full object-contain rounded-lg"
                />

                {/* SVG Polygon Segmentation Masks */}
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none p-2"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  {diagnosis?.segmentation_masks?.map((mask: any, idx: number) => (
                    <polygon
                      key={mask.id || idx}
                      points={mask.points}
                      fill="rgba(239, 68, 68, 0.45)"
                      stroke="#ef4444"
                      strokeWidth="1.2"
                      className="animate-pulse"
                    />
                  ))}
                </svg>

                {/* YOLO Bounding Boxes */}
                {diagnosis?.gradcam_bounding_boxes?.map((box: any, idx: number) => (
                  <div
                    key={idx}
                    className="absolute border border-yellow-400 bg-amber-500/15 rounded pointer-events-none flex items-start p-0.5 shadow-sm"
                    style={{
                      left: `calc(${box.x}% + 8px)`,
                      top: `calc(${box.y}% + 8px)`,
                      width: `calc(${box.width}% - 16px)`,
                      height: `calc(${box.height}% - 16px)`
                    }}
                  >
                    <span className="text-[7px] font-mono bg-yellow-400 text-black px-1 font-bold rounded-xs truncate max-w-full">
                      {box.label || `Lesion #${idx + 1}`}
                    </span>
                  </div>
                ))}

                <div className="absolute bottom-3 left-3 px-2 py-0.5 rounded bg-black/80 backdrop-blur-sm border border-white/20 text-[9px] font-mono text-yellow-300">
                  Confidence: {diagnosis ? `${(diagnosis.confidence * 100).toFixed(0)}%` : '—'}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Metrics Row: Health Score → Damage % → Severity → Detected Disease → Confidence */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-2">

        {/* 1. Crop Health Score */}
        <div className="bg-black/50 border border-white/10 rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-white/50">
            <span className="text-[10px] font-mono uppercase">Crop Health Score</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold font-mono text-emerald-400">
              {diagnosis?.health_score !== undefined ? `${diagnosis.health_score}/100` : '—'}
            </div>
            <p className="text-[9px] font-mono text-white/40 mt-0.5">
              100 - Affected Area %
            </p>
          </div>
        </div>

        {/* 2. Damage Percentage */}
        <div className="bg-black/50 border border-white/10 rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-white/50">
            <span className="text-[10px] font-mono uppercase">Damage Area</span>
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold font-mono text-rose-400">
              {diagnosis ? `${diagnosis.visually_affected_area_pct}%` : '—'}
            </div>
            <p className="text-[9px] font-mono text-white/40 mt-0.5">
              {diagnosis?.diseased_pixels
                ? `${diagnosis.diseased_pixels.toLocaleString()} / ${diagnosis.total_lamina_pixels?.toLocaleString()} px`
                : 'Foliar symptomatic area'}
            </p>
          </div>
        </div>

        {/* 3. Severity & Threshold */}
        <div className="bg-black/50 border border-white/10 rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-white/50">
            <span className="text-[10px] font-mono uppercase">Severity Tier</span>
            <Activity className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="mt-2">
            {severityBadge ? (
              <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${severityBadge.className}`}>
                {severityBadge.text}
              </span>
            ) : (
              <span className="text-sm font-mono text-white/40">—</span>
            )}
            <p className="text-[9px] font-mono text-white/40 mt-1">
              Agronomic Threshold Used
            </p>
          </div>
        </div>

        {/* 4. Detected Disease */}
        <div className="bg-black/50 border border-white/10 rounded-xl p-3 flex flex-col justify-between col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-white/50">
            <span className="text-[10px] font-mono uppercase">Detected Disease</span>
            <Leaf className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="mt-2">
            <div className="text-sm font-bold font-mono text-white truncate" title={diagnosis?.disease}>
              {diagnosis?.disease || '—'}
            </div>
            <p className="text-[9px] font-mono text-white/40 mt-0.5 truncate">
              {diagnosis?.pathogen_type || 'Pathogen Classified'}
            </p>
          </div>
        </div>

        {/* 5. Confidence Score */}
        <div className="bg-black/50 border border-white/10 rounded-xl p-3 flex flex-col justify-between col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-white/50">
            <span className="text-[10px] font-mono uppercase">Model Confidence</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold font-mono text-amber-300">
              {diagnosis ? `${(diagnosis.confidence * 100).toFixed(1)}%` : '—'}
            </div>
            <p className="text-[9px] font-mono text-white/40 mt-0.5">
              {diagnosis?.inference_latency_ms ? `${diagnosis.inference_latency_ms}ms latency` : 'Deep model output'}
            </p>
          </div>
        </div>

      </div>

      {/* AI Analysis Summary → Recommended Action */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">

        {/* Left: AI Analysis Summary */}
        <div className="bg-black/40 border border-white/10 rounded-xl p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              AI Agronomic Analysis Summary
            </h4>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white/40">
              Mode: {diagnosis?.detection_mode || 'opencv_foliar_decomposition'}
            </span>
          </div>

          <div className="text-xs font-sans text-white/80 space-y-1.5 leading-relaxed">
            <p>
              <strong className="text-white font-mono">Detected Condition:</strong>{' '}
              {diagnosis?.disease || 'Awaiting analysis...'}
            </p>
            <p>
              <strong className="text-white font-mono">Estimated Affected Area:</strong>{' '}
              {diagnosis?.visually_affected_area_pct ?? 0}% of foliar lamina
              {diagnosis?.diseased_pixels
                ? ` (${diagnosis.diseased_pixels.toLocaleString()} necrotic/chlorotic px²)`
                : ''}.
            </p>
            <p>
              <strong className="text-white font-mono">Severity:</strong>{' '}
              <span className="text-amber-300 font-mono font-semibold">{diagnosis?.severity || 'Normal'}</span>{' '}
              ({diagnosis?.visually_affected_area_pct && diagnosis.visually_affected_area_pct > 35 ? 'Critical damage exceeds 35% threshold' : 'Symptom load within manageable threshold'}).
            </p>
            <p>
              <strong className="text-white font-mono">Model Confidence:</strong>{' '}
              <span className="text-emerald-400 font-mono font-semibold">
                {diagnosis ? `${(diagnosis.confidence * 100).toFixed(1)}%` : '—'}
              </span>
            </p>
          </div>

          {diagnosis?.symptoms && diagnosis.symptoms.length > 0 && (
            <div className="pt-2 border-t border-white/10">
              <span className="text-[10px] font-mono uppercase text-white/50 block mb-1">
                Foliar Symptoms Observed:
              </span>
              <ul className="text-[11px] font-mono text-white/70 space-y-0.5 list-disc list-inside">
                {diagnosis.symptoms.slice(0, 3).map((s: string, i: number) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right: Recommended Action (Organic + Chemical + GAP) */}
        <div className="bg-black/40 border border-white/10 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <ArrowRight className="w-4 h-4 text-amber-400" />
              Recommended Agronomic Actions
            </h4>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
              KVK / ICAR Protocol
            </span>
          </div>

          {/* Curative Chemical */}
          {diagnosis?.chemical_treatment && (
            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20">
              <span className="text-[10px] font-mono uppercase tracking-wider text-rose-300 font-bold block mb-1">
                Targeted Chemical Intervention (Clinical Dosage):
              </span>
              <p className="text-xs font-mono text-white/90">
                {diagnosis.chemical_treatment}
              </p>
            </div>
          )}

          {/* Biological / Organic Remedies */}
          {diagnosis?.organic_remedies && diagnosis.organic_remedies.length > 0 && (
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-300 font-bold block mb-1">
                Biological &amp; Cultural Control:
              </span>
              <ul className="text-xs font-mono text-white/80 space-y-1 list-disc list-inside">
                {diagnosis.organic_remedies.slice(0, 2).map((r: string, i: number) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Scientific Disclaimer */}
          <div className="p-2 rounded-lg bg-white/5 border border-white/10 flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-white/40 shrink-0 mt-0.5" />
            <p className="text-[10px] font-sans text-white/50 leading-tight">
              {diagnosis?.advisory_disclaimer ||
                'Proximal leaf damage indicates foliar symptom burden. Validate with local Krishi Vigyan Kendra agronomists before large-scale spray.'}
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};
