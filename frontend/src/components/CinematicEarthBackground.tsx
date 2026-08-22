import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { 
  Satellite as SatelliteIcon, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Play, 
  Pause, 
  MapPin, 
  Activity, 
  X, 
  Eye, 
  Sparkles,
  Compass,
  Radio,
  Volume2,
  VolumeX
} from 'lucide-react';
import { playSatelliteBeep } from '../lib/soundFx';

export type EarthViewMode = 'natural' | 'ndvi' | 'night' | 'moisture';

export interface TelemetryHotspot {
  id: string;
  name: string;
  country: string;
  crop: string;
  lat: number;
  lon: number;
  ndvi: number;
  soilMoisture: string;
  healthStatus: 'Optimum' | 'Moderate Stress' | 'Drought Anomaly' | 'Severe Degradation';
  satPass: string;
}

export const GLOBAL_HOTSPOTS: TelemetryHotspot[] = [
  {
    id: 'hs-1',
    name: 'Central Valley Farmlands',
    country: 'United States (California)',
    crop: 'Almonds, Citrus & Vineyards',
    lat: 36.7783,
    lon: -119.4179,
    ndvi: 0.74,
    soilMoisture: '32.4% (Irrigated)',
    healthStatus: 'Optimum',
    satPass: 'Sentinel-2B in 04h 12m'
  },
  {
    id: 'hs-2',
    name: 'Mato Grosso Cerrado Basin',
    country: 'Brazil',
    crop: 'Soybean & Corn Mega-Fields',
    lat: -12.6819,
    lon: -56.9211,
    ndvi: 0.81,
    soilMoisture: '41.8% (Optimal)',
    healthStatus: 'Optimum',
    satPass: 'PlanetScope Dove in 01h 45m'
  },
  {
    id: 'hs-3',
    name: 'Punjab Breadbasket Plains',
    country: 'India',
    crop: 'Wheat, Rice & Mustard',
    lat: 31.1471,
    lon: 75.3412,
    ndvi: 0.52,
    soilMoisture: '21.5% (Heat Anomaly)',
    healthStatus: 'Moderate Stress',
    satPass: 'Landsat-9 in 06h 30m'
  },
  {
    id: 'hs-4',
    name: 'Bordeaux Agro-Vineyard Corridor',
    country: 'France',
    crop: 'Viticulture & Cereal Terroir',
    lat: 44.8378,
    lon: -0.5792,
    ndvi: 0.68,
    soilMoisture: '28.9% (Normal)',
    healthStatus: 'Optimum',
    satPass: 'Sentinel-2A in 02h 10m'
  },
  {
    id: 'hs-5',
    name: 'Rift Valley Highlands',
    country: 'Kenya',
    crop: 'Tea, Coffee & Maize',
    lat: 0.1769,
    lon: 36.0023,
    ndvi: 0.43,
    soilMoisture: '14.2% (Drought Risk)',
    healthStatus: 'Drought Anomaly',
    satPass: 'Sentinel-2B in 08h 15m'
  },
  {
    id: 'hs-6',
    name: 'Darling Downs Granary',
    country: 'Australia (Queensland)',
    crop: 'Sorghum, Barley & Cotton',
    lat: -27.5598,
    lon: 151.9507,
    ndvi: 0.62,
    soilMoisture: '26.1% (Adequate)',
    healthStatus: 'Optimum',
    satPass: 'PlanetScope Dove in 03h 22m'
  },
  {
    id: 'hs-7',
    name: 'Nile Delta Fertile Plain',
    country: 'Egypt',
    crop: 'Cotton, Citrus & Legumes',
    lat: 30.8761,
    lon: 31.0004,
    ndvi: 0.71,
    soilMoisture: '35.0% (Canal Fed)',
    healthStatus: 'Optimum',
    satPass: 'Sentinel-2A in 05h 40m'
  }
];

interface CinematicEarthProps {
  speedFactor?: number;
  allowDirectInteraction?: boolean;
  onSelectHotspot?: (hotspot: TelemetryHotspot | null) => void;
}

