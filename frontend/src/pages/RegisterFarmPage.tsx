/**
 * RegisterFarmPage.tsx
 *
 * 3-Step Guided Farmer Workflow:
 *  1. LOCATE: "pehele locate my location kar" (GPS Geolocation / Indian Region Search)
 *  2. DRAW BOUNDARY: "then me boundary draw karunga" (Interactive polygon drawing, vertex placing, undo, live acreage)
 *  3. ANALYZE: "then analysis perform karunga" (Register farm, trigger Sentinel-2 multi-spectral pipeline & ZK verification)
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import FarmMap from '../components/FarmMap';
import FullscreenFieldDrawer from '../components/FullscreenFieldDrawer';
import { api } from '../lib/api';
import {
  MapPin,
  Compass,
  CheckCircle2,
  AlertCircle,
  Activity,
  Layers,
  Undo2,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Wheat,
  Maximize2,
  Hand,
} from 'lucide-react';

interface CityPreset {
  name: string;
  state: string;
  lat: number;
  lon: number;
}

const REGION_PRESETS: CityPreset[] = [
  { name: 'Ujjain', state: 'Madhya Pradesh', lat: 23.1765, lon: 75.7885 },
  { name: 'Ludhiana / Patiala', state: 'Punjab', lat: 30.3398, lon: 76.3869 },
  { name: 'Nagpur / Vidarbha', state: 'Maharashtra', lat: 21.1458, lon: 79.0882 },
  { name: 'Palakkad / Thrissur', state: 'Kerala', lat: 10.5276, lon: 76.2144 },
  { name: 'Karnal', state: 'Haryana', lat: 29.6857, lon: 76.9905 },
];

export default function RegisterFarmPage() {
  const navigate = useNavigate();

  // Workflow Steps: 1 = Locate, 2 = Draw Boundary, 3 = Configure & Analyze
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);

  // Farmer Location State
  const [farmerCoords, setFarmerCoords] = useState<{ lat: number; lon: number; label?: string } | null>(null);
  const [locatingGPS, setLocatingGPS] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Boundary Drawing State
  const [boundary, setBoundary] = useState<number[][]>([]);
  const [showFullscreenDrawer, setShowFullscreenDrawer] = useState<boolean>(false);
  const [_isDrawingActive, setIsDrawingActive] = useState<boolean>(false);

  // Form Details
  const [farmName, setFarmName] = useState<string>('My Agricultural Parcel');
  const [cropType, setCropType] = useState<string>('wheat');
  const [sowingDate, setSowingDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [policyId, setPolicyId] = useState<string>('POLICY-001');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // ── Step 1: Geolocation Handler ───────────────────────────────────────────
  const handleGetLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    setLocatingGPS(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          label: 'Current Device GPS Location',
        };
        setFarmerCoords(coords);
        setLocatingGPS(false);
        // Automatically activate Step 2 (Draw Boundary) once located!
        setActiveStep(2);
        setIsDrawingActive(true);
      },
      (err) => {
        setLocatingGPS(false);
        setLocationError(
          err.code === 1
            ? 'Location permission was denied. You can select a region below or search manually.'
            : 'Unable to acquire GPS fix. Please choose a region from the list.'
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 }
    );
  }, []);

  const handleSelectPreset = (preset: CityPreset) => {
    const coords = {
      lat: preset.lat,
      lon: preset.lon,
      label: `${preset.name}, ${preset.state}`,
    };
    setFarmerCoords(coords);
    setLocationError(null);
    setActiveStep(2);
    setIsDrawingActive(true);
  };

  // ── Step 2: Boundary Area Calculation ──────────────────────────────────────
  const computedAreaHa = useMemo(() => {
    if (boundary.length < 3) return 0;
    // Standard Shoelace formula approximation for small agricultural plots
    let area = 0;
    for (let i = 0; i < boundary.length; i++) {
      const j = (i + 1) % boundary.length;
      const x1 = boundary[i][1] * 111139 * Math.cos((boundary[i][0] * Math.PI) / 180);
      const y1 = boundary[i][0] * 111139;
      const x2 = boundary[j][1] * 111139 * Math.cos((boundary[j][0] * Math.PI) / 180);
      const y2 = boundary[j][0] * 111139;
      area += x1 * y2 - x2 * y1;
    }
    const sqMeters = Math.abs(area) / 2;
    return parseFloat((sqMeters / 10000).toFixed(2));
  }, [boundary]);

  // ── Step 3: Submission & Analysis Pipeline ──────────────────────────────────
  const handleRegisterAndAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (boundary.length < 3) {
      alert('Please draw at least 3 points on the map to define your farm boundary.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: farmName.trim() || `Farm Plot (${cropType.toUpperCase()})`,
        polygon_coordinates: boundary,
        crop_type: cropType,
        sowing_date: sowingDate,
        policy_id: policyId,
      };

      // 1. Create farm in backend database
      const res = await api.farms.create(payload);
      const farm = res.data;

      // 2. Trigger Sentinel-2 multi-spectral analysis
      try {
        await api.farms.analyze(farm.id);
      } catch (analyzeErr) {
        console.warn('[Register] Immediate analyze trigger:', analyzeErr);
      }

      // 3. Navigate to live Dashboard
      navigate(`/dashboard/${farm.id}`);
    } catch (err) {
      console.error('[Register] Error creating farm:', err);
      alert('Failed to register farm. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black/95 text-slate-100 font-sans pb-24 md:pb-12 pt-4">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-6">

        {/* ── 3-Step Guided Header ────────────────────────────────────────── */}
        <div className="bg-white dark:bg-dark-800 rounded-3xl p-6 border border-[#e3e3de] dark:border-dark-700 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-[#c8ecc8] text-[#03210b] dark:bg-emerald-500/20 dark:text-emerald-300 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-[#17341c] dark:text-emerald-400" />
                <span>Locate → Draw Field → Run Analysis</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17341c] dark:text-white tracking-tight">
                Field Registration &amp; Satellite Telemetry
              </h1>
              <p className="text-xs sm:text-sm text-[#424841] dark:text-slate-400 mt-1">
                Pinpoint your farm, trace cadastral boundary corners on high-res satellite imagery, and launch instant AI crop verification.
              </p>
            </div>

            {/* Step Pills */}
            <div className="flex items-center gap-2 bg-[#f4f4ee] dark:bg-dark-900 p-1.5 rounded-2xl border border-[#e3e3de] dark:border-dark-700">
              <button
                onClick={() => setActiveStep(1)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  activeStep === 1
                    ? 'bg-[#17341c] text-white shadow-sm'
                    : farmerCoords
                    ? 'text-[#17341c] dark:text-emerald-400 font-semibold'
                    : 'text-[#737971]'
                }`}
              >
                <span>1. Locate</span>
                {farmerCoords && <CheckCircle2 className="w-3.5 h-3.5 text-[#c8ecc8]" />}
              </button>

              <button
                onClick={() => {
                  if (farmerCoords) setActiveStep(2);
                  else handleGetLocation();
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  activeStep === 2
                    ? 'bg-[#17341c] text-white shadow-sm'
                    : boundary.length >= 3
                    ? 'text-[#17341c] dark:text-emerald-400 font-semibold'
                    : 'text-[#737971]'
                }`}
              >
                <span>2. Draw Boundary</span>
                {boundary.length >= 3 && <CheckCircle2 className="w-3.5 h-3.5 text-[#c8ecc8]" />}
              </button>

              <button
                onClick={() => {
                  if (boundary.length >= 3) setActiveStep(3);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  activeStep === 3
                    ? 'bg-[#17341c] text-white shadow-sm'
                    : 'text-[#737971]'
                }`}
              >
                <span>3. Analyze</span>
              </button>
            </div>
          </div>

          {/* ── Step 1 Banner: Locate My Location ─────────────────────────── */}
          {activeStep === 1 && (
            <div className="bg-[#f4f4ee] dark:bg-dark-900/80 rounded-2xl p-5 border border-[#e3e3de] dark:border-dark-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-bold text-[#17341c] dark:text-emerald-400">
                  <MapPin className="w-4 h-4" />
                  <span>Where is your farm located?</span>
                </div>
                <p className="text-xs text-[#424841] dark:text-slate-400">
                  Click below to fetch your current GPS position or select your agricultural zone.
                </p>
                {farmerCoords && (
                  <div className="text-xs font-mono text-emerald-700 dark:text-emerald-400 font-semibold pt-1">
                    ✓ Found: {farmerCoords.lat.toFixed(5)}°N, {farmerCoords.lon.toFixed(5)}°E ({farmerCoords.label})
                  </div>
                )}
                {locationError && (
                  <div className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{locationError}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                <button
                  type="button"
                  onClick={handleGetLocation}
                  disabled={locatingGPS}
                  className="flex-1 md:flex-none px-5 py-2.5 bg-[#17341c] hover:bg-[#2d4b31] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  <Compass className={`w-4 h-4 text-[#c8ecc8] ${locatingGPS ? 'animate-spin' : ''}`} />
                  <span>{locatingGPS ? 'Locating GPS Position...' : '📍 Locate My Location'}</span>
                </button>

                {/* Quick Region Selector */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                  {REGION_PRESETS.slice(0, 3).map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className="px-3 py-2 bg-white dark:bg-dark-800 hover:bg-[#e8e8e3] dark:hover:bg-dark-700 border border-[#e3e3de] dark:border-dark-600 rounded-xl text-xs font-semibold text-[#1a1c19] dark:text-white transition-colors whitespace-nowrap shadow-sm"
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2 Banner: Draw Field Boundary ────────────────────────── */}
          {activeStep === 2 && (
            <div className="bg-[#f4f4ee] dark:bg-dark-900/80 rounded-2xl p-5 border border-[#e3e3de] dark:border-dark-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-bold text-[#17341c] dark:text-emerald-400">
                  <Layers className="w-4 h-4" />
                  <span>Draw Your Field Boundary on the Map</span>
                </div>
                <p className="text-xs text-[#424841] dark:text-slate-400">
                  Click on the satellite map to place boundary corner vertices. Place at least 3 points to enclose your plot.
                </p>
                <div className="flex items-center gap-3 pt-1 text-xs font-mono">
                  <span className="font-bold text-[#17341c] dark:text-emerald-400">
                    Corners: {boundary.length}
                  </span>
                  <span>·</span>
                  <span className="font-bold text-[#17341c] dark:text-emerald-400">
                    Calculated Area: {computedAreaHa > 0 ? `${computedAreaHa} ha (${(computedAreaHa * 2.471).toFixed(2)} acres)` : '0.00 ha'}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <button
                  type="button"
                  onClick={() => setShowFullscreenDrawer(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Hand className="w-3.5 h-3.5" />
                  <span>Trace Field (Fullscreen)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (boundary.length > 0) {
                      setBoundary(boundary.slice(0, -1));
                    }
                  }}
                  disabled={boundary.length === 0}
                  className="px-3.5 py-2 bg-white dark:bg-dark-800 disabled:opacity-40 border border-[#e3e3de] dark:border-dark-600 rounded-xl text-xs font-bold text-[#1a1c19] dark:text-white flex items-center gap-1.5 shadow-sm"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  <span>Undo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBoundary([])}
                  disabled={boundary.length === 0}
                  className="px-3.5 py-2 bg-white dark:bg-dark-800 disabled:opacity-40 border border-[#e3e3de] dark:border-dark-600 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5 shadow-sm"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveStep(3)}
                  disabled={boundary.length < 3}
                  className="px-5 py-2 bg-[#17341c] disabled:bg-gray-400 hover:bg-[#2d4b31] text-white text-xs font-bold rounded-xl shadow flex items-center gap-1.5 transition-all"
                >
                  <span>Confirm Boundary &amp; Next</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Main Canvas: Map + Form Grid ───────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Interactive Map (8 Cols) */}
          <div className="lg:col-span-8 bg-white dark:bg-dark-800 rounded-3xl border border-[#e3e3de] dark:border-dark-700 shadow-xl overflow-hidden flex flex-col h-[560px] relative group">
            <FarmMap
              onChange={(coords) => setBoundary(coords)}
              existingBoundary={boundary}
              allowDraw={true}
              readOnly={false}
              centerLat={farmerCoords?.lat || 23.1765}
              centerLon={farmerCoords?.lon || 75.7885}
              farmerLocation={farmerCoords}
              showTelemetryBar={true}
            />

            {/* Floating Fullscreen Trigger Button */}
            <div className="absolute top-4 right-4 z-[1000]">
              <button
                type="button"
                onClick={() => setShowFullscreenDrawer(true)}
                className="px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs flex items-center gap-2 shadow-2xl shadow-emerald-500/40 transition-all hover:scale-105 cursor-pointer"
              >
                <Maximize2 className="w-4 h-4" />
                <span>Fullscreen Draw Mode</span>
              </button>
            </div>
          </div>

          {/* Configuration Form (4 Cols) */}
          <div className="lg:col-span-4 bg-white dark:bg-dark-800 rounded-3xl border border-[#e3e3de] dark:border-dark-700 shadow-xl p-6 flex flex-col justify-between h-auto">
            <form onSubmit={handleRegisterAndAnalyze} className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-[#f4f4ee] dark:border-dark-700">
                <Wheat className="w-5 h-5 text-[#17341c] dark:text-emerald-400" />
                <h3 className="text-base font-bold text-[#1a1c19] dark:text-white">
                  Field &amp; Crop Configuration
                </h3>
              </div>

              {/* Field Name */}
              <div>
                <label className="block text-xs font-bold text-[#424841] dark:text-slate-300 mb-1">
                  Field / Parcel Name
                </label>
                <input
                  type="text"
                  value={farmName}
                  onChange={(e) => setFarmName(e.target.value)}
                  placeholder="e.g. North Acre Wheat Plot"
                  className="w-full bg-[#f4f4ee] dark:bg-dark-900 border border-[#e3e3de] dark:border-dark-700 rounded-xl px-3.5 py-2.5 text-xs text-[#1a1c19] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#17341c] dark:focus:ring-emerald-500"
                />
              </div>

              {/* Crop Selector */}
              <div>
                <label className="block text-xs font-bold text-[#424841] dark:text-slate-300 mb-1">
                  Crop Type
                </label>
                <select
                  value={cropType}
                  onChange={(e) => setCropType(e.target.value)}
                  className="w-full bg-[#f4f4ee] dark:bg-dark-900 border border-[#e3e3de] dark:border-dark-700 rounded-xl px-3.5 py-2.5 text-xs text-[#1a1c19] dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-[#17341c] dark:focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="wheat">🌾 Wheat (Rabi Crop)</option>
                  <option value="soybean">🌱 Soybean (Kharif Crop)</option>
                  <option value="cotton">🌿 Cotton (Cash Crop)</option>
                  <option value="rice">🌾 Paddy Rice (Kharif)</option>
                  <option value="corn">🌽 Maize / Corn</option>
                  <option value="mustard">🌻 Mustard Seed</option>
                </select>
              </div>

              {/* Sowing Date */}
              <div>
                <label className="block text-xs font-bold text-[#424841] dark:text-slate-300 mb-1">
                  Sowing / Planting Date
                </label>
                <input
                  type="date"
                  value={sowingDate}
                  onChange={(e) => setSowingDate(e.target.value)}
                  required
                  className="w-full bg-[#f4f4ee] dark:bg-dark-900 border border-[#e3e3de] dark:border-dark-700 rounded-xl px-3.5 py-2.5 text-xs text-[#1a1c19] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#17341c] dark:focus:ring-emerald-500"
                />
              </div>

              {/* Insurance Policy Tier */}
              <div>
                <label className="block text-xs font-bold text-[#424841] dark:text-slate-300 mb-1">
                  Zero-Knowledge Parametric Policy
                </label>
                <select
                  value={policyId}
                  onChange={(e) => setPolicyId(e.target.value)}
                  className="w-full bg-[#f4f4ee] dark:bg-dark-900 border border-[#e3e3de] dark:border-dark-700 rounded-xl px-3.5 py-2.5 text-xs text-[#1a1c19] dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-[#17341c] dark:focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="POLICY-001">POLICY-001 (Drought &amp; Heatwave Index)</option>
                  <option value="POLICY-002">POLICY-002 (Multi-Spectral Comprehensive)</option>
                  <option value="POLICY-003">POLICY-003 (Flood &amp; Excess Moisture)</option>
                </select>
              </div>

              {/* Telemetry Summary Box */}
              <div className="bg-[#f4f4ee] dark:bg-dark-900 p-4 rounded-2xl border border-[#e3e3de] dark:border-dark-700 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-[#737971]">Cadastral Points:</span>
                  <span className="font-mono font-bold text-[#17341c] dark:text-emerald-400">
                    {boundary.length} Vertices
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#737971]">Computed Parcel Area:</span>
                  <span className="font-mono font-bold text-[#17341c] dark:text-emerald-400">
                    {computedAreaHa > 0 ? `${computedAreaHa} ha` : 'Pending boundary'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#737971]">ZK Proof Engine:</span>
                  <span className="font-mono text-[11px] font-bold text-[#805533] dark:text-amber-300">
                    Groth16 (BN128)
                  </span>
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || boundary.length < 3}
                  className="w-full py-3.5 px-4 bg-[#17341c] hover:bg-[#2d4b31] disabled:bg-gray-400 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold text-xs rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                >
                  <Activity className={`w-4 h-4 text-[#c8ecc8] ${isSubmitting ? 'animate-spin' : ''}`} />
                  <span>
                    {isSubmitting
                      ? 'Launching Satellite Analysis...'
                      : boundary.length < 3
                      ? 'Mark at least 3 points on map'
                      : '🚀 Save Boundary & Run Satellite Analysis'}
                  </span>
                </button>
              </div>
            </form>
          </div>

        </div>

      </main>

      {/* ── FULLSCREEN FIELD DRAWER MODAL ───────────────────────────────── */}
      <FullscreenFieldDrawer
        isOpen={showFullscreenDrawer}
        initialBoundary={boundary}
        centerLat={farmerCoords?.lat || 23.1765}
        centerLon={farmerCoords?.lon || 75.7885}
        farmerLocation={farmerCoords}
        farmName={farmName}
        onConfirm={(coords) => {
          setBoundary(coords);
          setShowFullscreenDrawer(false);
          setActiveStep(2);
        }}
        onClose={() => setShowFullscreenDrawer(false)}
      />
    </div>
  );
}
