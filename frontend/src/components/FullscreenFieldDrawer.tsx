/**
 * FullscreenFieldDrawer.tsx
 *
 * Immersive Fullscreen Agricultural Field Boundary Drawing Studio:
 *  - 100vw x 100dvh full viewport mobile-optimized Leaflet canvas
 *  - Mobile Precision Mode: Center Reticle Crosshair + "📍 Add Corner (Center)" button (pan map with thumb, drop exact corners)
 *  - Mobile Direct Touch: Tap anywhere on satellite map to place vertices with touch-slop detection
 *  - Freehand Finger/Stylus Tracing: Native Pointer & Touch Event stream with RDP path simplification
 *  - Draggable Numbered Vertex Handles (drag corners with thumb, click midpoint '+' to subdivide)
 *  - Quick Presets: "📐 Auto-Shape 2.5 Ha", "🚶 Drop My GPS Pin", "✨ Fix Shape", "↺ Undo", "🗑️ Clear"
 *  - Exact Geodesic Area computation (Hectares & Acres)
 *  - 100% Backward-compatible GeoJSON coordinate output ([lat, lon][])
 */

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  MapContainer,
  TileLayer,
  Polygon,
  Polyline,
  CircleMarker,
  Marker,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Satellite,
  Layers,
  Undo2,
  RotateCcw,
  Check,
  ArrowLeft,
  Sparkles,
  MousePointer,
  Hand,
  Crosshair,
  Plus,
  Navigation,
  HelpCircle,
} from 'lucide-react';

export interface FullscreenFieldDrawerProps {
  isOpen: boolean;
  initialBoundary?: number[][];
  centerLat?: number;
  centerLon?: number;
  farmerLocation?: { lat: number; lon: number; label?: string } | null;
  farmName?: string;
  onConfirm: (coordinates: number[][], areaHectares: number) => void;
  onClose: () => void;
}

// ── Geodesic & Mathematical Algorithms ────────────────────────────────────────

/**
 * Calculates geodesic polygon area in hectares using Shoelace formula with latitude cosine scaling
 */
export function computeGeodesicAreaHectares(coords: number[][]): number {
  if (!coords || coords.length < 3) return 0;
  let area = 0;
  const n = coords.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const lat1 = coords[i][0];
    const lon1 = coords[i][1];
    const lat2 = coords[j][0];
    const lon2 = coords[j][1];
    const x1 = lon1 * 111139.0 * Math.cos((lat1 * Math.PI) / 180.0);
    const y1 = lat1 * 111139.0;
    const x2 = lon2 * 111139.0 * Math.cos((lat2 * Math.PI) / 180.0);
    const y2 = lat2 * 111139.0;
    area += x1 * y2 - x2 * y1;
  }
  const sqMeters = Math.abs(area) / 2.0;
  return parseFloat((sqMeters / 10000.0).toFixed(2));
}

/**
 * Sorts polygon coordinates in clockwise perimeter order around centroid
 */
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

/**
 * Perpendicular distance from a point to a line segment (in degrees)
 */
function perpendicularDistance(
  pt: [number, number],
  lineStart: [number, number],
  lineEnd: [number, number]
): number {
  const dx = lineEnd[1] - lineStart[1];
  const dy = lineEnd[0] - lineStart[0];
  const mag = Math.sqrt(dx * dx + dy * dy);
  if (mag === 0) {
    const pdx = pt[1] - lineStart[1];
    const pdy = pt[0] - lineStart[0];
    return Math.sqrt(pdx * pdx + pdy * pdy);
  }
  const u = ((pt[1] - lineStart[1]) * dx + (pt[0] - lineStart[0]) * dy) / (mag * mag);
  const clampedU = Math.max(0, Math.min(1, u));
  const projY = lineStart[0] + clampedU * dy;
  const projX = lineStart[1] + clampedU * dx;
  const distX = pt[1] - projX;
  const distY = pt[0] - projY;
  return Math.sqrt(distX * distX + distY * distY);
}

/**
 * Ramer-Douglas-Peucker (RDP) geometric simplification algorithm
 */
