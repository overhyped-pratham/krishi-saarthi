import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Satellite, 
  Lock, 
  Database, 
  ArrowRight, 
  ShieldCheck, 
  Activity, 
  Cpu, 
  Compass,
  Globe,
  Sprout,
  Globe2,
  Stethoscope,
  CloudRain,
  Bot
} from 'lucide-react';
import { motion } from 'framer-motion';
import CinematicEarthBackground from '../components/CinematicEarthBackground';
import InterstellarEarthScene from '../components/InterstellarEarthScene';
import AnalysisPipelineSnapshots from '../components/AnalysisPipelineSnapshots';

export default function LandingPage() {
  const [earthStyle, setEarthStyle] = useState<'cinematic' | 'interstellar'>('cinematic');
  const [orbitSpeed, setOrbitSpeed] = useState<number>(1.0);
  const [orbitModeName, setOrbitModeName] = useState<string>('Orbit: Active');

  const cycleOrbitSpeed = () => {
    if (orbitSpeed === 1.0) {
      setOrbitSpeed(2.5);
      setOrbitModeName('Orbit: High Cadence');
    } else if (orbitSpeed === 2.5) {
      setOrbitSpeed(0.2);
      setOrbitModeName('Orbit: Geostationary');
    } else {
      setOrbitSpeed(1.0);
      setOrbitModeName('Orbit: Active');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white relative selection:bg-cyan-500 selection:text-black">
      {/* 3D Earth Background: Switchable between Cinematic Horizon and Interstellar Globe */}
      {earthStyle === 'cinematic' ? (
        <CinematicEarthBackground speedFactor={orbitSpeed} />
      ) : (
        <InterstellarEarthScene className="fixed inset-0 z-0" isHeroMode={true} />
      )}

      {/* Atmospheric Horizon Flare Backlight Effect */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_90%_40%_at_50%_100%,rgba(0,163,255,0.2)_0%,rgba(0,50,120,0.08)_45%,transparent_75%)]" />

      {/* Main Content Layer */}
      <div className="relative z-10">

        {/* ============================================================== */}
        {/* HERO SECTION : Photographic Horizon & Krishi Saarthi Branding */}
        {/* ============================================================== */}
        <section id="hero" className="min-h-screen flex flex-col justify-between items-center text-center px-6 pt-28 pb-12 relative">
          
          {/* Live Telemetry Status Pill */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="z-20 inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-black/70 border border-cyan-500/30 backdrop-blur-md shadow-[0_0_25px_rgba(0,163,255,0.25)] mb-2"
          >
            <div className="relative flex h-2.5 w-2.5">
              <span className="radar-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400" />
            </div>
            <span className="font-mono text-xs text-cyan-300 tracking-wider font-semibold">
              SENTINEL-2 MSI · DIGITAL PUBLIC GOOD · 5 STATES FEDERATED
            </span>
            <span className="text-xs text-white/40">|</span>
            <button 
              onClick={cycleOrbitSpeed} 
              className="font-mono text-xs text-cyan-400 hover:text-white transition-colors flex items-center gap-1"
              title="Click to toggle orbital speed"
            >
              <Compass className="w-3.5 h-3.5" />
              {orbitModeName}
            </button>
            <span className="text-xs text-white/40">|</span>
            <button 
              onClick={() => setEarthStyle(prev => prev === 'cinematic' ? 'interstellar' : 'cinematic')} 
              className="font-mono text-xs text-emerald-400 hover:text-white transition-colors flex items-center gap-1 font-bold"
              title="Switch 3D Scene View"
            >
              <Globe className="w-3.5 h-3.5" />
              {earthStyle === 'cinematic' ? '3D Globe' : 'Horizon'}
            </button>
          </motion.div>

          {/* Central Hero Title Floating in Deep Space */}
          <div className="max-w-5xl mx-auto my-auto z-20 pt-2">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="inline-block"
            >
              <span className="text-xs sm:text-sm font-mono tracking-[0.25em] text-cyan-400 uppercase block mb-1">
                कृषि सारथी · Cooperative Agricultural Intelligence Network
              </span>
              <h1 
                className="font-display-lg text-5xl sm:text-7xl md:text-8xl lg:text-[90px] lg:leading-[98px] font-black tracking-widest uppercase mb-3 text-white"
                style={{ letterSpacing: '0.12em', textShadow: '0 0 40px rgba(0,243,255,0.35)' }}
              >
                KRISHI<span className="text-cyan-400"> SAARTHI</span>
              </h1>
            </motion.div>
            
            <motion.p 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.2 }}
              className="font-mono text-base sm:text-xl md:text-2xl text-cyan-200 max-w-3xl mx-auto mb-3 font-semibold tracking-wide italic"
            >
              “From satellite intelligence to farmer action.”
            </motion.p>

            <motion.p 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.3 }}
              className="font-sans text-xs sm:text-sm md:text-base text-white/70 max-w-3xl mx-auto mb-8 leading-relaxed font-light drop-shadow-md"
            >
              Connecting Indian states into an interoperable Digital Public Good. Combining spaceborne Sentinel-2 earth observation, soil chemistry, weather risk forecasting, explainable ML crop recommendations, plant pathology with Grad-CAM, and zero-knowledge parametric insurance.
            </motion.p>

            {/* Interactive CTA Buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.4 }}
              className="flex flex-wrap items-center justify-center gap-3.5 z-20"
            >
              <Link
                to="/krishi-saarthi"
                className="px-7 py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs tracking-wider flex items-center gap-2.5 shadow-[0_0_25px_rgba(0,163,255,0.4)] transition-all active:scale-95 group"
              >
                <Sprout className="w-4 h-4 text-black group-hover:rotate-12 transition-transform" />
                <span>ENTER KRISHI SAARTHI</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to="/cooperation"
                className="px-6 py-3.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-cyan-500/30 hover:border-cyan-400 text-white font-mono text-xs font-semibold tracking-wider backdrop-blur-md transition-all flex items-center gap-2"
              >
                <Globe2 className="w-4 h-4 text-cyan-400" />
                <span>STATE NETWORK</span>
              </Link>
              
              <Link
                to="/ledger"
                className="px-5 py-3.5 rounded-xl bg-black/70 hover:bg-white/[0.06] border border-white/20 hover:border-white/40 font-mono text-xs text-white/80 hover:text-white font-medium tracking-wider backdrop-blur-md transition-all flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>ZK LEDGER</span>
              </Link>
            </motion.div>
          </div>

          {/* Bottom Floating Telemetry Bar */}
          <div className="w-full max-w-4xl z-20 mx-auto grid grid-cols-2 md:grid-cols-4 gap-3 pt-4">
            <div className="glass-panel px-4 py-3 rounded-xl text-left bg-black/60 border border-white/10">
              <div className="font-mono text-[10px] text-white/50 uppercase tracking-wider mb-1">Connected States</div>
              <div className="font-mono text-lg font-bold text-white flex items-baseline gap-1">
                <span>5</span> <span className="text-xs text-cyan-400 font-normal">FEDERATED</span>
              </div>
            </div>
            <div className="glass-panel px-4 py-3 rounded-xl text-left bg-black/60 border border-white/10">
              <div className="font-mono text-[10px] text-white/50 uppercase tracking-wider mb-1">Spectral Precision</div>
              <div className="font-mono text-lg font-bold text-cyan-300 flex items-baseline gap-1">
                <span>10.0</span> <span className="text-xs text-cyan-400 font-normal">METERS</span>
              </div>
            </div>
            <div className="glass-panel px-4 py-3 rounded-xl text-left bg-black/60 border border-white/10">
              <div className="font-mono text-[10px] text-white/50 uppercase tracking-wider mb-1">Languages Supported</div>
              <div className="font-mono text-lg font-bold text-white flex items-baseline gap-1">
                <span>5</span> <span className="text-xs text-cyan-400 font-normal">REGIONAL</span>
              </div>
            </div>
            <div className="glass-panel px-4 py-3 rounded-xl text-left bg-black/60 border border-white/10">
              <div className="font-mono text-[10px] text-white/50 uppercase tracking-wider mb-1">ZK Proof Guarantee</div>
              <div className="font-mono text-lg font-bold text-emerald-400 flex items-baseline gap-1">
                <span>100%</span> <span className="text-xs text-emerald-300 font-normal">ZERO-PII</span>
              </div>
            </div>
          </div>

          {/* Scroll Indicator */}
          <div 
            className="z-20 pt-4 animate-bounce cursor-pointer opacity-70 hover:opacity-100 transition-opacity"
            onClick={() => document.getElementById('architecture-flow')?.scrollIntoView({ behavior: 'smooth' })}
          >
            <span className="font-mono text-[11px] text-cyan-300 tracking-widest block mb-1">
              SCROLL TO EXPLORE ARCHITECTURE
            </span>
            <span className="material-symbols-outlined text-cyan-400 text-lg">keyboard_arrow_down</span>
          </div>
        </section>

        {/* ============================================================== */}
        {/* ARCHITECTURE PIPELINE FLOW (The 6-Step Execution Story)       */}
        {/* ============================================================== */}
        <section id="architecture-flow" className="py-20 px-6 md:px-12 max-w-6xl mx-auto relative z-20">
          <div className="glass-panel rounded-3xl p-8 md:p-10 border border-white/10 bg-black/70 backdrop-blur-xl">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono text-xs uppercase tracking-wider mb-2">
                <Activity className="w-3.5 h-3.5" />
                <span>End-to-End System Architecture</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-mono font-bold text-white">
                How Krishi Saarthi Works
              </h2>
              <p className="text-xs text-white/50 font-sans mt-1 max-w-xl mx-auto">
                From raw orbital satellite passes to localized farmer action and zero-knowledge claim guarantees.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-center">
              <div className="p-3.5 bg-black/60 rounded-xl border border-white/10 flex flex-col justify-between">
                <Satellite className="w-6 h-6 mx-auto text-cyan-400 mb-1.5" />
                <div>
                  <p className="text-xs font-mono font-bold text-white">1. Satellite EO</p>
                  <p className="text-[10px] text-white/40 font-mono mt-0.5">Sentinel-2 MSI Level-2A</p>
                </div>
              </div>

              <div className="p-3.5 bg-black/60 rounded-xl border border-white/10 flex flex-col justify-between">
                <CloudRain className="w-6 h-6 mx-auto text-blue-400 mb-1.5" />
                <div>
                  <p className="text-xs font-mono font-bold text-white">2. Weather & Soil</p>
                  <p className="text-[10px] text-white/40 font-mono mt-0.5">Open-Meteo & Soil Card</p>
                </div>
              </div>

              <div className="p-3.5 bg-black/60 rounded-xl border border-white/10 flex flex-col justify-between">
                <Cpu className="w-6 h-6 mx-auto text-amber-400 mb-1.5" />
                <div>
                  <p className="text-xs font-mono font-bold text-white">3. Crop AI</p>
                  <p className="text-[10px] text-white/40 font-mono mt-0.5">XGBoost & Explainability</p>
                </div>
              </div>

              <div className="p-3.5 bg-black/60 rounded-xl border border-white/10 flex flex-col justify-between">
                <Stethoscope className="w-6 h-6 mx-auto text-red-400 mb-1.5" />
                <div>
                  <p className="text-xs font-mono font-bold text-white">4. Pathology</p>
                  <p className="text-[10px] text-white/40 font-mono mt-0.5">Grad-CAM Leaf Vision</p>
                </div>
              </div>

              <div className="p-3.5 bg-black/60 rounded-xl border border-white/10 flex flex-col justify-between">
                <Bot className="w-6 h-6 mx-auto text-emerald-400 mb-1.5" />
                <div>
                  <p className="text-xs font-mono font-bold text-white">5. Copilot</p>
                  <p className="text-[10px] text-white/40 font-mono mt-0.5">5 Regional Languages</p>
                </div>
              </div>

              <div className="p-3.5 bg-black/60 rounded-xl border border-white/10 flex flex-col justify-between">
                <Lock className="w-6 h-6 mx-auto text-purple-400 mb-1.5" />
                <div>
                  <p className="text-xs font-mono font-bold text-white">6. ZK Proofs</p>
                  <p className="text-[10px] text-white/40 font-mono mt-0.5">Groth16 & SHA-256</p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-center gap-4">
              <Link
                to="/krishi-saarthi"
                className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(0,163,255,0.3)] transition-all"
              >
                <span>Launch Operational Console</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* SYSTEM CAPABILITIES BENTO GRID                                */}
        {/* ============================================================== */}
        <section id="capabilities" className="py-20 px-6 md:px-12 max-w-7xl mx-auto relative z-20">
          <div className="mb-12">
            <div className="inline-flex items-center gap-2 text-cyan-400 font-mono text-xs tracking-widest uppercase mb-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              Core Functional Pillars
            </div>
            <h2 className="font-mono text-3xl md:text-4xl font-bold text-white mb-2">
              Digital Public Good Architecture
            </h2>
            <div className="h-[1px] w-full bg-gradient-to-r from-cyan-500/60 via-emerald-500/30 to-transparent" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Large Card : State Cooperation Registry */}
            <div className="md:col-span-8 glass-panel rounded-2xl p-8 flex flex-col justify-between min-h-[400px] relative overflow-hidden group bg-black/60 border border-white/10">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-30 group-hover:scale-110 transition-all duration-700 pointer-events-none">
                <Globe2 className="w-40 h-40 text-cyan-400" />
              </div>

              <div className="z-10">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 mb-5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="font-mono text-xs text-cyan-300 font-semibold tracking-wider">
                    The Big Differentiator: State Agricultural Model Registry
                  </span>
                </div>
                <h3 className="font-mono text-2xl md:text-3xl font-bold text-white mb-3">
                  Interoperable Cross-State Intelligence
                </h3>
                <p className="font-sans text-sm md:text-base text-white/70 max-w-xl leading-relaxed">
                  Breaks departmental silos by allowing state agricultural directorates and research institutes (Madhya Pradesh, Gujarat, Maharashtra, Punjab, Karnataka) to register, version, and federate their specialized agronomic and pathology models.
                </p>
              </div>

              <div className="mt-6 z-10 grid grid-cols-3 gap-3">
                <div className="bg-black/50 border border-white/10 rounded-xl p-3 text-center">
                  <span className="font-mono text-[10px] text-white/40 block mb-1">State Nodes</span>
                  <span className="font-mono text-base text-cyan-300 font-bold">5 Connected</span>
                </div>
                <div className="bg-black/50 border border-white/10 rounded-xl p-3 text-center">
                  <span className="font-mono text-[10px] text-white/40 block mb-1">Registry Standard</span>
                  <span className="font-mono text-base text-white font-bold">DPG Schema</span>
                </div>
                <div className="bg-black/50 border border-white/10 rounded-xl p-3 text-center">
                  <span className="font-mono text-[10px] text-white/40 block mb-1">Cross-Validation</span>
                  <span className="font-mono text-base text-emerald-400 font-bold">Active</span>
                </div>
              </div>
            </div>

            {/* Side Card 1 : Multilingual Copilot */}
            <div className="md:col-span-4 glass-panel rounded-2xl p-8 flex flex-col justify-between min-h-[400px] relative overflow-hidden group bg-black/60 border border-white/10">
              <div className="z-10">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-5">
                  <Bot className="w-6 h-6 text-cyan-400" />
                </div>
                <h3 className="font-mono text-xl font-bold text-white mb-2">
                  Grounded Regional Copilot
                </h3>
                <p className="font-sans text-xs text-white/70 leading-relaxed">
                  Multilingual AI conversational assistant strictly grounded in real telemetry (NDVI 0.64, 62 mm rain). Speaks Hindi, Marathi, Gujarati, Telugu, and English with audio briefings.
                </p>
              </div>

              <div className="mt-6 z-10">
                <div className="p-2.5 bg-black/50 rounded-xl border border-white/10 mb-3 text-[11px] font-mono flex items-center justify-between">
                  <span className="text-white/40">Grounded Accuracy:</span>
                  <span className="text-emerald-400 font-bold">Zero-Hallucination</span>
                </div>
                <Link
                  to="/krishi-saarthi"
                  className="w-full bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 rounded-xl py-2.5 font-mono text-xs text-cyan-300 transition-all flex items-center justify-center gap-2"
                >
                  <span>Open Copilot</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Side Card 2 : ZK-SNARK Parametric Engine */}
            <div className="md:col-span-4 glass-panel rounded-2xl p-8 flex flex-col justify-between min-h-[380px] relative overflow-hidden group bg-black/60 border border-white/10">
              <div>
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mb-5">
                  <Lock className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="font-mono text-xl font-bold text-white mb-2">
                  Groth16 Zero-Knowledge Proofs
                </h3>
                <p className="font-sans text-xs text-white/70 leading-relaxed">
                  Circom 2.1 circuits prove crop drought conditions (NDVI drop &gt; 30%) with mathematical certainty without ever exposing private farmer GPS coordinates or parcel boundaries.
                </p>
              </div>

              <div className="mt-6 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono text-purple-300">
                <span>Curve: BN128</span>
                <span>Latency: &lt; 200ms</span>
              </div>
            </div>

            {/* Bottom Card : Tamper-Proof SHA-256 Ledger */}
            <div className="md:col-span-8 glass-panel rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden bg-black/60 border border-white/10">
              <div className="flex-1 z-10">
                <div className="inline-flex items-center gap-1.5 text-emerald-400 font-mono text-xs uppercase mb-2">
                  <ShieldCheck className="w-4 h-4" />
                  Cryptographic Immutability
                </div>
                <h3 className="font-mono text-2xl font-bold text-white mb-2">
                  SHA-256 Merkle Claim Ledger
                </h3>
                <p className="font-sans text-xs sm:text-sm text-white/70 leading-relaxed">
                  Each claim determination is cryptographically chained into an audit trail. Insurers verify parametric triggers mathematically without accessing raw satellite pixels.
                </p>
              </div>

              <div className="flex-shrink-0 z-10">
                <Link
                  to="/ledger"
                  className="w-28 h-28 rounded-2xl border border-cyan-500/40 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center relative shadow-[0_0_25px_rgba(0,163,255,0.2)] hover:scale-105 transition-transform"
                >
                  <div className="absolute inset-0 rounded-2xl border-2 border-cyan-400 border-t-transparent animate-spin" />
                  <Database className="w-6 h-6 text-cyan-400 mb-1" />
                  <span className="font-mono text-[10px] text-cyan-300 font-bold text-center">
                    VALIDATED<br />LEDGER
                  </span>
                </Link>
              </div>
            </div>

          </div>
        </section>

        {/* ============================================================== */}
        {/* LIVE SATELLITE DEMONSTRATION PIPELINE SHOWCASE                 */}
        {/* ============================================================== */}
        <section id="live-pipeline" className="py-20 px-6 md:px-12 max-w-7xl mx-auto relative z-20">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 mb-2 font-mono text-xs text-cyan-400">
              <Activity className="w-3.5 h-3.5" />
              <span>LIVE EO RECONNAISSANCE ENGINE</span>
            </div>
            <h2 className="font-mono text-2xl md:text-3xl font-bold text-white">
              Demonstration Field Spectral Pipeline
            </h2>
            <p className="text-white/50 text-xs max-w-xl mx-auto font-sans mt-1">
              Multi-spectral reflectance computation showing baseline vs anomaly index extraction.
            </p>
          </div>

          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 bg-black/60">
            <AnalysisPipelineSnapshots
              farmName="Indore Malwa Soybean Parcel"
              cropType="soybean"
              centerLat={22.63497}
              centerLon={75.84983}
              areaHa={2.4}
              ndviCurrent={0.64}
              ndviBaseline={0.70}
              ndviDropPct={8.4}
              evi={0.52}
              ndwi={0.41}
              damageProb={0.12}
              riskCategory="LOW"
            />
          </div>
        </section>

      </div>

      {/* Footer */}
      <footer className="w-full bg-black/90 backdrop-blur-xl border-t border-white/10 relative z-20 py-10">
        <div className="flex flex-col md:flex-row justify-between items-center w-full px-6 md:px-12 max-w-7xl mx-auto gap-4">
          <div className="flex flex-col items-center md:items-start">
            <div className="flex items-center gap-2 mb-1">
              <Satellite className="h-5 w-5 text-cyan-400" />
              <span className="font-mono text-lg font-bold text-white">KRISHI SAARTHI</span>
            </div>
            <span className="font-mono text-[11px] text-white/40">
              Cooperative Agricultural Intelligence Network · Sentinel-2 · Digital Public Good
            </span>
          </div>
          
          <div className="flex flex-wrap justify-center gap-5 font-mono text-xs text-white/50">
            <Link to="/krishi-saarthi" className="hover:text-cyan-400 transition-colors">Command Center</Link>
            <Link to="/cooperation" className="hover:text-cyan-400 transition-colors">State Network</Link>
            <Link to="/doctor" className="hover:text-cyan-400 transition-colors">Crop Doctor</Link>
            <Link to="/weather" className="hover:text-cyan-400 transition-colors">Weather</Link>
            <Link to="/farms" className="hover:text-cyan-400 transition-colors">My Fields</Link>
            <Link to="/ledger" className="hover:text-cyan-400 transition-colors">ZK Ledger</Link>
            <Link to="/insurer" className="hover:text-cyan-400 transition-colors">Insurer</Link>
            <a href="#hero" className="hover:text-cyan-400 transition-colors">Back to Top ↑</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
