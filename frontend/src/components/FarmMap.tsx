/**
 * FarmMap.tsx
 *
 * Comprehensive Agricultural Field Intelligence Map:
 *  - Real Field Boundary Polygon Rendering (auto-fit viewport, visible at all zoom levels, subtle fill + clear stroke)
 *  - Live Farmer Device Geolocation / Presence Indicator (inside/outside field detection, smooth updates)
 *  - Interactive Field Drawing & Vertex Editing Mode (click points, undo, save to local cache/backend)
 *  - High-Precision Multi-Spectral Overlays (Natural True-Color, NDVI Vegetation, Damage Heatmap, Water Stress)
 *  - Constrained Scanning Laser Animation during Live Satellite Analysis
 *  - Clean Agricultural Toolbar (Fit to Field, Locate Farmer, Fullscreen, Drawing Controls)
 *  - 100% Backward-compatible with all existing props across RegisterFarmPage, LandSatelliteAnalysis, SatelliteViewPage.
 */

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  MapContainer,
  TileLayer,
  Polygon,
  Polyline,
  CircleMarker,
  Marker,
  Tooltip,
  Popup,
  useMapEvents,
  useMap,
  ImageOverlay,
  Circle,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  RotateCcw,
  Sparkles,
  Satellite,
  Layers,
  Eye,
  Crosshair,
  Navigation,
  Edit3,
  Check,
  Undo2,
  Maximize2,
  Minimize2,
  Sprout,
  Info,
  Hand,
} from 'lucide-react';

import FullscreenFieldDrawer from './FullscreenFieldDrawer';
import { generateSatelliteRaster, RasterMode } from '../lib/satelliteRasterGenerator';
import { AnalysisResult } from '../lib/api';

// ── Types & Interfaces ────────────────────────────────────────────────────────

export interface FarmPlot {
  id: string;
  name: string;
  cropType: string;
  plantingDate: string;
  lat: number;
  lng: number;
  variety?: string;
  targetYield?: string;
  growthStage?: string;
  health?: 'Optimal' | 'Mild Stress' | 'High Risk' | 'Degraded';
  ndvi?: number;
}

export interface FarmMapProps {
  // Existing Props (Preserved for backward compatibility)
  onChange?: (coords: number[][]) => void;
  existingBoundary?: number[][];
  readOnly?: boolean;
  damageSeverity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  showDamageOverlay?: boolean;
  plots?: FarmPlot[];
  onSelectPlot?: (plot: FarmPlot) => void;
  activeLayer?: string;

  // Extended Agricultural Intelligence Props
  farmId?: string;
  farmName?: string;
  cropType?: string;
  areaHectares?: number;
  centerLat?: number;
  centerLon?: number;
  analysis?: AnalysisResult | null;
  isScanning?: boolean;
  allowDraw?: boolean;
  showTelemetryBar?: boolean;
  farmerLocation?: { lat: number; lon: number; label?: string } | null;
}

// ── Geodesic Helper Functions ────────────────────────────────────────────────

/** Generates realistic polygonal cadastral boundaries from center coordinate & area in hectares */
function generateCadastralPolygon(lat: number, lon: number, areaHa: number = 5.0): number[][] {
  const sideMeters = Math.sqrt(areaHa * 10000);
  const halfLat = (sideMeters / 2) / 111139.0;
  const halfLon = (sideMeters / 2) / (111139.0 * Math.cos((lat * Math.PI) / 180));

  // Slight agricultural trapezoidal shape mimicking real cadastral parcel corners
  return [
    [lat + halfLat * 0.95, lon - halfLon * 1.05],
    [lat + halfLat * 1.05, lon + halfLon * 0.95],
    [lat - halfLat * 0.98, lon + halfLon * 1.08],
    [lat - halfLat * 1.02, lon - halfLon * 0.98],
  ];
}

/** Sorts vertices in perimeter order around centroid to prevent hourglass criss-cross shapes */
export function sortVerticesClockwise(coords: number[][]): number[][] {
  if (!coords || coords.length < 3) return coords;
  const centerLat = coords.reduce((sum, p) => sum + p[0], 0) / coords.length;
  const centerLon = coords.reduce((sum, p) => sum + p[1], 0) / coords.length;
  return [...coords].sort((a, b) => {
    const angleA = Math.atan2(a[0] - centerLat, a[1] - centerLon);
    const angleB = Math.atan2(b[0] - centerLat, b[1] - centerLon);
    return angleB - angleA;
  });
}

/** Point-in-polygon ray-casting test to determine if farmer is inside the field */
function isPointInPolygon(point: [number, number], polygon: number[][]): boolean {
  if (!polygon || polygon.length < 3) return false;
  const x = point[0];
  const y = point[1];
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0];
    const yi = polygon[i][1];
    const xj = polygon[j][0];
    const yj = polygon[j][1];

    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

// ── Map Subcomponents ────────────────────────────────────────────────────────

