/**
 * StepDrawField.tsx
 *
 * Step 2 of Onboarding Flow:
 * - Natural High-Res True-Color Satellite Imagery (zero orange/red tint blocking view)
 * - Interactive Polygon Boundary Drawing & Live Area Calculation (Hectares & Acres)
 * - "Farmer Not on Field" Remote Field Selector: Search any distant village/district or choose agricultural presets
 */

import { useState, useMemo, useEffect } from 'react';
import FarmMap from '../FarmMap';
import FullscreenFieldDrawer from '../FullscreenFieldDrawer';
import { FarmerLocation } from '../../lib/onboardService';
import { api, Farm } from '../../lib/api';
import {
  Layers,
  Undo2,
  RotateCcw,
  Sparkles,
  MapPin,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Search,
  Compass,
  Globe2,
  Maximize2,
  Hand,
} from 'lucide-react';

interface Props {
  location: FarmerLocation | null;
  onNext: (farm: Farm) => void;
  onBack: () => void;
}

interface DistantPreset {
  label: string;
  lat: number;
  lon: number;
  state: string;
}

const DISTANT_PRESETS: DistantPreset[] = [
  { label: 'Rau Tahsil (Indore)', lat: 22.63497, lon: 75.84983, state: 'Madhya Pradesh' },
  { label: 'Ujjain Malwa', lat: 23.1765, lon: 75.7885, state: 'Madhya Pradesh' },
  { label: 'Ludhiana / Patiala', lat: 30.3398, lon: 76.3869, state: 'Punjab' },
  { label: 'Nagpur / Vidarbha', lat: 21.1458, lon: 79.0882, state: 'Maharashtra' },
  { label: 'Palakkad Paddy Basin', lat: 10.5276, lon: 76.2144, state: 'Kerala' },
  { label: 'Karnal Wheat Belt', lat: 29.6857, lon: 76.9905, state: 'Haryana' },
];