function ramerDouglasPeucker(
  points: [number, number][],
  epsilon: number
): [number, number][] {
  if (points.length <= 2) return points;
  let dmax = 0;
  let index = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const d = perpendicularDistance(points[i], points[0], points[points.length - 1]);
    if (d > dmax) {
      index = i;
      dmax = d;
    }
  }
  if (dmax > epsilon) {
    const recResults1 = ramerDouglasPeucker(points.slice(0, index + 1), epsilon);
    const recResults2 = ramerDouglasPeucker(points.slice(index), epsilon);
    return recResults1.slice(0, recResults1.length - 1).concat(recResults2);
  } else {
    return [points[0], points[points.length - 1]];
  }
}

/**
 * Filters out duplicate & jittery raw pointer points before RDP simplification
 */
function cleanAndSimplifyRawPath(
  rawPoints: [number, number][],
  epsilon = 0.000035 // ~3.5 meters tolerance in degrees
): number[][] {
  if (rawPoints.length < 3) return rawPoints;

  const minSpacing = 0.00001;
  const deduped: [number, number][] = [rawPoints[0]];
  for (let i = 1; i < rawPoints.length; i++) {
    const last = deduped[deduped.length - 1];
    const curr = rawPoints[i];
    const dist = Math.sqrt(
      Math.pow(curr[0] - last[0], 2) + Math.pow(curr[1] - last[1], 2)
    );
    if (dist >= minSpacing) {
      deduped.push(curr);
    }
  }

  if (deduped.length < 3) return deduped;

  const first = deduped[0];
  const last = deduped[deduped.length - 1];
  const closeDist = Math.sqrt(
    Math.pow(first[0] - last[0], 2) + Math.pow(first[1] - last[1], 2)
  );
  if (closeDist > 0.00001) {
    deduped.push([first[0], first[1]]);
  }

  const simplified = ramerDouglasPeucker(deduped, epsilon);

  if (
    simplified.length > 2 &&
    simplified[0][0] === simplified[simplified.length - 1][0] &&
    simplified[0][1] === simplified[simplified.length - 1][1]
  ) {
    simplified.pop();
  }

  return simplified;
}

// ── Leaflet Controllers ───────────────────────────────────────────────────────

/** Resizes Leaflet tiles to occupy the exact 100vw x 100dvh viewport */
function FullscreenMapResizer() {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    const t1 = setTimeout(() => map.invalidateSize(), 50);
    const t2 = setTimeout(() => map.invalidateSize(), 300);
    const t3 = setTimeout(() => map.invalidateSize(), 600);
    const handleResize = () => map.invalidateSize();
    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      window.removeEventListener('resize', handleResize);
    };
  }, [map]);
  return null;
}

/** Automatically fits the map to the existing polygon boundary on open */
function FullscreenBoundsFitter({ bounds }: { bounds: L.LatLngBoundsExpression | null }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      try {
        map.fitBounds(bounds, { padding: [80, 80], maxZoom: 18, animate: true });
      } catch {}
    }
  }, [map, bounds]);
  return null;
}

/**
 * Mobile-First Touch & Pointer Drawing Controller
 */
interface MobileTouchDrawControllerProps {
  drawMode: 'trace' | 'points' | 'crosshair';
  onTraceStart: (lat: number, lon: number) => void;
  onTraceMove: (lat: number, lon: number) => void;
  onTraceEnd: () => void;
  onAddPoint: (lat: number, lon: number) => void;
  onCenterChange: (lat: number, lon: number) => void;
}