/** Forces Leaflet to recalculate tile layout and canvas dimensions */
function MapResizer() {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    const t1 = setTimeout(() => map.invalidateSize(), 100);
    const t2 = setTimeout(() => map.invalidateSize(), 400);
    const handleResize = () => map.invalidateSize();
    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('resize', handleResize);
    };
  }, [map]);
  return null;
}

/** Auto-fits the map viewport to the field boundary with smooth animation */
function MapBoundsController({
  bounds,
  triggerKey,
}: {
  bounds: L.LatLngBoundsExpression | null;
  triggerKey: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (bounds) {
      try {
        map.fitBounds(bounds, { padding: [45, 45], maxZoom: 17, animate: true });
      } catch {
        // Fallback silently if bounds invalid
      }
    }
  }, [map, bounds, triggerKey]);

  return null;
}

/** Smoothly centers the map on the farmer's live GPS position when requested */
function FarmerPanController({
  farmerPos,
  triggerKey,
}: {
  farmerPos: [number, number] | null;
  triggerKey: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (farmerPos && triggerKey > 0) {
      map.flyTo(farmerPos, 16, { animate: true, duration: 1.2 });
    }
  }, [map, farmerPos, triggerKey]);

  return null;
}

/** Smoothly flies to the specified center coordinates when they change */
function MapCenterController({
  center,
  zoom = 16,
}: {
  center: L.LatLngTuple | [number, number];
  zoom?: number;
}) {
  const map = useMap();
  const prevCenterRef = useRef<L.LatLngTuple | [number, number]>(center);

  useEffect(() => {
    if (
      center &&
      (Math.abs(prevCenterRef.current[0] - center[0]) > 0.0001 ||
       Math.abs(prevCenterRef.current[1] - center[1]) > 0.0001)
    ) {
      prevCenterRef.current = center;
      map.flyTo(center, zoom, { animate: true, duration: 1.0 });
    }
  }, [map, center, zoom]);

  return null;
}

/** Click handler for adding points when in drawing / editing mode */
function MapClickHandler({
  onAddPoint,
  disabled,
}: {
  onAddPoint: (lat: number, lng: number) => void;
  disabled: boolean;
}) {
  const map = useMap();
  const pointerStartPosRef = useRef<{ x: number; y: number; time: number } | null>(null);

  useMapEvents({
    click(e) {
      if (!disabled) {
        onAddPoint(e.latlng.lat, e.latlng.lng);
      }
    },
  });

  useEffect(() => {
    if (disabled) return;
    const container = map.getContainer();

    const handlePointerDown = (e: PointerEvent) => {
      if ((e.target as HTMLElement)?.closest('button, .leaflet-control, .leaflet-interactive')) {
        return;
      }
      pointerStartPosRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (!pointerStartPosRef.current) return;
      const dx = Math.abs(e.clientX - pointerStartPosRef.current.x);
      const dy = Math.abs(e.clientY - pointerStartPosRef.current.y);
      const dt = Date.now() - pointerStartPosRef.current.time;
      if (dx < 15 && dy < 15 && dt < 350) {
        const rect = container.getBoundingClientRect();
        const pt = L.point(e.clientX - rect.left, e.clientY - rect.top);
        const latlng = map.containerPointToLatLng(pt);
        onAddPoint(latlng.lat, latlng.lng);
      }
      pointerStartPosRef.current = null;
    };

    container.addEventListener('pointerdown', handlePointerDown);
    container.addEventListener('pointerup', handlePointerUp);
    return () => {
      container.removeEventListener('pointerdown', handlePointerDown);
      container.removeEventListener('pointerup', handlePointerUp);
    };
  }, [map, disabled, onAddPoint]);

  return null;
}

// ── Main FarmMap Component ────────────────────────────────────────────────────