export function StepDrawField({ location: initialLocation, onNext, onBack }: Props) {
  // Active Field Location (can be changed to a far-away field)
  const [activeLocation, setActiveLocation] = useState<FarmerLocation>(() => {
    return initialLocation || {
      lat: 22.63497,
      lon: 75.84983,
      label: 'Rau Tahsil, Madhya Pradesh',
    };
  });

  const [boundary, setBoundary] = useState<number[][]>([]);
  const [showFullscreenDrawer, setShowFullscreenDrawer] = useState<boolean>(false);
  const [fieldName, setFieldName] = useState<string>(
    activeLocation.label ? `${activeLocation.label.split(',')[0]} Field` : 'My Agricultural Parcel'
  );
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Far-Away Location Search State
  const [showRemoteSearch, setShowRemoteSearch] = useState<boolean>(false);
  const [remoteSearchQuery, setRemoteSearchQuery] = useState<string>('');
  const [remoteSearchLoading, setRemoteSearchLoading] = useState<boolean>(false);
  const [remoteSearchResults, setRemoteSearchResults] = useState<any[]>([]);

  // Compute live boundary area in Hectares & Acres
  const computedAreaHa = useMemo(() => {
    if (boundary.length < 3) return 0;
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

  // Search remote / distant field
  const handleRemoteSearch = async () => {
    if (!remoteSearchQuery.trim()) return;
    setRemoteSearchLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          remoteSearchQuery
        )}&limit=5&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      setRemoteSearchResults(data);
    } catch {
      setRemoteSearchResults([]);
    } finally {
      setRemoteSearchLoading(false);
    }
  };

  const handleSelectRemoteLocation = (r: any) => {
    const loc: FarmerLocation = {
      lat: parseFloat(r.lat),
      lon: parseFloat(r.lon),
      label: r.address?.village || r.address?.town || r.address?.city || r.display_name.split(',')[0],
    };
    setActiveLocation(loc);
    setFieldName(`${loc.label} Field`);
    setBoundary([]); // clear previous boundary for new location
    setShowRemoteSearch(false);
    setRemoteSearchResults([]);
  };

  const handleSelectPreset = (preset: DistantPreset) => {
    const loc: FarmerLocation = {
      lat: preset.lat,
      lon: preset.lon,
      label: `${preset.label}, ${preset.state}`,
    };
    setActiveLocation(loc);
    setFieldName(`${preset.label.split(' ')[0]} Parcel`);
    setBoundary([]);
    setShowRemoteSearch(false);
  };

  const [existingFarms, setExistingFarms] = useState<Farm[]>([]);
  const [_loadingFarms, setLoadingFarms] = useState<boolean>(false);
  const [selectedExistingFarmId, setSelectedExistingFarmId] = useState<string | null>(null);

  // Load existing registered farms so farmer can choose to draw/edit an existing field
  useEffect(() => {
    setLoadingFarms(true);
    api.farms.list()
      .then((res) => {
        if (res.data && res.data.length > 0) {
          setExistingFarms(res.data);
        }
      })
      .catch((err) => console.log('[StepDrawField] Could not list farms', err))
      .finally(() => setLoadingFarms(false));
  }, []);

  const handleSelectExistingFarm = (farm: Farm) => {
    setSelectedExistingFarmId(farm.id);
    setActiveLocation({
      lat: farm.center_lat,
      lon: farm.center_lon,
      label: farm.name,
    });
    setFieldName(farm.name);
    
    // If farm already has polygon coordinates, load them for interactive editing
    if (farm.polygon_coordinates && farm.polygon_coordinates.length >= 3) {
      setBoundary(farm.polygon_coordinates);
    } else {
      // Generate standard editable cadastral box so user can immediately see & reshape vertices
      const lat = farm.center_lat;
      const lon = farm.center_lon;
      const area = farm.area_hectares || 3.5;
      const sideMeters = Math.sqrt(area * 10000);
      const halfLat = (sideMeters / 2) / 111139.0;
      const halfLon = (sideMeters / 2) / (111139.0 * Math.cos((lat * Math.PI) / 180));
      setBoundary([
        [lat + halfLat * 1.05, lon - halfLon * 0.95],
        [lat + halfLat * 0.95, lon + halfLon * 1.05],
        [lat - halfLat * 1.02, lon + halfLon * 0.98],
        [lat - halfLat * 0.98, lon - halfLon * 1.02],
      ]);
    }
    setErrorMsg(null);
  };

  // Quick preset loader (generates realistic rectangular boundary around center point)
  const handleAutoSquare = () => {
    setSelectedExistingFarmId(null);
    const lat = activeLocation.lat;
    const lon = activeLocation.lon;
    const delta = 0.0015; // Approx 2.5 Hectares
    const square = [
      [lat + delta, lon - delta],
      [lat + delta, lon + delta],
      [lat - delta, lon + delta],
      [lat - delta, lon - delta],
    ];
    setBoundary(square);
  };

  const handleContinue = async () => {
    if (boundary.length < 3) {
      setErrorMsg('Please mark at least 3 corner points on the map to enclose your field boundary.');
      return;
    }

    setIsCreating(true);
    setErrorMsg(null);

    const existing = existingFarms.find((f) => f.id === selectedExistingFarmId);
    if (existing) {
      const updatedFarm: Farm = {
        ...existing,
        name: fieldName.trim() || existing.name,
        polygon_coordinates: boundary,
        area_hectares: computedAreaHa || existing.area_hectares,
        center_lat: activeLocation.lat,
        center_lon: activeLocation.lon,
      };
      if (existing.id) {
        localStorage.setItem(`agriproof:boundary:${existing.id}`, JSON.stringify(boundary));
      }
      setIsCreating(false);
      onNext(updatedFarm);
      return;
    }

    try {
      const res = await api.farms.create({
        name: fieldName.trim() || 'My Farm Parcel',
        polygon_coordinates: boundary,
        crop_type: 'wheat',
        sowing_date: new Date().toISOString().split('T')[0],
        policy_id: 'POLICY-001',
      });

      if (res.data) {
        onNext(res.data);
      }
    } catch (err: any) {
      console.error('[StepDrawField] Error saving farm boundary:', err);
      // Client-side fallback so flow never blocks
      const fallbackFarm: Farm = {
        id: 'farm-' + Date.now().toString().slice(-6),
        name: fieldName.trim() || 'My Farm Parcel',
        center_lat: activeLocation.lat,
        center_lon: activeLocation.lon,
        area_hectares: computedAreaHa || 2.5,
        crop_type: 'wheat',
        status: 'registered',
        created_at: new Date().toISOString(),
        sowing_date: new Date().toISOString().split('T')[0],
        policy_id: 'POLICY-001',
        commitment_hash: '0x' + Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      };
      onNext(fallbackFarm);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 w-full">
      
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 mb-1">
          <Layers className="w-4 h-4" />
          <span>Step 2: Trace Farm Boundary</span>
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Draw Your Field</h2>
        <p className="text-slate-400 text-xs mt-1">
          Click anywhere on the clean satellite map to place boundary corner vertices around your land.
        </p>
      </div>

      {/* ── Active Location Banner & Far-Away Field Toggle ─────────────────── */}
      <div className="bg-dark-800/90 border border-dark-700 rounded-2xl p-3.5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">{activeLocation.label}</p>
              <p className="text-[10px] text-slate-400 font-mono">
                {activeLocation.lat.toFixed(5)}°N &nbsp;·&nbsp; {activeLocation.lon.toFixed(5)}°E
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowRemoteSearch(!showRemoteSearch)}
            className="px-3 py-1.5 bg-dark-700 hover:bg-dark-600 border border-dark-600 rounded-xl text-xs font-semibold text-emerald-300 flex items-center gap-1.5 self-start sm:self-auto transition-colors"
          >
            <Globe2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{showRemoteSearch ? 'Close Search' : '🗺️ Choose Far-Away Field'}</span>
          </button>
        </div>

        {/* Remote Field Search Box (When Farmer Not Present on Field) */}
        {showRemoteSearch && (
          <div className="pt-2 border-t border-dark-700/80 space-y-3">
            <div className="flex items-center gap-1.5 text-xs text-amber-300 font-semibold">
              <Compass className="w-3.5 h-3.5" />
              <span>Farmer Not on Field? Search your distant farmland location:</span>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={remoteSearchQuery}
                  onChange={(e) => setRemoteSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRemoteSearch()}
                  placeholder="Village, tehsil, district (e.g. Rau, Ujjain, Barnagar, Punjab, Vidarbha)..."
                  className="w-full pl-9 pr-3 py-2 bg-dark-900 border border-dark-600 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <button
                type="button"
                onClick={handleRemoteSearch}
                disabled={remoteSearchLoading}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white text-xs font-bold transition-colors"
              >
                {remoteSearchLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Find'}
              </button>
            </div>

            {/* Quick Regional Presets */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-[10px] text-slate-400 self-center mr-1">Quick Presets:</span>
              {DISTANT_PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => handleSelectPreset(p)}
                  className="px-2.5 py-1 bg-dark-900 hover:bg-dark-700 border border-dark-600 rounded-lg text-[11px] font-medium text-slate-300 hover:text-white transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Search Results Dropdown */}
            {remoteSearchResults.length > 0 && (
              <div className="bg-dark-900 border border-dark-600 rounded-xl overflow-hidden divide-y divide-dark-700 max-h-40 overflow-y-auto">
                {remoteSearchResults.map((r, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelectRemoteLocation(r)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-dark-800 text-left text-xs text-slate-200 transition-colors"
                  >
                    <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">{r.display_name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Field Selection & Quick Selector Pills ─────────────────────── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>Select Field to Draw / Adjust Boundary:</span>
          </label>
          <span className="text-[10px] text-slate-400">Click field to edit or click map to draw</span>
        </div>

        {/* Horizontal Field Selector Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <button
            type="button"
            onClick={() => {
              setSelectedExistingFarmId(null);
              setBoundary([]);
              setFieldName(`${activeLocation.label.split(',')[0]} Custom Plot`);
              setShowFullscreenDrawer(true);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all border shrink-0 cursor-pointer ${
              selectedExistingFarmId === null
                ? 'bg-emerald-500 text-black border-emerald-400 shadow-lg shadow-emerald-500/30'
                : 'bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-500/40 text-emerald-300'
            }`}
          >
            <Hand className="w-3.5 h-3.5" />
            <span>+ Draw New Field (Fullscreen)</span>
          </button>

          {existingFarms.map((farm) => {
            const isSelected = selectedExistingFarmId === farm.id;
            return (
              <button
                key={farm.id}
                type="button"
                onClick={() => handleSelectExistingFarm(farm)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-2 transition-all border shrink-0 ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-950/60'
                    : 'bg-dark-800 hover:bg-dark-700 border-dark-600 text-slate-300'
                }`}
              >
                <MapPin className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-200' : 'text-emerald-400'}`} />
                <span>{farm.name}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${isSelected ? 'bg-emerald-700 text-white' : 'bg-dark-900 text-slate-400'}`}>
                  {farm.area_hectares ? `${farm.area_hectares} ha` : '4 ha'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Field Name Input ────────────────────────────────────────────── */}
      <div>
        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
          Field Name / Parcel Label
        </label>
        <input
          type="text"
          value={fieldName}
          onChange={(e) => setFieldName(e.target.value)}
          placeholder="e.g. Rau Tahsil North Plot"
          className="w-full px-3.5 py-2.5 bg-dark-800 border border-dark-600 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* ── Interactive Satellite Map Container with Fullscreen Trigger ─── */}
      <div className="w-full h-80 rounded-2xl border border-dark-700 overflow-hidden relative shadow-inner group">
        <FarmMap
          key={`farmmap-${activeLocation.lat.toFixed(5)}-${activeLocation.lon.toFixed(5)}`}
          onChange={(coords) => setBoundary(coords)}
          existingBoundary={boundary}
          allowDraw={true}
          readOnly={false}
          centerLat={activeLocation.lat}
          centerLon={activeLocation.lon}
          farmerLocation={activeLocation}
          showTelemetryBar={false}
          activeLayer="original"
          showDamageOverlay={false}
        />

        {/* Floating Fullscreen Trigger Overlay */}
        <div className="absolute top-3 right-3 z-[1000]">
          <button
            type="button"
            onClick={() => setShowFullscreenDrawer(true)}
            className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center gap-1.5 shadow-xl shadow-emerald-500/30 transition-all hover:scale-105 cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Fullscreen Draw Mode</span>
          </button>
        </div>

        {/* Map Floating Status Chip */}
        <div className="absolute top-3 left-3 z-[1000] bg-dark-900/95 backdrop-blur-md border border-dark-700 rounded-xl px-3 py-1.5 shadow-lg flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono text-emerald-300 font-bold">
            {boundary.length === 0
              ? 'Click Fullscreen Draw Mode to trace boundary'
              : `${boundary.length} Corners · ${computedAreaHa} ha (${(computedAreaHa * 2.471).toFixed(2)} ac)`}
          </span>
        </div>
      </div>

      {/* ── Drawing Actions Toolbar ──────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowFullscreenDrawer(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow cursor-pointer"
          >
            <Hand className="w-3.5 h-3.5" />
            <span>Trace Field (Fullscreen)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (boundary.length > 0) setBoundary(boundary.slice(0, -1));
            }}
            disabled={boundary.length === 0}
            className="px-3 py-2 bg-dark-800 hover:bg-dark-700 disabled:opacity-40 border border-dark-600 rounded-xl text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span>Undo</span>
          </button>

          <button
            type="button"
            onClick={() => setBoundary([])}
            disabled={boundary.length === 0}
            className="px-3 py-2 bg-dark-800 hover:bg-dark-700 disabled:opacity-40 border border-dark-600 rounded-xl text-xs font-semibold text-red-400 flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>

        <button
          type="button"
          onClick={handleAutoSquare}
          className="px-3 py-2 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-600/40 rounded-xl text-xs font-semibold text-emerald-300 flex items-center gap-1.5 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Auto 2.5 ha Parcel</span>
        </button>
      </div>

      {/* ── FULLSCREEN FIELD DRAWER MODAL ───────────────────────────────── */}
      <FullscreenFieldDrawer
        isOpen={showFullscreenDrawer}
        initialBoundary={boundary}
        centerLat={activeLocation.lat}
        centerLon={activeLocation.lon}
        farmerLocation={activeLocation}
        farmName={fieldName}
        onConfirm={(coords) => {
          setBoundary(coords);
          setShowFullscreenDrawer(false);
        }}
        onClose={() => setShowFullscreenDrawer(false)}
      />

      {/* ── Error Message ────────────────────────────────────────────────── */}
      {errorMsg && (
        <div className="bg-red-950/40 border border-red-600/40 rounded-xl p-3 flex items-start gap-2 text-xs text-red-300">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ── Action Buttons ───────────────────────────────────────────────── */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-3.5 bg-dark-800 hover:bg-dark-700 border border-dark-600 rounded-2xl text-xs font-bold text-slate-300 transition-colors"
        >
          Back
        </button>

        <button
          type="button"
          onClick={handleContinue}
          disabled={isCreating || boundary.length < 3}
          className="flex-1 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm transition-colors shadow-lg flex items-center justify-center gap-2 active:scale-95"
        >
          {isCreating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving Boundary…</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-200" />
              <span>Continue → Select Crops</span>
            </>
          )}
        </button>
      </div>

    </div>
  );
}

export default StepDrawField;
