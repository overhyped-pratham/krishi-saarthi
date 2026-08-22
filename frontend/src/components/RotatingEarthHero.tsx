import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { playCinematicZoomSound, playSatelliteBeep } from '../lib/soundFx';
import { Volume2, VolumeX, RotateCcw, Satellite, Compass, Play, Pause } from 'lucide-react';

interface RotatingEarthHeroProps {
  speedFactor?: number;
  className?: string;
}

export default function RotatingEarthHero({
  speedFactor = 1.0,
  className = ''
}: RotatingEarthHeroProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [audioPlayed, setAudioPlayed] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(speedFactor);

  const earthMeshRef = useRef<THREE.Mesh | null>(null);
  const earthGroupRef = useRef<THREE.Group | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  // Trigger sound on initial interaction
  useEffect(() => {
    const handleFirstUserInteraction = () => {
      if (!audioPlayed) {
        if (soundEnabled) playCinematicZoomSound();
        setAudioPlayed(true);
      }
    };

    window.addEventListener('click', handleFirstUserInteraction, { once: true });
    window.addEventListener('keydown', handleFirstUserInteraction, { once: true });

    return () => {
      window.removeEventListener('click', handleFirstUserInteraction);
      window.removeEventListener('keydown', handleFirstUserInteraction);
    };
  }, [soundEnabled, audioPlayed]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || 550;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 2.45;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    container.appendChild(renderer.domElement);

    // Earth Group
    const earthGroup = new THREE.Group();
    earthGroup.rotation.z = -0.41;
    scene.add(earthGroup);
    earthGroupRef.current = earthGroup;

    const textureLoader = new THREE.TextureLoader();

    // High-fidelity Earth textures
    const earthGeometry = new THREE.SphereGeometry(1, 128, 128);
    const earthMaterial = new THREE.MeshPhongMaterial({
      map: textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg'),
      specularMap: textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_specular_2048.jpg'),
      normalMap: textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_normal_2048.jpg'),
      normalScale: new THREE.Vector2(0.85, 0.85),
      specular: new THREE.Color(0x333333),
      shininess: 10
    });

    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    earthGroup.add(earth);
    earthMeshRef.current = earth;

    // Clouds
    const cloudGeometry = new THREE.SphereGeometry(1.015, 128, 128);
    const cloudMaterial = new THREE.MeshPhongMaterial({
      map: textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_clouds_1024.png'),
      transparent: true,
      opacity: 0.4,
      depthWrite: false
    });
    const clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
    earthGroup.add(clouds);

    // Atmosphere Shader
    const atmosphereGeo = new THREE.SphereGeometry(1.15, 128, 128);
    const atmosphereMat = new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.BackSide,
      uniforms: {
        glowColor: { value: new THREE.Color(0x00ff88) },
        viewVector: { value: camera.position }
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
      `
    });
    const atmosphere = new THREE.Mesh(atmosphereGeo, atmosphereMat);
    scene.add(atmosphere);

    // Harvest Rings
    const ringGeo = new THREE.TorusGeometry(1.45, 0.003, 16, 256);
    const ringMat = new THREE.MeshBasicMaterial({ 
      color: 0x00ff88, 
      transparent: true, 
      opacity: 0.3,
      blending: THREE.AdditiveBlending 
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    earthGroup.add(ring);

    // Satellites
    const satellites: Array<{ mesh: THREE.Mesh; angle: number; speed: number }> = [];
    const satelliteGeo = new THREE.BoxGeometry(0.018, 0.012, 0.012);
    const satelliteMat = new THREE.MeshStandardMaterial({ 
      color: 0x00ff88, 
      emissive: 0x00ff88,
      emissiveIntensity: 3
    });

    for (let i = 0; i < 6; i++) {
      const sat = new THREE.Mesh(satelliteGeo, satelliteMat);
      const angle = (i / 6) * Math.PI * 2;
      const distance = 1.45;
      sat.position.set(Math.cos(angle) * distance, 0, Math.sin(angle) * distance);
      
      const wing = new THREE.Mesh(
        new THREE.PlaneGeometry(0.035, 0.01),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide })
      );
      sat.add(wing);

      ring.add(sat);
      satellites.push({
        mesh: sat,
        angle,
        speed: 0.001 + Math.random() * 0.002
      });
    }

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
    sunLight.position.set(5, 3, 5);
    scene.add(sunLight);

    // Interaction - Mouse Tilt
    let mouseX = 0, mouseY = 0;
    let targetMouseX = 0, targetMouseY = 0;

    const onMouseMove = (e: MouseEvent) => {
      targetMouseX = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
      targetMouseY = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2);
    };

    window.addEventListener('mousemove', onMouseMove);

    // Animation loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      
      if (isPlaying) {
        earth.rotation.y += 0.0012 * speedMultiplier;
        clouds.rotation.y += 0.0018 * speedMultiplier;
      }
      
      // Smooth mouse tilt
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;
      earthGroup.rotation.y += (mouseX * 0.4 - earthGroup.rotation.y) * 0.05;
      earthGroup.rotation.x += (mouseY * 0.15 - earthGroup.rotation.x) * 0.05;

      satellites.forEach(sat => {
        sat.angle += sat.speed * speedMultiplier * (isPlaying ? 1.0 : 0.2);
        sat.mesh.position.x = Math.cos(sat.angle) * 1.45;
        sat.mesh.position.z = Math.sin(sat.angle) * 1.45;
      });

      ring.rotation.z += 0.0005 * speedMultiplier;
      
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || 550;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [isPlaying, speedMultiplier]);

  const handleReset = () => {
    if (earthMeshRef.current) earthMeshRef.current.rotation.set(0, 0, 0);
    if (earthGroupRef.current) earthGroupRef.current.rotation.set(0, 0, -0.41);
  };

  return (
    <div className={`relative w-full h-[520px] rounded-3xl overflow-hidden bg-black border border-white/10 shadow-2xl ${className}`}>
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Floating Control Ribbon */}
      <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2 bg-black/80 border border-white/15 backdrop-blur-xl px-3 py-1.5 rounded-2xl shadow-xl">
        <button
          onClick={() => {
            setSoundEnabled(!soundEnabled);
            if (!soundEnabled) playSatelliteBeep();
          }}
          className={`p-1.5 rounded-xl border transition-all ${
            soundEnabled ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' : 'bg-white/5 border-white/10 text-slate-500'
          }`}
          title={soundEnabled ? 'Sound Enabled' : 'Sound Muted'}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
        </button>

        <button
          onClick={() => setSpeedMultiplier(prev => prev === 1.0 ? 2.5 : prev === 2.5 ? 0.3 : 1.0)}
          className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-emerald-400 flex items-center gap-1"
          title="Toggle Cadence"
        >
          <Satellite className="w-3.5 h-3.5" />
          <span>{speedMultiplier}x</span>
        </button>

        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white rounded-xl transition-all"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>

        <button
          onClick={handleReset}
          className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white rounded-xl transition-all"
          title="Reset Alignment"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Floating Status Pill */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1 rounded-full bg-black/60 border border-emerald-500/30 backdrop-blur-md text-[11px] text-emerald-300 font-mono">
        <Compass className="w-3.5 h-3.5 text-emerald-400" />
        <span>3D Interstellar Earth Engine • Three.js</span>
      </div>
    </div>
  );
}