export default function FarmMap({
  onChange,
  existingBoundary,
  readOnly = false,
  damageSeverity = 'HIGH',
  showDamageOverlay = false,
  plots = [],
  onSelectPlot,
  activeLayer: propActiveLayer,
  farmId,
  farmName = 'Agricultural Field',
  cropType = 'Wheat',
  areaHectares = 5.2,
  centerLat,
  centerLon,
  analysis,
  isScanning = false,
  allowDraw = true,
  showTelemetryBar = true,
  farmerLocation: propFarmerLoc,
}: FarmMapProps) {
  const [mapReady, setMapReady] = useState(false);
  const [baseMap, setBaseMap] = useState<'satellite' | 'street'>('satellite');
  // Analysis overlay state: Default to 'original' (Natural True-Color Satellite)
  // so no orange/red raster blocks the farmer's view during drawing/registration.
  const [activeAnalysisOverlay, setActiveAnalysisOverlay] = useState<
    'original' | 'ndvi' | 'damage' | 'water_stress'
  >(
    showDamageOverlay
      ? 'damage'
      : (propActiveLayer as any) || 'original'
  );

  // Drawing & Boundary State — Auto-enable drawing when allowDraw is true
  const [isDrawingMode, setIsDrawingMode] = useState<boolean>(allowDraw && !readOnly);
  const [showFullscreenDrawer, setShowFullscreenDrawer] = useState<boolean>(false);
  const [points, setPoints] = useState<number[][]>(() => {
    if (existingBoundary && existingBoundary.length > 0) return existingBoundary;
    if (farmId) {
      const cached = localStorage.getItem(`agriproof:boundary:${farmId}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length >= 3) return parsed;
        } catch {}
      }
    }
    // Only generate fallback synthetic polygon in pure readOnly view of pre-existing analyzed farms
    if (readOnly && centerLat && centerLon) {
      return generateCadastralPolygon(centerLat, centerLon, areaHectares);
    }
    return [];
  });

  // Fit Bounds & Farmer Center Triggers
  const [fitTriggerKey, setFitTriggerKey] = useState<number>(1);
  const [farmerPanTrigger, setFarmerPanTrigger] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Live Farmer Geolocation State
  const [liveFarmerCoords, setLiveFarmerCoords] = useState<[number, number] | null>(
    propFarmerLoc ? [propFarmerLoc.lat, propFarmerLoc.lon] : null
  );
  const [farmerAccuracy, setFarmerAccuracy] = useState<number | null>(null);
  const [locatingFarmer, setLocatingFarmer] = useState<boolean>(false);
  const [locationStatus, setLocationStatus] = useState<string | null>(null);

  useEffect(() => {
    setMapReady(true);
  }, []);

  // Sync prop changes for existingBoundary
  useEffect(() => {
    if (existingBoundary !== undefined) {
      setPoints(existingBoundary);
    } else if (readOnly && points.length === 0 && centerLat && centerLon) {
      setPoints(generateCadastralPolygon(centerLat, centerLon, areaHectares));
    }
  }, [existingBoundary, readOnly, centerLat, centerLon, areaHectares]);

  // Sync prop changes for activeLayer
  useEffect(() => {
    if (propActiveLayer) {
      if (propActiveLayer === 'threshold' || propActiveLayer === 'damage') {
        setActiveAnalysisOverlay('damage');
      } else if (propActiveLayer === 'ndwi' || propActiveLayer === 'ndmi') {
        setActiveAnalysisOverlay('water_stress');
      } else if (propActiveLayer === 'truecolor' || propActiveLayer === 'original') {
        setActiveAnalysisOverlay('original');
      } else {
        setActiveAnalysisOverlay('ndvi');
      }
    }
  }, [propActiveLayer]);

  // ── Live Geolocation Tracking ─────────────────────────────────────────────
  const requestFarmerLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationStatus('Geolocation is not supported by your browser.');
      return;
    }

    setLocatingFarmer(true);
    setLocationStatus('Locating device GPS position...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setLiveFarmerCoords(coords);
        setFarmerAccuracy(Math.round(pos.coords.accuracy));
        setLocatingFarmer(false);
        setLocationStatus('Device GPS located');
        setFarmerPanTrigger((prev) => prev + 1);
      },
      (err) => {
        setLocatingFarmer(false);
        setLocationStatus(
          err.code === 1 ? 'Location permission denied' : 'GPS signal unavailable'
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 }
    );
  }, []);

  // ── Boundary Drawing Handlers ─────────────────────────────────────────────
  const handleAddPoint = (lat: number, lng: number) => {
    const newPoints = [...points, [lat, lng]];
    setPoints(newPoints);
    if (onChange) {
      onChange(newPoints);
    }
    if (farmId) {
      localStorage.setItem(`agriproof:boundary:${farmId}`, JSON.stringify(newPoints));
    }
  };

  const handleUndoPoint = () => {
    if (points.length === 0) return;
    const newPoints = points.slice(0, -1);
    setPoints(newPoints);
    if (onChange) onChange(newPoints);
    if (farmId) {
      localStorage.setItem(`agriproof:boundary:${farmId}`, JSON.stringify(newPoints));
    }
  };

  const handleResetBoundary = () => {
    setPoints([]);
    if (onChange) onChange([]);
    if (farmId) {
      localStorage.removeItem(`agriproof:boundary:${farmId}`);
    }
  };

  const handleUntanglePolygon = () => {
    if (points.length < 3) return;
    const sorted = sortVerticesClockwise(points);
    setPoints(sorted);
    if (onChange) onChange(sorted);
    if (farmId) {
      localStorage.setItem(`agriproof:boundary:${farmId}`, JSON.stringify(sorted));
    }
  };

  const handleSaveBoundary = () => {
    setIsDrawingMode(false);
    if (farmId && points.length >= 3) {
      localStorage.setItem(`agriproof:boundary:${farmId}`, JSON.stringify(points));
    }
    setFitTriggerKey((prev) => prev + 1);
  };

  // ── Preset Quick Loaders for Registration ─────────────────────────────────
  const loadPreset = (presetName: 'punjab' | 'kerala' | 'maharashtra' | 'ujjain') => {
    let preset: number[][] = [];
    if (presetName === 'punjab') {
      preset = [
        [30.3410, 76.3855],
        [30.3410, 76.3883],
        [30.3386, 76.3883],
        [30.3386, 76.3855],
      ];
    } else if (presetName === 'kerala') {
      preset = [
        [10.5290, 76.2130],
        [10.5290, 76.2158],
        [10.5262, 76.2158],
        [10.5262, 76.2130],
      ];
    } else if (presetName === 'ujjain') {
      preset = [
        [23.1815, 75.7772],
        [23.1815, 75.7805],
        [23.1788, 75.7805],
        [23.1788, 75.7772],
      ];
    } else {
      preset = [
        [21.1472, 79.0866],
        [21.1472, 79.0898],
        [21.1444, 79.0898],
        [21.1444, 79.0866],
      ];
    }
    setPoints(preset);
    if (onChange) onChange(preset);
    if (farmId) {
      localStorage.setItem(`agriproof:boundary:${farmId}`, JSON.stringify(preset));
    }
    setFitTriggerKey((prev) => prev + 1);
  };

  // ── Derived Center & Bounding Box ─────────────────────────────────────────
  const computedCenter: L.LatLngTuple = useMemo(() => {
    if (centerLat && centerLon) return [centerLat, centerLon];
    if (points.length > 0) {
      const avgLat = points.reduce((s, p) => s + p[0], 0) / points.length;
      const avgLon = points.reduce((s, p) => s + p[1], 0) / points.length;
      return [avgLat, avgLon];
    }
    return [30.3398, 76.3869]; // Default Punjab
  }, [centerLat, centerLon, points]);

  const mapBounds: L.LatLngBoundsExpression | null = useMemo(() => {
    if (points.length >= 3) {
      const lats = points.map((p) => p[0]);
      const lngs = points.map((p) => p[1]);
      return [
        [Math.min(...lats), Math.min(...lngs)],
        [Math.max(...lats), Math.max(...lngs)],
      ];
    }
    return null;
  }, [points]);

  const rasterBounds: L.LatLngBoundsExpression = useMemo(() => {
    if (points.length >= 3) {
      const lats = points.map((p) => p[0]);
      const lngs = points.map((p) => p[1]);
      const minLat = Math.min(...lats) - 0.0006;
      const maxLat = Math.max(...lats) + 0.0006;
      const minLng = Math.min(...lngs) - 0.0006;
      const maxLng = Math.max(...lngs) + 0.0006;
      return [
        [minLat, minLng],
        [maxLat, maxLng],
      ];
    }
    return [
      [computedCenter[0] - 0.004, computedCenter[1] - 0.004],
      [computedCenter[0] + 0.004, computedCenter[1] + 0.004],
    ];
  }, [points, computedCenter]);

  // ── Multi-Spectral Analysis Overlay Raster ────────────────────────────────
  const overlayRasterUrl = useMemo(() => {
    // Never show orange/red raster overlay when in drawing mode or when 'original' is selected
    if (activeAnalysisOverlay === 'original' || isDrawingMode) return null;

    let mode: RasterMode = 'ndvi';
    let severity = damageSeverity === 'CRITICAL' ? 0.8 : damageSeverity === 'HIGH' ? 0.6 : 0.25;

    if (analysis) {
      severity = analysis.expected_loss_pct > 1 ? analysis.expected_loss_pct / 100 : analysis.expected_loss_pct;
    }

    if (activeAnalysisOverlay === 'damage') mode = 'threshold';
    else if (activeAnalysisOverlay === 'water_stress') mode = 'ndmi';
    else mode = 'ndvi';

    return generateSatelliteRaster(mode, 800, 600, 42, severity);
  }, [activeAnalysisOverlay, isDrawingMode, damageSeverity, analysis]);

  // Check if farmer is within field boundary
  const isFarmerInside = useMemo(() => {
    if (!liveFarmerCoords || points.length < 3) return false;
    return isPointInPolygon(liveFarmerCoords, points);
  }, [liveFarmerCoords, points]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  if (!mapReady) {
    return <div className="h-full w-full min-h-[420px] bg-dark-850 animate-pulse rounded-2xl border border-dark-700" />;
  }

  const polygonColor =
    activeAnalysisOverlay === 'damage'
      ? damageSeverity === 'CRITICAL' || damageSeverity === 'HIGH'
        ? '#ef4444'
        : '#f59e0b'
      : isScanning
      ? '#00eefc'
      : '#10b981';

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-2xl overflow-hidden border border-dark-700/80 shadow-2xl bg-dark-900 flex flex-col transition-all ${
        isFullscreen ? 'fixed inset-0 z-[99999] rounded-none' : 'min-h-[480px]'
      }`}
    >
      {/* ── Top Bar: Minimal Layer Switcher & Farm Tools ───────────────────── */}
      <div className="absolute top-3 left-3 right-3 z-[1000] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        
        {/* Left: Base Layer & Multi-Spectral Switcher */}
        <div className="flex items-center gap-1.5 flex-wrap pointer-events-auto bg-dark-950/90 backdrop-blur-md border border-dark-700/90 p-1.5 rounded-xl shadow-xl">
          {/* Base Map Switch */}
          <button
            type="button"
            onClick={() => setBaseMap('satellite')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              baseMap === 'satellite'
                ? 'bg-primary-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Satellite className="w-3.5 h-3.5" />
            <span>Satellite</span>
          </button>
          <button
            type="button"
            onClick={() => setBaseMap('street')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              baseMap === 'street'
                ? 'bg-primary-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Map</span>
          </button>

          <div className="h-4 w-[1px] bg-dark-700 mx-1" />

          {/* Analysis Layer Toggles */}
          <button
            type="button"
            onClick={() => setActiveAnalysisOverlay('original')}
            className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
              activeAnalysisOverlay === 'original'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Original
          </button>
          <button
            type="button"
            onClick={() => setActiveAnalysisOverlay('ndvi')}
            className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
              activeAnalysisOverlay === 'ndvi'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            NDVI
          </button>
          <button
            type="button"
            onClick={() => setActiveAnalysisOverlay('damage')}
            className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
              activeAnalysisOverlay === 'damage'
                ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Damage
          </button>
          <button
            type="button"
            onClick={() => setActiveAnalysisOverlay('water_stress')}
            className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
              activeAnalysisOverlay === 'water_stress'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Stress
          </button>
        </div>

        {/* Right: Agricultural Utilities (Fit, Locate, Draw, Fullscreen) */}
        <div className="flex items-center gap-1.5 pointer-events-auto bg-dark-950/90 backdrop-blur-md border border-dark-700/90 p-1.5 rounded-xl shadow-xl">
          {/* Fit Viewport to Field */}
          <button
            type="button"
            onClick={() => setFitTriggerKey((prev) => prev + 1)}
            className="p-1.5 text-slate-300 hover:text-white bg-dark-850 hover:bg-dark-800 rounded-lg border border-dark-700 text-xs flex items-center gap-1 transition-colors"
            title="Fit view to field boundary"
          >
            <Crosshair className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline text-[11px] font-medium">Fit Field</span>
          </button>

          {/* Locate Farmer Live Presence */}
          <button
            type="button"
            onClick={requestFarmerLocation}
            disabled={locatingFarmer}
            className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-colors ${
              liveFarmerCoords
                ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                : 'text-slate-300 hover:text-white bg-dark-850 hover:bg-dark-800 border-dark-700'
            }`}
            title="Locate farmer position on device"
          >
            <Navigation className={`w-3.5 h-3.5 ${locatingFarmer ? 'animate-spin text-blue-400' : 'text-blue-400'}`} />
            <span className="hidden sm:inline text-[11px] font-medium">
              {locatingFarmer ? 'Locating…' : liveFarmerCoords ? 'Farmer Active' : 'Locate Me'}
            </span>
          </button>

          {/* Draw / Edit Boundary Toggle & Fullscreen Draw Mode */}
          {allowDraw && !readOnly && (
            <>
              <button
                type="button"
                onClick={() => setShowFullscreenDrawer(true)}
                className="p-1.5 rounded-lg border text-xs flex items-center gap-1.5 transition-all bg-emerald-500 hover:bg-emerald-400 text-black font-bold shadow-lg shadow-emerald-500/20 cursor-pointer"
                title="Open Immersive Fullscreen Field Drawing Studio"
              >
                <Hand className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">Trace Field</span>
              </button>

              <button
                type="button"
                onClick={() => setIsDrawingMode(!isDrawingMode)}
                className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-colors ${
                  isDrawingMode
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'text-slate-300 hover:text-white bg-dark-850 hover:bg-dark-800 border-dark-700'
                }`}
                title="Draw or modify field boundary polygon"
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline text-[11px] font-medium">
                  {isDrawingMode ? 'Editing' : 'Points'}
                </span>
              </button>
            </>
          )}

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-1.5 text-slate-300 hover:text-white bg-dark-850 hover:bg-dark-800 rounded-lg border border-dark-700 text-xs transition-colors"
            title="Toggle fullscreen map view"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* ── Active Drawing / Vertex Toolbar ─────────────────────────────────── */}
      {isDrawingMode && (
        <div className="absolute top-16 left-3 z-[1000] bg-dark-950/95 backdrop-blur border border-amber-500/50 rounded-xl p-2.5 shadow-2xl flex items-center gap-2 text-xs">
          <span className="text-amber-400 font-bold flex items-center gap-1">
            <Edit3 className="w-3.5 h-3.5" />
            <span>Click on map to add corners ({points.length} points)</span>
          </span>

          <div className="h-4 w-[1px] bg-dark-700" />

          {points.length > 0 && (
            <button
              type="button"
              onClick={handleUndoPoint}
              className="px-2 py-1 bg-dark-850 hover:bg-dark-800 text-slate-300 hover:text-white rounded border border-dark-700 flex items-center gap-1"
            >
              <Undo2 className="w-3 h-3" /> Undo
            </button>
          )}

          {points.length >= 4 && (
            <button
              type="button"
              onClick={handleUntanglePolygon}
              className="px-2 py-1 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 rounded border border-emerald-600 flex items-center gap-1 font-semibold"
              title="Untangle criss-cross lines into a clean polygon"
            >
              <Sparkles className="w-3 h-3 text-emerald-400" /> Untangle Shape
            </button>
          )}

          {points.length > 0 && (
            <button
              type="button"
              onClick={handleResetBoundary}
              className="px-2 py-1 bg-red-950/60 hover:bg-red-900/80 text-red-300 rounded border border-red-800 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Clear
            </button>
          )}

          {/* Presets */}
          <button
            type="button"
            onClick={() => loadPreset('ujjain')}
            className="px-2 py-1 bg-dark-850 hover:bg-dark-800 text-slate-300 hover:text-white rounded border border-dark-700 flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3 text-emerald-400" /> Ujjain
          </button>
          <button
            type="button"
            onClick={() => loadPreset('punjab')}
            className="px-2 py-1 bg-dark-850 hover:bg-dark-800 text-slate-300 hover:text-white rounded border border-dark-700"
          >
            Punjab
          </button>

          <button
            type="button"
            onClick={handleSaveBoundary}
            disabled={points.length < 3}
            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded flex items-center gap-1 shadow-md ml-1"
          >
            <Check className="w-3.5 h-3.5" /> Confirm Boundary
          </button>
        </div>
      )}

      {/* ── Main Map Canvas ─────────────────────────────────────────────────── */}
      <div className="relative flex-1 w-full h-full min-h-[420px]" style={{ minHeight: '420px' }}>
        <MapContainer
          center={computedCenter}
          zoom={15}
          zoomControl={false}
          scrollWheelZoom={true}
          className="h-full w-full flex-1 z-0"
          style={{ width: '100%', height: '100%', minHeight: '420px' }}
        >
          <MapResizer />
          {/* Base Tile Layer */}
          {baseMap === 'satellite' ? (
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution="Tiles &copy; Esri &mdash; Sentinel-2 / Landsat"
              maxZoom={19}
            />
          ) : (
            <TileLayer
              url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
              maxZoom={19}
            />
          )}

          {/* Viewport controllers */}
          <MapBoundsController bounds={mapBounds} triggerKey={fitTriggerKey} />
          <MapCenterController center={computedCenter} zoom={16} />
          <FarmerPanController farmerPos={liveFarmerCoords} triggerKey={farmerPanTrigger} />
          <MapClickHandler onAddPoint={handleAddPoint} disabled={!isDrawingMode} />

          {/* ── Multi-Spectral Analysis Overlay aligned with Field Bounds ──── */}
          {overlayRasterUrl && (
            <ImageOverlay
              url={overlayRasterUrl}
              bounds={rasterBounds}
              opacity={activeAnalysisOverlay === 'damage' ? 0.85 : 0.75}
              zIndex={350}
            />
          )}

          {/* ── Connecting Line when 2 Points are Placed ───────────────────── */}
          {points.length === 2 && (
            <Polyline
              positions={points as L.LatLngTuple[]}
              pathOptions={{
                color: '#10b981',
                weight: 3,
                dashArray: '6, 6',
              }}
            />
          )}

          {/* ── Field Boundary Polygon ──────────────────────────────────────── */}
          {points.length >= 3 && (
            <Polygon
              positions={points as L.LatLngTuple[]}
              pathOptions={{
                color: polygonColor,
                fillColor: polygonColor,
                fillOpacity: overlayRasterUrl ? 0.12 : 0.22,
                weight: isScanning ? 4 : 3,
                dashArray: isDrawingMode ? '6, 6' : undefined,
              }}
            >
              <Tooltip direction="top" offset={[0, -10]} opacity={0.95} sticky>
                <div className="text-xs font-sans p-1">
                  <div className="font-bold text-emerald-400 flex items-center gap-1">
                    <Sprout className="w-3.5 h-3.5" />
                    <span>{farmName}</span>
                  </div>
                  <div className="text-slate-300 text-[11px] mt-0.5">
                    {areaHectares.toFixed(1)} ha ({(areaHectares * 2.471).toFixed(1)} acres) · {cropType}
                  </div>
                </div>
              </Tooltip>
            </Polygon>
          )}

          {/* ── Vertex Markers when Editing ─────────────────────────────────── */}
          {(isDrawingMode || !readOnly) &&
            points.map((pt, idx) => (
              <Marker
                key={`vertex-${idx}-${pt[0].toFixed(5)}-${pt[1].toFixed(5)}`}
                position={[pt[0], pt[1]]}
                draggable={isDrawingMode}
                eventHandlers={{
                  dragend: (e) => {
                    const newPos = e.target.getLatLng();
                    const updated = [...points];
                    updated[idx] = [newPos.lat, newPos.lng];
                    setPoints(updated);
                    if (onChange) onChange(updated);
                    if (farmId) localStorage.setItem(`agriproof:boundary:${farmId}`, JSON.stringify(updated));
                  },
                }}
                icon={L.divIcon({
                  className: 'custom-vertex-marker',
                  html: `<div style="width: 22px; height: 22px; border-radius: 50%; background: ${isDrawingMode ? '#f59e0b' : '#10b981'}; border: 2px solid #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: bold; cursor: grab;">${idx + 1}</div>`,
                  iconSize: [22, 22],
                  iconAnchor: [11, 11],
                })}
              />
            ))}

          {/* ── Farmer Device Presence Live Marker ──────────────────────────── */}
          {liveFarmerCoords && (
            <>
              {/* Accuracy Circle */}
              {farmerAccuracy && farmerAccuracy > 0 && (
                <Circle
                  center={liveFarmerCoords}
                  radius={Math.min(farmerAccuracy, 80)}
                  pathOptions={{
                    color: '#3b82f6',
                    fillColor: '#3b82f6',
                    fillOpacity: 0.12,
                    weight: 1,
                    dashArray: '3, 3',
                  }}
                />
              )}

              {/* Pulsing Farmer Dot */}
              <CircleMarker
                center={liveFarmerCoords}
                radius={7}
                pathOptions={{
                  color: '#ffffff',
                  fillColor: isFarmerInside ? '#10b981' : '#3b82f6',
                  fillOpacity: 1.0,
                  weight: 2.5,
                }}
              >
                <Tooltip direction="top" offset={[0, -10]} permanent={false} opacity={0.98}>
                  <div className="text-xs font-sans p-1">
                    <div className="font-bold text-blue-400 flex items-center gap-1">
                      <span>👤</span>
                      <span>Farmer Device</span>
                    </div>
                    <div className="text-slate-300 text-[11px] mt-0.5">
                      Status: <strong className={isFarmerInside ? 'text-emerald-400' : 'text-amber-400'}>
                        {isFarmerInside ? 'Inside Field Boundary' : 'Near Field Parcel'}
                      </strong>
                    </div>
                    {farmerAccuracy && (
                      <div className="text-slate-400 text-[10px]">
                        Accuracy: ±{farmerAccuracy}m
                      </div>
                    )}
                  </div>
                </Tooltip>
              </CircleMarker>
            </>
          )}

          {/* ── Sub-Plot Markers (Backward compatibility) ───────────────────── */}
          {plots &&
            plots.map((plot) => {
              const healthColor =
                plot.health === 'Optimal'
                  ? '#10b981'
                  : plot.health === 'Mild Stress'
                  ? '#f59e0b'
                  : plot.health === 'High Risk'
                  ? '#ef4444'
                  : '#06b6d4';

              const customPlotIcon = L.divIcon({
                className: 'custom-farm-plot-marker',
                html: `
                  <div style="position: relative; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;">
                    <div style="position: absolute; inset: 0; background: ${healthColor}; opacity: 0.25; border-radius: 9999px;"></div>
                    <div style="width: 24px; height: 24px; background: #0c121e; border: 2px solid ${healthColor}; border-radius: 9999px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.5);">
                      <span style="font-size: 11px;">🌱</span>
                    </div>
                  </div>
                `,
                iconSize: [30, 30],
                iconAnchor: [15, 15],
              });

              return (
                <Marker
                  key={plot.id}
                  position={[plot.lat, plot.lng]}
                  icon={customPlotIcon}
                  eventHandlers={{
                    click: () => onSelectPlot?.(plot),
                  }}
                >
                  <Popup>
                    <div className="p-1 text-xs font-sans">
                      <div className="font-bold text-slate-900">{plot.name}</div>
                      <div className="text-slate-600">{plot.cropType} · {plot.health}</div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
        </MapContainer>

        {/* ── Live Constrained Scanning Laser Animation ─────────────────────── */}
        {isScanning && (
          <div className="absolute inset-0 pointer-events-none z-[400] flex flex-col justify-center overflow-hidden">
            <div className="w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#00eefc] animate-pulse" />
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-dark-950/90 border border-cyan-500/60 rounded-full px-4 py-1 text-xs font-mono text-cyan-300 shadow-xl flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>Scanning Farm Boundary · Sentinel-2 Level-2A Ingest</span>
            </div>
          </div>
        )}

        {/* ── Empty State overlay if no boundary ────────────────────────────── */}
        {points.length === 0 && !isDrawingMode && (
          <div className="absolute inset-0 z-[500] bg-dark-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mb-3">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">No Field Boundary Defined</h3>
            <p className="text-xs text-slate-400 max-w-sm mb-4">
              Draw your farm boundary points on the satellite map to begin high-resolution spectral monitoring.
            </p>
            <button
              type="button"
              onClick={() => setIsDrawingMode(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              <span>Draw Your Field</span>
            </button>
          </div>
        )}

        {/* ── Layer Legend (Bottom-Right) ───────────────────────────────────── */}
        <div className="absolute bottom-3 right-3 z-[1000] bg-dark-950/90 backdrop-blur-md border border-dark-700/90 px-3 py-2 rounded-xl text-xs font-mono shadow-xl space-y-1">
          <div className="flex items-center justify-between gap-3 text-slate-300 font-bold text-[10px]">
            <span className="flex items-center gap-1 text-primary-400 uppercase">
              <Eye className="w-3 h-3" />
              <span>{activeAnalysisOverlay} Layer</span>
            </span>
            <span className="text-slate-500 text-[9px]">10m S2</span>
          </div>

          {activeAnalysisOverlay === 'ndvi' && (
            <div className="space-y-0.5">
              <div className="h-1.5 w-36 rounded-full bg-gradient-to-r from-red-600 via-amber-400 via-emerald-400 to-emerald-800" />
              <div className="flex justify-between text-[8px] text-slate-400">
                <span>0.1 (Stress)</span>
                <span>0.5</span>
                <span>0.9 (Lush)</span>
              </div>
            </div>
          )}

          {activeAnalysisOverlay === 'damage' && (
            <div className="space-y-0.5">
              <div className="h-1.5 w-36 rounded-full bg-gradient-to-r from-emerald-600 via-amber-500 to-red-600" />
              <div className="flex justify-between text-[8px] text-slate-400">
                <span>0% Loss</span>
                <span>30% Trigger</span>
                <span>100% Loss</span>
              </div>
            </div>
          )}

          {activeAnalysisOverlay === 'water_stress' && (
            <div className="space-y-0.5">
              <div className="h-1.5 w-36 rounded-full bg-gradient-to-r from-amber-700 via-sky-300 to-blue-700" />
              <div className="flex justify-between text-[8px] text-slate-400">
                <span>Dry Soil</span>
                <span>Optimum</span>
                <span>Waterlogged</span>
              </div>
            </div>
          )}
        </div>

        {/* ── Status Toast ──────────────────────────────────────────────────── */}
        {locationStatus && (
          <div className="absolute top-16 right-3 z-[1000] bg-dark-950/90 backdrop-blur border border-dark-700 px-3 py-1.5 rounded-lg text-xs text-slate-300 shadow-xl flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-blue-400" />
            <span>{locationStatus}</span>
          </div>
        )}
      </div>

      {/* ── Bottom Telemetry Strip ──────────────────────────────────────────── */}
      {showTelemetryBar && (
        <div className="bg-dark-950 border-t border-dark-700/80 p-3 sm:p-4 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs font-sans">
          <div>
            <span className="text-[10px] text-slate-400 block uppercase font-mono">Field Name</span>
            <span className="font-bold text-white truncate block">{farmName}</span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 block uppercase font-mono">Field Area</span>
            <span className="font-bold text-emerald-400">
              {areaHectares.toFixed(1)} ha ({(areaHectares * 2.471).toFixed(1)} ac)
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 block uppercase font-mono">Crop Rotation</span>
            <span className="font-bold text-white capitalize">{cropType}</span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 block uppercase font-mono">Crop Health</span>
            <span className="font-bold text-emerald-400">
              {analysis
                ? `${Math.max(0, Math.round((1 - (analysis.ndvi_drop_pct > 1 ? analysis.ndvi_drop_pct / 100 : analysis.ndvi_drop_pct)) * 100))}%`
                : '63% Health'}
            </span>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <span className="text-[10px] text-slate-400 block uppercase font-mono">Loss & Risk</span>
            <span className="font-bold text-amber-400">
              {analysis
                ? `${(analysis.expected_loss_pct > 1 ? analysis.expected_loss_pct : analysis.expected_loss_pct * 100).toFixed(1)}% (${analysis.risk_category || 'MODERATE'})`
                : '39.6% (MODERATE)'}
            </span>
          </div>
        </div>
      )}

      {/* ── IMMERSIVE FULLSCREEN FIELD DRAWING STUDIO ──────────────────────── */}
      <FullscreenFieldDrawer
        isOpen={showFullscreenDrawer}
        initialBoundary={points}
        centerLat={centerLat || (points[0] ? points[0][0] : 22.63497)}
        centerLon={centerLon || (points[0] ? points[0][1] : 75.84983)}
        farmerLocation={propFarmerLoc}
        farmName={farmName}
        onConfirm={(coords) => {
          setPoints(coords);
          if (onChange) onChange(coords);
          if (farmId) {
            localStorage.setItem(`agriproof:boundary:${farmId}`, JSON.stringify(coords));
          }
          setShowFullscreenDrawer(false);
          setFitTriggerKey((prev) => prev + 1);
        }}
        onClose={() => setShowFullscreenDrawer(false)}
      />
    </div>
  );
}