function MobileTouchDrawController({
  drawMode,
  onTraceStart,
  onTraceMove,
  onTraceEnd,
  onAddPoint,
  onCenterChange,
}: MobileTouchDrawControllerProps) {
  const map = useMap();
  const isTracingRef = useRef<boolean>(false);
  const pointerStartPosRef = useRef<{ x: number; y: number; time: number } | null>(null);

  // Sync center when map pans
  useMapEvents({
    move() {
      const c = map.getCenter();
      onCenterChange(c.lat, c.lng);
    },
    click(e) {
      if (drawMode === 'points') {
        onAddPoint(e.latlng.lat, e.latlng.lng);
      }
    },
  });

  // Initial center sync
  useEffect(() => {
    const c = map.getCenter();
    onCenterChange(c.lat, c.lng);
  }, [map, onCenterChange]);

  // Native pointer handlers on map container
  useEffect(() => {
    const container = map.getContainer();

    const handlePointerDown = (e: PointerEvent) => {
      // Ignore clicks on UI buttons/controls
      if ((e.target as HTMLElement)?.closest('button, .leaflet-control, .custom-vertex-handle')) {
        return;
      }

      pointerStartPosRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };

      if (drawMode === 'trace') {
        e.preventDefault();
        map.dragging.disable();
        map.touchZoom.disable();
        map.doubleClickZoom.disable();
        isTracingRef.current = true;
        const rect = container.getBoundingClientRect();
        const pt = L.point(e.clientX - rect.left, e.clientY - rect.top);
        const latlng = map.containerPointToLatLng(pt);
        onTraceStart(latlng.lat, latlng.lng);
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (drawMode === 'trace' && isTracingRef.current) {
        e.preventDefault();
        const rect = container.getBoundingClientRect();
        const pt = L.point(e.clientX - rect.left, e.clientY - rect.top);
        const latlng = map.containerPointToLatLng(pt);
        onTraceMove(latlng.lat, latlng.lng);
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (drawMode === 'trace' && isTracingRef.current) {
        isTracingRef.current = false;
        map.dragging.enable();
        map.touchZoom.enable();
        map.doubleClickZoom.enable();
        onTraceEnd();
      } else if (drawMode === 'points' && pointerStartPosRef.current) {
        const dx = Math.abs(e.clientX - pointerStartPosRef.current.x);
        const dy = Math.abs(e.clientY - pointerStartPosRef.current.y);
        const dt = Date.now() - pointerStartPosRef.current.time;
        // Mobile tap detection (< 15px movement within 350ms)
        if (dx < 15 && dy < 15 && dt < 350) {
          const rect = container.getBoundingClientRect();
          const pt = L.point(e.clientX - rect.left, e.clientY - rect.top);
          const latlng = map.containerPointToLatLng(pt);
          onAddPoint(latlng.lat, latlng.lng);
        }
      }
      pointerStartPosRef.current = null;
    };

    container.addEventListener('pointerdown', handlePointerDown, { passive: false });
    window.addEventListener('pointermove', handlePointerMove, { passive: false });
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      container.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [map, drawMode, onTraceStart, onTraceMove, onTraceEnd, onAddPoint]);

  return null;
}

// ── Main Fullscreen Field Drawer Component ───────────────────────────────────

export default function FullscreenFieldDrawer({
  isOpen,
  initialBoundary = [],
  centerLat = 22.63497,
  centerLon = 75.84983,
  farmerLocation,
  farmName: _farmName = 'My Agricultural Field',
  onConfirm,
  onClose,
}: FullscreenFieldDrawerProps) {
  // Current active polygon vertices: number[][] ([lat, lon])
  const [boundary, setBoundary] = useState<number[][]>(initialBoundary);
  // Live freehand trace points (during active hold & drag)
  const [rawTrace, setRawTrace] = useState<[number, number][]>([]);
  // Drawing state
  const [isTracing, setIsTracing] = useState<boolean>(false);
  const [drawMode, setDrawMode] = useState<'crosshair' | 'points' | 'trace'>('crosshair');
  const [basemap, setBasemap] = useState<'satellite' | 'street'>('satellite');
  // Undo history stack
  const [history, setHistory] = useState<number[][][]>([]);
  // Live viewport center tracking for the mobile crosshair
  const [currentCenter, setCurrentCenter] = useState<[number, number]>([centerLat, centerLon]);
  const [showHelp, setShowHelp] = useState<boolean>(false);

  // Live calculated area
  const areaHa = useMemo(() => computeGeodesicAreaHectares(boundary), [boundary]);
  const areaAcres = useMemo(() => parseFloat((areaHa * 2.47105).toFixed(2)), [areaHa]);

  // Sync initial boundary when modal opens
  useEffect(() => {
    if (isOpen) {
      setBoundary(initialBoundary || []);
      setRawTrace([]);
      setIsTracing(false);
      setHistory(initialBoundary && initialBoundary.length >= 3 ? [initialBoundary] : []);
    }
  }, [isOpen, initialBoundary]);

  // Initial center coordinates
  const mapCenter = useMemo<[number, number]>(() => {
    if (boundary && boundary.length > 0) {
      const avgLat = boundary.reduce((s, p) => s + p[0], 0) / boundary.length;
      const avgLon = boundary.reduce((s, p) => s + p[1], 0) / boundary.length;
      return [avgLat, avgLon];
    }
    if (farmerLocation?.lat && farmerLocation?.lon) {
      return [farmerLocation.lat, farmerLocation.lon];
    }
    return [centerLat, centerLon];
  }, [boundary, farmerLocation, centerLat, centerLon]);

  // Initial bounds if boundary exists
  const initialBounds = useMemo<L.LatLngBoundsExpression | null>(() => {
    if (boundary && boundary.length >= 3) {
      const lats = boundary.map((p) => p[0]);
      const lons = boundary.map((p) => p[1]);
      return [
        [Math.min(...lats), Math.min(...lons)],
        [Math.max(...lats), Math.max(...lons)],
      ];
    }
    return null;
  }, [boundary]);

  // ── Tracing Handlers ───────────────────────────────────────────────────────

  const handleTraceStart = useCallback((lat: number, lon: number) => {
    setIsTracing(true);
    setRawTrace([[lat, lon]]);
  }, []);

  const handleTraceMove = useCallback((lat: number, lon: number) => {
    setRawTrace((prev) => [...prev, [lat, lon]]);
  }, []);

  const handleTraceEnd = useCallback(() => {
    setIsTracing(false);
    setRawTrace((currentRaw) => {
      if (currentRaw.length >= 5) {
        const simplified = cleanAndSimplifyRawPath(currentRaw, 0.000035);
        if (simplified.length >= 3) {
          setHistory((h) => [...h, boundary]);
          setBoundary(simplified);
        }
      }
      return [];
    });
  }, [boundary]);

  // ── "Add Points" / Tap Handler ─────────────────────────────────────────────

  const handleAddPoint = useCallback(
    (lat: number, lon: number) => {
      setHistory((h) => [...h, boundary]);
      setBoundary((prev) => [...prev, [lat, lon]]);
    },
    [boundary]
  );

  // ── "Add Center Point" via Mobile Reticle Crosshair ─────────────────────────

  const handleAddCenterPin = () => {
    setHistory((h) => [...h, boundary]);
    setBoundary((prev) => [...prev, [currentCenter[0], currentCenter[1]]]);
  };

  // ── "Drop My GPS Pin" ───────────────────────────────────────────────────────

  const handleAddFarmerGpsPin = () => {
    if (!farmerLocation?.lat || !farmerLocation?.lon) return;
    setHistory((h) => [...h, boundary]);
    setBoundary((prev) => [...prev, [farmerLocation.lat, farmerLocation.lon]]);
  };

  // ── "Auto-Shape 2.5 Ha" Preset ─────────────────────────────────────────────

  const handleAutoSquare = () => {
    setHistory((h) => [...h, boundary]);
    const lat = currentCenter[0];
    const lon = currentCenter[1];
    const delta = 0.0015; // ~2.5 ha square
    setBoundary([
      [lat + delta * 0.95, lon - delta * 1.05],
      [lat + delta * 1.05, lon + delta * 0.95],
      [lat - delta * 0.98, lon + delta * 1.08],
      [lat - delta * 1.02, lon - delta * 0.98],
    ]);
  };

  // ── Editing & Vertex Manipulation ──────────────────────────────────────────

  const handleUpdateVertex = (idx: number, newLat: number, newLon: number) => {
    setHistory((h) => [...h, boundary]);
    setBoundary((prev) => {
      const next = [...prev];
      next[idx] = [newLat, newLon];
      return next;
    });
  };

  const handleAddMidpoint = (afterIdx: number, midLat: number, midLon: number) => {
    setHistory((h) => [...h, boundary]);
    setBoundary((prev) => {
      const next = [...prev];
      next.splice(afterIdx + 1, 0, [midLat, midLon]);
      return next;
    });
  };

  const handleDeleteVertex = (index: number) => {
    if (boundary.length <= 3) return;
    setHistory((h) => [...h, boundary]);
    setBoundary((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUndo = () => {
    if (history.length > 0) {
      const prev = history[history.length - 1];
      setBoundary(prev);
      setHistory((h) => h.slice(0, h.length - 1));
    } else {
      setBoundary([]);
    }
  };

  const handleUntangle = () => {
    if (boundary.length < 3) return;
    setHistory((h) => [...h, boundary]);
    setBoundary(sortVerticesClockwise(boundary));
  };

  const handleClear = () => {
    if (boundary.length > 0) {
      setHistory((h) => [...h, boundary]);
    }
    setBoundary([]);
    setRawTrace([]);
  };

  const handleConfirm = () => {
    if (boundary.length < 3) return;
    onConfirm(boundary, areaHa);
    onClose();
  };

  // Midpoints computed between adjacent polygon vertices
  const midpoints = useMemo(() => {
    if (boundary.length < 3) return [];
    return boundary.map((pt, i) => {
      const next = boundary[(i + 1) % boundary.length];
      return {
        index: i,
        lat: (pt[0] + next[0]) / 2,
        lon: (pt[1] + next[1]) / 2,
      };
    });
  }, [boundary]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] w-screen h-[100dvh] bg-black overflow-hidden flex flex-col font-sans select-none"
      style={{ touchAction: isTracing ? 'none' : 'auto' }}
    >
      {/* ── TOP FLOATING CONTROL BAR ────────────────────────────────────────── */}
      <header className="absolute top-0 inset-x-0 z-[10000] p-2.5 sm:p-4 flex items-center justify-between pointer-events-none">
        
        {/* Top Left: Exit / Back Button */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl bg-black/80 hover:bg-black/95 text-white border border-white/20 hover:border-white/40 backdrop-blur-md shadow-2xl transition-all flex items-center gap-1.5 text-xs font-semibold group cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-400 group-hover:-translate-x-0.5 transition-transform" />
            <span>Exit</span>
          </button>

          <button
            type="button"
            onClick={() => setShowHelp(!showHelp)}
            className="p-2 rounded-xl bg-black/80 text-white/80 hover:text-white border border-white/20 backdrop-blur-md transition-colors"
            title="How to draw on mobile"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>

        {/* Top Center: Status & Title Pill */}
        <div className="pointer-events-auto flex flex-col items-center">
          <div className="px-3.5 py-1.5 rounded-full bg-black/85 border border-emerald-500/30 backdrop-blur-md shadow-[0_0_20px_rgba(16,185,129,0.2)] flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isTracing
                  ? 'bg-emerald-400 animate-ping'
                  : boundary.length >= 3
                  ? 'bg-emerald-400 shadow-[0_0_8px_#10b981]'
                  : 'bg-amber-400 animate-pulse'
              }`}
            />
            <span className="text-[11px] sm:text-xs font-mono font-bold tracking-wider uppercase text-white">
              {isTracing
                ? '● TRACING FIELD…'
                : boundary.length >= 3
                ? `✓ ${boundary.length} CORNERS · ${areaHa} HA`
                : 'MAP FARM BOUNDARY'}
            </span>
          </div>
        </div>

        {/* Top Right: Basemap & Mode Controls */}
        <div className="pointer-events-auto flex items-center gap-1.5">
          {/* Basemap Toggle */}
          <div className="flex bg-black/80 border border-white/20 rounded-xl p-0.5 backdrop-blur-md">
            <button
              type="button"
              onClick={() => setBasemap('satellite')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all ${
                basemap === 'satellite'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Satellite className="w-3 h-3" />
              <span className="hidden sm:inline">Satellite</span>
            </button>
            <button
              type="button"
              onClick={() => setBasemap('street')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all ${
                basemap === 'street'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span className="hidden sm:inline">Map</span>
            </button>
          </div>

          {/* Draw Mode Switcher */}
          <div className="flex bg-black/80 border border-white/20 rounded-xl p-0.5 backdrop-blur-md">
            <button
              type="button"
              onClick={() => setDrawMode('crosshair')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all ${
                drawMode === 'crosshair'
                  ? 'bg-cyan-500 text-black font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Target with center crosshair (Easy for Mobile)"
            >
              <Crosshair className="w-3 h-3" />
              <span className="hidden sm:inline">Target Reticle</span>
            </button>
            <button
              type="button"
              onClick={() => setDrawMode('points')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all ${
                drawMode === 'points'
                  ? 'bg-emerald-500 text-black font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Tap anywhere on map to add points"
            >
              <MousePointer className="w-3 h-3" />
              <span className="hidden sm:inline">Tap Points</span>
            </button>
            <button
              type="button"
              onClick={() => setDrawMode('trace')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all ${
                drawMode === 'trace'
                  ? 'bg-emerald-500 text-black font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Press and hold to freely trace your field"
            >
              <Hand className="w-3 h-3" />
              <span className="hidden sm:inline">Trace</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── MOBILE INSTRUCTIONS MODAL ──────────────────────────────────────── */}
      {showHelp && (
        <div className="absolute top-16 inset-x-3 sm:inset-x-auto sm:right-4 z-[10001] max-w-sm bg-dark-900/95 border border-emerald-500/40 rounded-2xl p-4 shadow-2xl backdrop-blur-xl space-y-3">
          <div className="flex items-center justify-between text-emerald-400 text-xs font-bold font-mono">
            <span>📱 3 WAYS TO DRAW ON MOBILE:</span>
            <button onClick={() => setShowHelp(false)} className="text-white/60 hover:text-white">✕</button>
          </div>
          <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
            <p><strong>1. Target Reticle (Recommended):</strong> Pan the satellite map under the center reticle `+` and tap <strong>"📍 Drop Corner Pin"</strong>.</p>
            <p><strong>2. Direct Tap:</strong> Tap anywhere on the field corners to drop boundary vertices.</p>
            <p><strong>3. Auto-Shape:</strong> Tap <strong>"📐 Auto 2.5 Ha"</strong> to instantly generate a parcel and drag the numbered green corners to fit your land!</p>
          </div>
        </div>
      )}

      {/* ── CENTER RETICLE CROSSHAIR (Target Mode) ──────────────────────────── */}
      {drawMode === 'crosshair' && (
        <div className="absolute inset-0 z-[5000] flex items-center justify-center pointer-events-none">
          <div className="relative flex items-center justify-center">
            {/* Outer Target Circle */}
            <div className="w-12 h-12 rounded-full border-2 border-cyan-400/80 shadow-[0_0_15px_rgba(0,229,255,0.4)] animate-pulse" />
            {/* Center Dot */}
            <div className="absolute w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00e5ff]" />
            {/* Horizontal & Vertical Crosshairs */}
            <div className="absolute w-6 h-0.5 bg-cyan-400/90" />
            <div className="absolute h-6 w-0.5 bg-cyan-400/90" />
            {/* Reticle Lat/Lon Badge */}
            <div className="absolute -bottom-8 bg-black/80 border border-cyan-500/40 rounded-full px-2.5 py-0.5 text-[9px] font-mono text-cyan-300 backdrop-blur-md shadow whitespace-nowrap">
              {currentCenter[0].toFixed(5)}°, {currentCenter[1].toFixed(5)}°
            </div>
          </div>
        </div>
      )}

      {/* ── FULLSCREEN LEAFLET MAP CONTAINER ────────────────────────────────── */}
      <div className="flex-1 w-full h-full relative cursor-crosshair">
        <MapContainer
          center={mapCenter}
          zoom={17}
          maxZoom={20}
          minZoom={4}
          scrollWheelZoom={!isTracing}
          dragging={!isTracing}
          doubleClickZoom={false}
          zoomControl={false}
          className="w-full h-full z-0"
        >
          <FullscreenMapResizer />
          {initialBounds && <FullscreenBoundsFitter bounds={initialBounds} />}

          {/* Satellite vs Street Tile Layers */}
          {basemap === 'satellite' ? (
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution="Esri World Imagery"
              maxZoom={20}
            />
          ) : (
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              attribution="CartoDB Voyager"
              maxZoom={20}
            />
          )}

          {/* Mobile-First Touch & Pointer Drawing Controller */}
          <MobileTouchDrawController
            drawMode={drawMode}
            onTraceStart={handleTraceStart}
            onTraceMove={handleTraceMove}
            onTraceEnd={handleTraceEnd}
            onAddPoint={handleAddPoint}
            onCenterChange={(lat, lon) => setCurrentCenter([lat, lon])}
          />

          {/* 1. Live Freehand Tracing Line (During Active Hold & Drag) */}
          {rawTrace.length > 1 && (
            <>
              <Polyline
                positions={rawTrace}
                pathOptions={{
                  color: '#10b981',
                  weight: 4,
                  opacity: 0.95,
                  lineJoin: 'round',
                  lineCap: 'round',
                }}
              />
              <Polygon
                positions={rawTrace}
                pathOptions={{
                  fillColor: '#10b981',
                  fillOpacity: 0.20,
                  stroke: false,
                }}
              />
              <CircleMarker
                center={rawTrace[0]}
                radius={8}
                pathOptions={{
                  fillColor: '#10b981',
                  fillOpacity: 1,
                  color: '#ffffff',
                  weight: 2.5,
                }}
              />
            </>
          )}

          {/* 2. Completed & Simplified Field Polygon */}
          {boundary.length >= 3 && !isTracing && (
            <Polygon
              positions={boundary as L.LatLngTuple[]}
              pathOptions={{
                color: '#10b981',
                weight: 3.5,
                opacity: 0.95,
                fillColor: '#10b981',
                fillOpacity: 0.25,
              }}
            />
          )}

          {/* 3. Incomplete Boundary Line (< 3 points) */}
          {boundary.length > 0 && boundary.length < 3 && !isTracing && (
            <Polyline
              positions={boundary as L.LatLngTuple[]}
              pathOptions={{
                color: '#f59e0b',
                weight: 3.5,
                dashArray: '6, 6',
              }}
            />
          )}

          {/* 4. Interactive Draggable Corner Vertices */}
          {boundary.length >= 3 &&
            !isTracing &&
            boundary.map((pt, idx) => (
              <Marker
                key={`vertex-drag-${idx}-${pt[0].toFixed(5)}-${pt[1].toFixed(5)}`}
                position={[pt[0], pt[1]]}
                draggable={true}
                eventHandlers={{
                  dragend: (e) => {
                    const newPos = e.target.getLatLng();
                    handleUpdateVertex(idx, newPos.lat, newPos.lng);
                  },
                  click: (e) => {
                    L.DomEvent.stopPropagation(e);
                    if (boundary.length > 3) {
                      handleDeleteVertex(idx);
                    }
                  },
                }}
                icon={L.divIcon({
                  className: 'custom-vertex-handle',
                  html: `<div style="width: 26px; height: 26px; border-radius: 50%; background: #10b981; border: 2.5px solid #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; color: white; font-size: 11px; font-weight: bold; cursor: grab;">${idx + 1}</div>`,
                  iconSize: [26, 26],
                  iconAnchor: [13, 13],
                })}
              />
            ))}

          {/* 5. Incomplete Single Corner Markers (< 3 points) */}
          {boundary.length < 3 &&
            !isTracing &&
            boundary.map((pt, idx) => (
              <CircleMarker
                key={`pt-${idx}-${pt[0]}-${pt[1]}`}
                center={[pt[0], pt[1]]}
                radius={9}
                pathOptions={{
                  fillColor: '#10b981',
                  fillOpacity: 1,
                  color: '#ffffff',
                  weight: 2.5,
                }}
              />
            ))}

          {/* 6. Midpoint '+' Insertion Handles between adjacent vertices */}
          {boundary.length >= 3 &&
            !isTracing &&
            midpoints.map((mid) => (
              <CircleMarker
                key={`midpoint-${mid.index}-${mid.lat}-${mid.lon}`}
                center={[mid.lat, mid.lon]}
                radius={6}
                pathOptions={{
                  fillColor: '#ffffff',
                  fillOpacity: 0.95,
                  color: '#10b981',
                  weight: 2.5,
                }}
                eventHandlers={{
                  click: (e) => {
                    L.DomEvent.stopPropagation(e);
                    handleAddMidpoint(mid.index, mid.lat, mid.lon);
                  },
                }}
              />
            ))}

          {/* 7. Farmer GPS Device Marker */}
          {farmerLocation?.lat && farmerLocation?.lon && (
            <CircleMarker
              center={[farmerLocation.lat, farmerLocation.lon]}
              radius={9}
              pathOptions={{
                fillColor: '#00e5ff',
                fillOpacity: 1,
                color: '#ffffff',
                weight: 2.5,
              }}
            />
          )}
        </MapContainer>
      </div>

      {/* ── BOTTOM FLOATING ACTION BAR ──────────────────────────────────────── */}
      <footer className="absolute bottom-0 inset-x-0 z-[10000] p-2.5 sm:p-5 flex flex-col gap-2.5 pointer-events-none pb-6 sm:pb-5">
        
        {/* Row 1: Primary Action Buttons (Center Drop Pin & Auto-Shape) */}
        <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-2">
          {drawMode === 'crosshair' && (
            <button
              type="button"
              onClick={handleAddCenterPin}
              className="px-5 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-sm flex items-center gap-2 shadow-2xl shadow-cyan-500/40 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-5 h-5 stroke-[3]" />
              <span>📍 Drop Corner Pin Here</span>
            </button>
          )}

          {boundary.length === 0 && (
            <button
              type="button"
              onClick={handleAutoSquare}
              className="px-4 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 backdrop-blur-md text-xs font-bold flex items-center gap-1.5 shadow-xl transition-all"
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>📐 Auto 2.5 Ha Parcel</span>
            </button>
          )}

          {farmerLocation?.lat && farmerLocation?.lon && (
            <button
              type="button"
              onClick={handleAddFarmerGpsPin}
              className="px-3.5 py-2.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 backdrop-blur-md text-xs font-bold flex items-center gap-1.5 shadow-xl transition-all"
              title="Add current phone GPS location as a corner"
            >
              <Navigation className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Drop GPS Pin</span>
            </button>
          )}
        </div>

        {/* Row 2: Secondary Controls (Undo, Clear, Fix Shape, Confirm) */}
        <div className="pointer-events-auto flex items-center justify-between gap-2">
          
          {/* Left Group: Undo & Clear */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleUndo}
              disabled={boundary.length === 0 && history.length === 0}
              className="px-3 py-2 rounded-xl bg-black/85 hover:bg-black text-white border border-white/20 hover:border-white/40 disabled:opacity-40 disabled:pointer-events-none backdrop-blur-md shadow-xl text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
            >
              <Undo2 className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Undo</span>
            </button>

            <button
              type="button"
              onClick={handleClear}
              disabled={boundary.length === 0}
              className="px-3 py-2 rounded-xl bg-black/85 hover:bg-black text-white border border-white/20 hover:border-white/40 disabled:opacity-40 disabled:pointer-events-none backdrop-blur-md shadow-xl text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Clear</span>
            </button>

            {boundary.length >= 4 && (
              <button
                type="button"
                onClick={handleUntangle}
                className="px-3 py-2 rounded-xl bg-black/85 hover:bg-black text-cyan-300 border border-cyan-500/40 backdrop-blur-md shadow-xl text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Fix Shape</span>
              </button>
            )}
          </div>

          {/* Center Metric */}
          {boundary.length >= 3 && (
            <div className="px-3 py-1.5 rounded-xl bg-black/85 border border-emerald-500/30 backdrop-blur-md text-center">
              <span className="text-sm font-extrabold text-emerald-400 font-mono">
                {areaHa} ha
              </span>
              <span className="text-[10px] text-slate-300 font-mono ml-1.5 hidden sm:inline">
                ({areaAcres} ac)
              </span>
            </div>
          )}

          {/* Right Group: Confirm Field Button */}
          <div>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={boundary.length < 3 || isTracing}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs tracking-wide flex items-center gap-1.5 transition-all shadow-2xl ${
                boundary.length >= 3 && !isTracing
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/40 active:scale-95 cursor-pointer'
                  : 'bg-dark-800 text-slate-500 border border-dark-700 cursor-not-allowed opacity-60'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>Confirm Field</span>
            </button>
          </div>

        </div>

      </footer>
    </div>
  );
}