export default function CinematicEarthBackground({ 
  speedFactor = 1.0, 
  allowDirectInteraction = true,
  onSelectHotspot 
}: CinematicEarthProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [activeMode, setActiveMode] = useState<EarthViewMode>('natural');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [showOrbits, setShowOrbits] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [selectedHotspot, setSelectedHotspot] = useState<TelemetryHotspot | null>(null);
  const [hoveredHotspot, setHoveredHotspot] = useState<TelemetryHotspot | null>(null);
  const [_currentZoom, setCurrentZoom] = useState<number>(2.45);

  // References for three.js manipulation outside the animation loop
  const earthMeshRef = useRef<THREE.Mesh | null>(null);
  const earthGroupRef = useRef<THREE.Group | null>(null);
  const satGroupRef = useRef<THREE.Group | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const uniformsRef = useRef<{ [key: string]: THREE.IUniform } | null>(null);
  const resetOrientationRef = useRef<() => void>(() => {});
  const zoomFnRef = useRef<(delta: number) => void>(() => {});

  // High-performance procedural fallback texture generator
  const createProceduralTextures = useCallback(() => {
    // 1. Day Map
    const canvasDay = document.createElement('canvas');
    canvasDay.width = 2048;
    canvasDay.height = 1024;
    const ctxDay = canvasDay.getContext('2d');
    if (ctxDay) {
      const oceanGrad = ctxDay.createLinearGradient(0, 0, 0, canvasDay.height);
      oceanGrad.addColorStop(0, '#040b18');
      oceanGrad.addColorStop(0.3, '#081c3c');
      oceanGrad.addColorStop(0.5, '#0c2756');
      oceanGrad.addColorStop(0.7, '#081c3c');
      oceanGrad.addColorStop(1, '#040b18');
      ctxDay.fillStyle = oceanGrad;
      ctxDay.fillRect(0, 0, canvasDay.width, canvasDay.height);

      ctxDay.fillStyle = '#1e3a1e';
      const continents = [
        [[-160, 70], [-130, 60], [-115, 30], [-90, 20], [-80, 25], [-75, 40], [-60, 50], [-70, 65]],
        [[-80, 10], [-75, -10], [-70, -30], [-65, -55], [-55, -40], [-35, -5], [-50, 5], [-75, 12]],
        [[-10, 35], [0, 45], [20, 60], [60, 65], [100, 70], [140, 65], [160, 55], [130, 35], [100, 20], [75, 10], [50, 25], [10, 38]],
        [[-15, 30], [10, 37], [30, 30], [45, 10], [40, -10], [30, -30], [20, -35], [10, -10], [-10, 5], [-15, 20]],
        [[115, -20], [130, -12], [145, -15], [150, -30], [140, -38], [120, -35], [115, -25]],
      ];
      continents.forEach(poly => {
        ctxDay.beginPath();
        poly.forEach(([lon, lat], i) => {
          const x = (lon / 360 + 0.5) * canvasDay.width;
          const y = (-lat / 180 + 0.5) * canvasDay.height;
          if (i === 0) ctxDay.moveTo(x, y);
          else ctxDay.lineTo(x, y);
        });
        ctxDay.closePath();
        ctxDay.fill();
      });
    }
    const dayTexture = new THREE.CanvasTexture(canvasDay);
    dayTexture.wrapS = THREE.RepeatWrapping;
    dayTexture.wrapT = THREE.ClampToEdgeWrapping;

    // 2. Specular Map
    const canvasSpec = document.createElement('canvas');
    canvasSpec.width = 1024;
    canvasSpec.height = 512;
    const ctxSpec = canvasSpec.getContext('2d');
    if (ctxSpec) {
      ctxSpec.fillStyle = '#ffffff';
      ctxSpec.fillRect(0, 0, canvasSpec.width, canvasSpec.height);
      ctxSpec.fillStyle = '#111111';
      ctxSpec.fillRect(200, 100, 300, 300);
      ctxSpec.fillRect(600, 150, 350, 280);
    }
    const specTexture = new THREE.CanvasTexture(canvasSpec);

    // 3. Clouds Map
    const canvasCloud = document.createElement('canvas');
    canvasCloud.width = 1024;
    canvasCloud.height = 512;
    const ctxCloud = canvasCloud.getContext('2d');
    if (ctxCloud) {
      ctxCloud.fillStyle = 'rgba(0,0,0,0)';
      ctxCloud.fillRect(0, 0, canvasCloud.width, canvasCloud.height);
      for (let i = 0; i < 200; i++) {
        const cx = Math.random() * canvasCloud.width;
        const cy = Math.random() * canvasCloud.height;
        const cr = Math.random() * 80 + 20;
        const grad = ctxCloud.createRadialGradient(cx, cy, 0, cx, cy, cr);
        grad.addColorStop(0, 'rgba(255,255,255,0.7)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctxCloud.fillStyle = grad;
        ctxCloud.beginPath();
        ctxCloud.arc(cx, cy, cr, 0, Math.PI * 2);
        ctxCloud.fill();
      }
    }
    const cloudTexture = new THREE.CanvasTexture(canvasCloud);

    return { dayTexture, specTexture, cloudTexture };
  }, []);

  // Update Atmosphere Glow Color
  useEffect(() => {
    if (uniformsRef.current?.glowColor) {
      if (activeMode === 'natural') {
        uniformsRef.current.glowColor.value.setHex(0x00ff88);
      } else if (activeMode === 'ndvi') {
        uniformsRef.current.glowColor.value.setHex(0x10b981);
      } else if (activeMode === 'night') {
        uniformsRef.current.glowColor.value.setHex(0xf59e0b);
      } else if (activeMode === 'moisture') {
        uniformsRef.current.glowColor.value.setHex(0x06b6d4);
      }
    }
  }, [activeMode]);

  // Toggle satellites visibility
  useEffect(() => {
    if (satGroupRef.current) {
      satGroupRef.current.visible = showOrbits;
    }
  }, [showOrbits]);

  // Select hotspot notification
  const handleSelectSpot = useCallback((spot: TelemetryHotspot | null) => {
    setSelectedHotspot(spot);
    if (onSelectHotspot) onSelectHotspot(spot);

    if (spot && earthMeshRef.current) {
      if (soundEnabled) playSatelliteBeep();

      const targetY = -((spot.lon + 90) * (Math.PI / 180));
      const targetX = (spot.lat) * (Math.PI / 180) * 0.35;
      
      const startY = earthMeshRef.current.rotation.y;
      const startX = earthMeshRef.current.rotation.x;
      const startTime = performance.now();
      const duration = 1000;

      const animateFocus = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 0.5 - Math.cos(progress * Math.PI) / 2;

        if (earthMeshRef.current) {
          earthMeshRef.current.rotation.y = startY + (targetY - startY) * ease;
          earthMeshRef.current.rotation.x = startX + (targetX - startX) * ease;
        }

        if (progress < 1) {
          requestAnimationFrame(animateFocus);
        }
      };
      requestAnimationFrame(animateFocus);
    }
  }, [onSelectHotspot, soundEnabled]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // ─── 1. Three.js Scene, Camera & WebGL Renderer Setup ────────
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 2.45;
    camera.position.y = 0.12;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.appendChild(renderer.domElement);

    // ─── 2. Starry Cosmos Background ────────────────────────────
    const starCount = 2000;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;
      const radius = 30 + Math.random() * 80;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      starPositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      starPositions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      starPositions[i3 + 2] = radius * Math.cos(phi);

      const isCyan = Math.random() > 0.65;
      starColors[i3] = isCyan ? 0.3 : 0.95;
      starColors[i3 + 1] = isCyan ? 0.98 : 0.98;
      starColors[i3 + 2] = 1.0;
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 0.10,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
    });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // ─── 3. Earth Group with Axial Tilt ─────────────────────────
    const earthGroup = new THREE.Group();
    earthGroup.rotation.z = -0.41; // Axial tilt
    scene.add(earthGroup);
    earthGroupRef.current = earthGroup;

    // Texture Loader & Fallbacks
    const textureLoader = new THREE.TextureLoader();
    const fallbacks = createProceduralTextures();

    // High-fidelity Earth textures
    const earthGeometry = new THREE.SphereGeometry(1, 128, 128);
    const earthMaterial = new THREE.MeshPhongMaterial({
      map: textureLoader.load(
        'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg',
        undefined,
        undefined,
        () => { earthMaterial.map = fallbacks.dayTexture; earthMaterial.needsUpdate = true; }
      ),
      specularMap: textureLoader.load(
        'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_specular_2048.jpg',
        undefined,
        undefined,
        () => { earthMaterial.specularMap = fallbacks.specTexture; earthMaterial.needsUpdate = true; }
      ),
      normalMap: textureLoader.load(
        'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_normal_2048.jpg'
      ),
      normalScale: new THREE.Vector2(0.85, 0.85),
      specular: new THREE.Color(0x333333),
      shininess: 12,
    });

    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    earthGroup.add(earth);
    earthMeshRef.current = earth;

    // ─── 4. Cloud Layer ─────────────────────────────────────────
    const cloudGeometry = new THREE.SphereGeometry(1.015, 128, 128);
    const cloudMaterial = new THREE.MeshPhongMaterial({
      map: textureLoader.load(
        'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_clouds_1024.png',
        undefined,
        undefined,
        () => { cloudMaterial.map = fallbacks.cloudTexture; cloudMaterial.needsUpdate = true; }
      ),
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });
    const clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
    earthGroup.add(clouds);

    // ─── 5. Atmosphere Glow Shader (Exact Prompt Implementation) ──
    const atmosphereGeo = new THREE.SphereGeometry(1.15, 128, 128);
    const atmosphereMat = new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.BackSide,
      uniforms: {
        glowColor: { value: new THREE.Color(0x00ff88) },
        viewVector: { value: camera.position },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vViewPosition = -mvPosition.xyz;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        void main() {
          float intensity = pow(0.6 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 4.0);
          gl_FragColor = vec4(glowColor, intensity);
        }
      `,
    });
    const atmosphere = new THREE.Mesh(atmosphereGeo, atmosphereMat);
    scene.add(atmosphere);
    uniformsRef.current = atmosphereMat.uniforms;

    // ─── 6. Harvest Rings & Satellites ──────────────────────────
    const ringGeo = new THREE.TorusGeometry(1.45, 0.0035, 16, 256);
    const ringMat = new THREE.MeshBasicMaterial({ 
      color: 0x00ff88, 
      transparent: true, 
      opacity: 0.35,
      blending: THREE.AdditiveBlending 
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    earthGroup.add(ring);

    // Secondary Polar Ring
    const polarRingGeo = new THREE.TorusGeometry(1.60, 0.0025, 16, 256);
    const polarRingMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.25,
      blending: THREE.AdditiveBlending,
    });
    const polarRing = new THREE.Mesh(polarRingGeo, polarRingMat);
    polarRing.rotation.x = Math.PI / 3.4;
    polarRing.rotation.y = Math.PI / 5;
    earthGroup.add(polarRing);

    const satGroup = new THREE.Group();
    earthGroup.add(satGroup);
    satGroupRef.current = satGroup;

    // 6 Satellites on Harvest Ring
    const satellites: Array<{ mesh: THREE.Mesh; speed: number; angle: number; distance: number; parent: THREE.Object3D }> = [];
    const satelliteGeo = new THREE.BoxGeometry(0.02, 0.012, 0.012);
    const satelliteMat = new THREE.MeshStandardMaterial({ 
      color: 0x00ff88, 
      emissive: 0x00ff88,
      emissiveIntensity: 3.0
    });

    for(let i = 0; i < 6; i++) {
      const sat = new THREE.Mesh(satelliteGeo, satelliteMat.clone());
      const angle = (i / 6) * Math.PI * 2;
      const distance = 1.45;
      sat.position.set(Math.cos(angle) * distance, 0, Math.sin(angle) * distance);

      // Mini solar panels
      const wingGeo = new THREE.PlaneGeometry(0.04, 0.01);
      const wingMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide });
      const wing = new THREE.Mesh(wingGeo, wingMat);
      sat.add(wing);

      ring.add(sat);
      satellites.push({
        mesh: sat,
        angle,
        speed: 0.001 + Math.random() * 0.002,
        distance,
        parent: ring
      });
    }

    // Polar Sentinel Satellite
    const polarSat = new THREE.Mesh(
      new THREE.BoxGeometry(0.024, 0.014, 0.014),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x38bdf8, emissiveIntensity: 3.5 })
    );
    polarSat.position.set(1.60, 0, 0);
    polarRing.add(polarSat);
    satellites.push({
      mesh: polarSat,
      angle: 0,
      speed: 0.002,
      distance: 1.60,
      parent: polarRing
    });

    // ─── 7. Interactive Telemetry Hotspot Beacons ────────────────
    const hotspotsGroup = new THREE.Group();
    earth.add(hotspotsGroup);

    const latLonToVector3 = (lat: number, lon: number, radius: number) => {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      const x = -(radius * Math.sin(phi) * Math.cos(theta));
      const z = radius * Math.sin(phi) * Math.sin(theta);
      const y = radius * Math.cos(phi);
      return new THREE.Vector3(x, y, z);
    };

    const hotspotMeshes: Array<{ mesh: THREE.Mesh; data: TelemetryHotspot }> = [];

    GLOBAL_HOTSPOTS.forEach((spot) => {
      const pos = latLonToVector3(spot.lat, spot.lon, 1.015);
      
      const ringGeo = new THREE.RingGeometry(0.02, 0.038, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: spot.healthStatus === 'Optimum' ? 0x00ff88 : (spot.healthStatus === 'Drought Anomaly' ? 0xff4d4d : 0xffaa00),
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
      });
      const spotRing = new THREE.Mesh(ringGeo, ringMat);
      spotRing.position.copy(pos);
      spotRing.lookAt(0, 0, 0);
      hotspotsGroup.add(spotRing);

      const coreGeo = new THREE.SphereGeometry(0.012, 16, 16);
      const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const core = new THREE.Mesh(coreGeo, coreMat);
      core.position.copy(pos);
      hotspotsGroup.add(core);

      hotspotMeshes.push({ mesh: core, data: spot });
    });

    // ─── 8. Lights ──────────────────────────────────────────────
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.6);
    sunLight.position.set(5, 3, 5);
    scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0x0088ff, 0.4);
    fillLight.position.set(-5, -2, -4);
    scene.add(fillLight);

    // ─── 9. Interaction & Mouse Tilt ─────────────────────────────
    let mouseX = 0, mouseY = 0;
    let targetMouseX = 0, targetMouseY = 0;
    let isDragging = false;
    let prevMouse = { x: 0, y: 0 };
    let dragVelocityX = 0;
    let dragVelocityY = 0;

    const raycaster = new THREE.Raycaster();
    const mouseVector = new THREE.Vector2();

    const handlePointerMove = (e: MouseEvent) => {
      targetMouseX = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
      targetMouseY = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2);

      if (isDragging && earthMeshRef.current) {
        const deltaX = e.clientX - prevMouse.x;
        const deltaY = e.clientY - prevMouse.y;
        dragVelocityX = deltaX * 0.003;
        dragVelocityY = deltaY * 0.003;
        earthMeshRef.current.rotation.y += dragVelocityX;
        earthMeshRef.current.rotation.x += dragVelocityY;
        prevMouse = { x: e.clientX, y: e.clientY };
      }

      mouseVector.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseVector.y = -(e.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouseVector, camera);

      const intersects = raycaster.intersectObjects(hotspotMeshes.map(h => h.mesh));
      if (intersects.length > 0) {
        const matched = hotspotMeshes.find(h => h.mesh === intersects[0].object);
        if (matched) {
          setHoveredHotspot(matched.data);
          container.style.cursor = 'pointer';
        }
      } else {
        setHoveredHotspot(null);
        container.style.cursor = isDragging ? 'grabbing' : 'default';
      }
    };

    const handlePointerDown = (e: MouseEvent) => {
      if (!allowDirectInteraction) return;
      isDragging = true;
      prevMouse = { x: e.clientX, y: e.clientY };
      dragVelocityX = 0;
      dragVelocityY = 0;
    };

    const handlePointerUp = () => {
      isDragging = false;
    };

    const handlePointerClick = (e: MouseEvent) => {
      mouseVector.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseVector.y = -(e.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouseVector, camera);

      const intersects = raycaster.intersectObjects(hotspotMeshes.map(h => h.mesh));
      if (intersects.length > 0) {
        const matched = hotspotMeshes.find(h => h.mesh === intersects[0].object);
        if (matched) {
          handleSelectSpot(matched.data);
        }
      }
    };

    const handleWheel = (e: WheelEvent) => {
      if (!allowDirectInteraction) return;
      e.preventDefault();
      const zoomDelta = e.deltaY * 0.0015;
      const newPos = Math.max(1.8, Math.min(4.8, camera.position.z + zoomDelta));
      camera.position.z = newPos;
      setCurrentZoom(newPos);
    };

    const zoomStep = (delta: number) => {
      const newPos = Math.max(1.8, Math.min(4.8, camera.position.z + delta));
      camera.position.z = newPos;
      setCurrentZoom(newPos);
    };
    zoomFnRef.current = zoomStep;

    const resetOrientation = () => {
      if (earthMeshRef.current) {
        earthMeshRef.current.rotation.set(0, 0, 0);
      }
      if (cameraRef.current) {
        cameraRef.current.position.set(0, 0.12, 2.45);
        setCurrentZoom(2.45);
      }
      setSelectedHotspot(null);
    };
    resetOrientationRef.current = resetOrientation;

    const handleResize = () => {
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('click', handlePointerClick);
    container.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('resize', handleResize);

    // ─── 10. Animation Loop ─────────────────────────────────────
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      if (isPlaying) {
        earth.rotation.y += 0.0012 * speedFactor;
        clouds.rotation.y += 0.0018 * speedFactor;
      }

      // Smooth mouse tilt
      if (!isDragging) {
        mouseX += (targetMouseX - mouseX) * 0.05;
        mouseY += (targetMouseY - mouseY) * 0.05;

        earthGroup.rotation.y = (mouseX * 0.4);
        earthGroup.rotation.x = (mouseY * 0.15);
      } else {
        dragVelocityX *= 0.92;
        dragVelocityY *= 0.92;
      }

      // Move satellites along orbital rings
      satellites.forEach(sat => {
        sat.angle += sat.speed * speedFactor * (isPlaying ? 1.0 : 0.2);
        sat.mesh.position.x = Math.cos(sat.angle) * sat.distance;
        sat.mesh.position.z = Math.sin(sat.angle) * sat.distance;
      });

      ring.rotation.z += 0.0005 * speedFactor;
      polarRing.rotation.z += 0.0003 * speedFactor;

      // Pulse beacon rings
      const time = performance.now() * 0.003;
      hotspotsGroup.children.forEach((child, idx) => {
        if (idx % 2 === 0) {
          const scale = 1.0 + Math.sin(time + idx) * 0.28;
          child.scale.set(scale, scale, 1);
        }
      });

      starField.rotation.y += 0.00004;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('click', handlePointerClick);
      container.removeEventListener('wheel', handleWheel);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [speedFactor, allowDirectInteraction, handleSelectSpot, createProceduralTextures]);

  return (
    <div className="fixed inset-0 w-screen h-screen z-0 overflow-hidden bg-black select-none pointer-events-auto">
      {/* 3D WebGL Canvas Viewport */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Interactive Orbital HUD Control Dock */}
      <div className="fixed bottom-6 right-6 z-30 flex flex-col items-end gap-3 pointer-events-auto">
        {/* Floating Telemetry Hotspot Info Card */}
        {(selectedHotspot || hoveredHotspot) && (
          <div className="w-80 bg-black/90 border border-emerald-500/40 rounded-2xl p-4 backdrop-blur-xl shadow-[0_0_35px_rgba(0,255,136,0.25)] text-white animate-fade-in transition-all">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-300">
                  Global Earth Observation Zone
                </span>
              </div>
              {selectedHotspot && (
                <button 
                  onClick={() => handleSelectSpot(null)}
                  className="text-slate-400 hover:text-white p-0.5 rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <h4 className="text-base font-bold text-white leading-tight">
              {(selectedHotspot || hoveredHotspot)?.name}
            </h4>
            <p className="text-xs text-slate-400 mb-3">
              {(selectedHotspot || hoveredHotspot)?.country}
            </p>

            <div className="grid grid-cols-2 gap-2 bg-white/[0.04] rounded-xl p-2.5 border border-white/10 text-xs mb-3">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Crop Canopy</span>
                <span className="font-semibold text-slate-200 truncate block">
                  {(selectedHotspot || hoveredHotspot)?.crop}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">NDVI Vegetation</span>
                <span className="font-mono font-bold text-emerald-400">
                  {(selectedHotspot || hoveredHotspot)?.ndvi.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Soil Moisture</span>
                <span className="font-semibold text-slate-200">
                  {(selectedHotspot || hoveredHotspot)?.soilMoisture}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Risk Status</span>
                <span className={`font-semibold ${
                  (selectedHotspot || hoveredHotspot)?.healthStatus === 'Optimum' ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  {(selectedHotspot || hoveredHotspot)?.healthStatus}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1 border-t border-white/10">
              <span className="flex items-center gap-1.5 text-emerald-300">
                <Radio className="w-3 h-3 animate-spin" />
                {(selectedHotspot || hoveredHotspot)?.satPass}
              </span>
              <span>
                {(selectedHotspot || hoveredHotspot)?.lat.toFixed(2)}°, {(selectedHotspot || hoveredHotspot)?.lon.toFixed(2)}°
              </span>
            </div>
          </div>
        )}

        {/* Multi-Spectral Layer Selector & Control Bar */}
        <div className="flex items-center gap-2 bg-black/80 border border-white/15 backdrop-blur-xl px-3 py-2 rounded-2xl shadow-2xl">
          {/* View Mode Tabs */}
          <div className="flex items-center bg-white/5 rounded-xl p-1 border border-white/10 text-xs">
            <button
              onClick={() => setActiveMode('natural')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
                activeMode === 'natural' ? 'bg-emerald-500 text-black font-bold shadow-md' : 'text-slate-300 hover:text-white'
              }`}
              title="Natural Color (True Color RGB Composite)"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>True Color</span>
            </button>
            <button
              onClick={() => setActiveMode('ndvi')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
                activeMode === 'ndvi' ? 'bg-emerald-500 text-black font-bold shadow-md' : 'text-slate-300 hover:text-white'
              }`}
              title="NDVI Normalized Difference Vegetation Index"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>NDVI</span>
            </button>
            <button
              onClick={() => setActiveMode('night')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
                activeMode === 'night' ? 'bg-amber-500 text-black font-bold shadow-md' : 'text-slate-300 hover:text-white'
              }`}
              title="City Night Lights (Earth at Night)"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Night</span>
            </button>
          </div>

          <div className="h-5 w-px bg-white/20" />

          {/* Sound Toggle */}
          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              if (!soundEnabled) playSatelliteBeep();
            }}
            className={`p-2 rounded-xl border transition-all ${
              soundEnabled 
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' 
                : 'bg-white/5 border-white/10 text-slate-500 hover:text-slate-300'
            }`}
            title={soundEnabled ? 'Audio Sound FX Active' : 'Audio Muted'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Satellite Orbit Toggle */}
          <button
            onClick={() => setShowOrbits(!showOrbits)}
            className={`p-2 rounded-xl border transition-all ${
              showOrbits 
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' 
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
            }`}
            title="Toggle Orbiting Satellites & Harvest Rings"
          >
            <SatelliteIcon className="w-4 h-4" />
          </button>

          {/* Play/Pause Rotation */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white rounded-xl transition-all"
            title={isPlaying ? 'Pause Auto-Rotation' : 'Resume Auto-Rotation'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          {/* Reset Orientation */}
          <button
            onClick={() => resetOrientationRef.current()}
            className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white rounded-xl transition-all"
            title="Reset Earth Alignment"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Zoom Buttons */}
          <button
            onClick={() => zoomFnRef.current(-0.5)}
            className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white rounded-xl transition-all"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => zoomFnRef.current(0.5)}
            className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white rounded-xl transition-all"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Floating Instructions Hint */}
      <div className="fixed top-20 right-6 z-20 pointer-events-none hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 border border-emerald-500/30 backdrop-blur-md text-[11px] text-emerald-300 font-mono">
        <Compass className="w-3.5 h-3.5 text-emerald-400" />
        <span>Smooth Interactive Mouse Tilt • Harvest Rings • Orbiting Satellites • Drag &amp; Zoom</span>
      </div>
    </div>
  );
}
