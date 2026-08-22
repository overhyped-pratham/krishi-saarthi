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
  Scan,
  Compass,
  Globe
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
    <div className="min-h-screen bg-black text-white relative selection:bg-primary-container selection:text-white">
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
        {/* HERO SECTION : Matching the Reference Photographic Horizon */}
        {/* ============================================================== */}
        <section id="hero" className="min-h-screen flex flex-col justify-between items-center text-center px-6 pt-32 pb-12 relative">
          
          {/* Live Telemetry Status Pill */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="z-20 inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-black/60 border border-primary/30 backdrop-blur-md shadow-[0_0_25px_rgba(0,163,255,0.25)] mb-2"
          >
            <div className="relative flex h-2.5 w-2.5">
              <span className="radar-ping absolute inline-flex h-full w-full rounded-full bg-primary-container opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary-container" />
            </div>
            <span className="font-label-caps text-xs text-secondary-fixed tracking-wider font-semibold">
              SENTINEL-2 & PLANETSCOPE ACTIVE RECONNAISSANCE
            </span>
            <span className="text-xs text-white/40">|</span>
            <button 
              onClick={cycleOrbitSpeed} 
              className="font-label-caps text-xs text-primary-400 hover:text-white transition-colors flex items-center gap-1"
              title="Click to toggle orbital speed"
            >
              <Compass className="w-3.5 h-3.5" />
              {orbitModeName}
            </button>
            <span className="text-xs text-white/40">|</span>
            <button 
              onClick={() => setEarthStyle(prev => prev === 'cinematic' ? 'interstellar' : 'cinematic')} 
              className="font-label-caps text-xs text-emerald-400 hover:text-white transition-colors flex items-center gap-1 font-bold"
              title="Switch 3D Scene View"
            >
              <Globe className="w-3.5 h-3.5" />
              {earthStyle === 'cinematic' ? 'Switch: 3D Globe' : 'Switch: Horizon'}
            </button>
          </motion.div>

          {/* Central Hero Title Floating in Deep Space */}
          <div className="max-w-5xl mx-auto my-auto z-20 pt-4">
            <motion.h1 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1 }}
              className="font-display-lg text-5xl sm:text-7xl md:text-8xl lg:text-[94px] lg:leading-[102px] font-black tracking-widest uppercase mb-4 glow-text"
              style={{ letterSpacing: '0.14em' }}
            >
              AgriProof<span className="text-secondary-fixed">.AI</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.2 }}
              className="font-body-md text-base sm:text-lg md:text-xl text-slate-300 max-w-3xl mx-auto mb-8 leading-relaxed font-light drop-shadow-md"
            >
              Autonomous Earth observation & Zero-Knowledge AI risk infrastructure. 
              Verifying multi-spectral crop parameters from orbit with cryptographic proof and zero disclosure.
            </motion.p>

            {/* Interactive CTA Buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.4 }}
              className="flex flex-wrap items-center justify-center gap-4 z-20"
            >
              <Link
                to="/onboard"
                className="neon-button px-8 py-4 rounded-xl font-label-caps text-sm font-bold tracking-[0.15em] flex items-center gap-3 group"
              >
                <Satellite className="w-5 h-5 text-secondary-fixed group-hover:rotate-45 transition-transform" />
                <span>GET STARTED</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              
              <button 
                onClick={() => document.getElementById('live-pipeline')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-6 py-4 rounded-xl bg-black/70 hover:bg-white/10 border border-white/20 hover:border-primary/50 font-label-caps text-sm text-white font-medium tracking-wider backdrop-blur-md transition-all flex items-center gap-2"
              >
                <Scan className="w-4 h-4 text-primary" />
                <span>LIVE SATELLITE DEMO</span>
              </button>
            </motion.div>
          </div>

          {/* Bottom Floating Telemetry Bar */}
          <div className="w-full max-w-4xl z-20 mx-auto grid grid-cols-2 md:grid-cols-4 gap-3 pt-4">
            <div className="glass-panel px-4 py-3 rounded-xl text-left">
              <div className="font-label-caps text-[11px] text-slate-400 uppercase tracking-wider mb-1">Global Farmland</div>
              <div className="font-headline-lg text-lg font-bold text-white flex items-baseline gap-1">
                <span>1.42B</span> <span className="text-xs text-primary font-normal">HA</span>
              </div>
            </div>
            <div className="glass-panel px-4 py-3 rounded-xl text-left">
              <div className="font-label-caps text-[11px] text-slate-400 uppercase tracking-wider mb-1">Spectral Precision</div>
              <div className="font-headline-lg text-lg font-bold text-secondary-fixed flex items-baseline gap-1">
                <span>3.0</span> <span className="text-xs text-primary font-normal">METERS</span>
              </div>
            </div>
            <div className="glass-panel px-4 py-3 rounded-xl text-left">
              <div className="font-label-caps text-[11px] text-slate-400 uppercase tracking-wider mb-1">ZK Proof Latency</div>
              <div className="font-headline-lg text-lg font-bold text-white flex items-baseline gap-1">
                <span>184</span> <span className="text-xs text-primary font-normal">MS</span>
              </div>
            </div>
            <div className="glass-panel px-4 py-3 rounded-xl text-left">
              <div className="font-label-caps text-[11px] text-slate-400 uppercase tracking-wider mb-1">Privacy Guarantee</div>
              <div className="font-headline-lg text-lg font-bold text-primary-400 flex items-baseline gap-1">
                <span>100%</span> <span className="text-xs text-primary font-normal">ZERO-PII</span>
              </div>
            </div>
          </div>

          {/* Scroll Indicator */}
          <div 
            className="z-20 pt-4 animate-bounce cursor-pointer opacity-70 hover:opacity-100 transition-opacity"
            onClick={() => document.getElementById('capabilities')?.scrollIntoView({ behavior: 'smooth' })}
          >
            <span className="font-label-caps text-[11px] text-secondary-fixed-dim tracking-widest block mb-1">
              SCROLL TO EXPLORE
            </span>
            <span className="material-symbols-outlined text-secondary-fixed-dim text-lg">keyboard_arrow_down</span>
          </div>
        </section>

        {/* ============================================================== */}
        {/* SYSTEM CAPABILITIES BENTO GRID                                */}
        {/* ============================================================== */}
        <section id="capabilities" className="min-h-screen flex flex-col justify-center py-28 px-6 md:px-12 max-w-7xl mx-auto relative z-20">
          <div className="mb-14">
            <div className="inline-flex items-center gap-2 text-primary font-label-caps text-xs tracking-widest uppercase mb-3">
              <span className="w-2 h-2 rounded-full bg-primary" />
              Operational Layer
            </div>
            <h2 className="font-headline-lg text-3xl md:text-5xl font-extrabold text-white mb-4">
              <span className="text-primary-container font-bold">///</span> System Capabilities
            </h2>
            <div className="h-[1px] w-full bg-gradient-to-r from-primary/60 via-secondary-container/30 to-transparent" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Large Feature Card : Sensors & Orbit */}
            <div className="md:col-span-8 glass-panel rounded-2xl p-8 flex flex-col justify-between min-h-[420px] relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-35 group-hover:scale-110 transition-all duration-700 pointer-events-none">
                <span className="material-symbols-outlined text-[160px] text-primary">satellite_alt</span>
              </div>

              <div className="z-10">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/30 mb-6">
                  <span className="w-2 h-2 rounded-full bg-secondary-fixed animate-pulse" />
                  <span className="font-label-caps text-xs text-secondary-fixed font-semibold tracking-wider">
                    Live Constellation Ingest
                  </span>
                </div>
                <h3 className="font-headline-lg text-2xl md:text-3xl font-bold text-white mb-4">
                  Multi-Spectral Constellation & Soil Telemetry
                </h3>
                <p className="font-body-md text-sm md:text-base text-slate-300 max-w-xl leading-relaxed">
                  Continuous optical band synthesis across Sentinel-2 (B02-B12) and high-cadence PlanetScope. 
                  Calculates sub-pixel NDVI, EVI, NDWI, and NDMI with automated s2cloudless atmospheric correction.
                </p>
              </div>

              <div className="mt-8 z-10 grid grid-cols-3 gap-4">
                <div className="bg-black/50 border border-white/10 rounded-xl p-4">
                  <span className="font-label-caps text-xs text-slate-400 block mb-1">Revisit Time</span>
                  <span className="font-headline-lg text-lg text-secondary-fixed font-bold">24 Hours</span>
                </div>
                <div className="bg-black/50 border border-white/10 rounded-xl p-4">
                  <span className="font-label-caps text-xs text-slate-400 block mb-1">Spectral Bands</span>
                  <span className="font-headline-lg text-lg text-primary font-bold">13 Bands</span>
                </div>
                <div className="bg-black/50 border border-white/10 rounded-xl p-4">
                  <span className="font-label-caps text-xs text-slate-400 block mb-1">Cloud Masking</span>
                  <span className="font-headline-lg text-lg text-primary-400 font-bold">99.4% Acc</span>
                </div>
              </div>
            </div>

            {/* Side Feature Card 1 : AI Intelligence */}
            <div className="md:col-span-4 glass-panel rounded-2xl p-8 flex flex-col justify-between min-h-[420px] relative overflow-hidden group">
              <div className="z-10">
                <div className="w-12 h-12 rounded-xl bg-secondary-container/10 border border-secondary-container/30 flex items-center justify-center mb-6">
                  <Cpu className="w-6 h-6 text-secondary-fixed" />
                </div>
                <h3 className="font-headline-lg text-xl md:text-2xl font-bold text-white mb-3">
                  Predictive AI Risk Models
                </h3>
                <p className="font-body-sm text-sm text-slate-300 leading-relaxed">
                  Gradient-boosted XGBoost regressors and damage classifiers correlate weather anomaly indices, historical heat stress, and crop phenology to forecast yield losses before harvesting.
                </p>
              </div>

              <div className="mt-8 z-10">
                <div className="p-3 bg-black/50 rounded-xl border border-white/10 mb-4 text-xs font-label-caps flex items-center justify-between">
                  <span className="text-slate-400">Model Confidence:</span>
                  <span className="text-secondary-fixed font-bold">96.8% (AUC-ROC)</span>
                </div>
                <Link
                  to="/farms"
                  className="w-full bg-white/5 hover:bg-primary/20 border border-white/15 hover:border-primary/50 rounded-xl py-3 font-label-caps text-xs text-white transition-all flex items-center justify-center gap-2"
                >
                  <span>Inspect AI Predictions</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Side Feature Card 2 : ZK-SNARKs */}
            <div className="md:col-span-4 glass-panel rounded-2xl p-8 flex flex-col justify-between min-h-[380px] relative overflow-hidden group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center mb-6">
                  <Lock className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-headline-lg text-xl md:text-2xl font-bold text-white mb-3">
                  Groth16 Zero-Knowledge
                </h3>
                <p className="font-body-sm text-sm text-slate-300 leading-relaxed">
                  Circom 2.0 circuits verify parametric payout triggers (NDVI drop &gt; 30%, Rain anomaly &gt; 40%) with zero disclosure of farmer GPS coordinates or private yield data.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs font-label-caps text-primary">
                <span>Curve: BN128</span>
                <span>Constraint: 32-bit</span>
              </div>
            </div>

            {/* Full Width Card : Decentralized Claim Ledger */}
            <div className="md:col-span-8 glass-panel rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
              <div className="flex-1 z-10">
                <div className="inline-flex items-center gap-2 text-secondary-fixed font-label-caps text-xs tracking-wider uppercase mb-2">
                  <ShieldCheck className="w-4 h-4" />
                  Immutable Verification
                </div>
                <h3 className="font-headline-lg text-2xl font-bold text-white mb-3">
                  SHA-256 Tamper-Proof Claim Ledger
                </h3>
                <p className="font-body-md text-sm text-slate-300 leading-relaxed">
                  Cryptographic block hash chaining secures every payout determination. Insurers and re-insurers audit claims mathematically without accessing sensitive farmer records.
                </p>
              </div>

              <div className="flex-shrink-0 z-10">
                <Link
                  to="/ledger"
                  className="w-28 h-28 rounded-2xl border border-primary/40 bg-black/70 backdrop-blur-md flex flex-col items-center justify-center relative shadow-[0_0_30px_rgba(0,163,255,0.25)] hover:scale-105 transition-transform"
                >
                  <div className="absolute inset-0 rounded-2xl border-2 border-secondary-fixed border-t-transparent animate-spin" />
                  <Database className="w-7 h-7 text-primary mb-1" />
                  <span className="font-label-caps text-[10px] text-secondary-fixed font-bold text-center">
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
        <section id="live-pipeline" className="py-24 px-6 md:px-12 max-w-7xl mx-auto relative z-20">
          <div className="mb-10 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 mb-3 font-label-caps text-xs text-primary">
              <Activity className="w-3.5 h-3.5" />
              <span>LIVE EO RECONNAISSANCE ENGINE</span>
            </div>
            <h2 className="font-headline-lg text-3xl md:text-4xl font-extrabold text-white">
              Demonstration Field Alpha Spectral Pipeline
            </h2>
            <p className="text-slate-400 mt-2 text-sm max-w-2xl mx-auto font-body-md">
              Real-time multi-spectral processing over Patiala Wheat demonstration field showing baseline vs anomaly index computation.
            </p>
          </div>

          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10">
            <AnalysisPipelineSnapshots
              farmName="Patiala Wheat Demonstration Alpha"
              cropType="wheat"
              centerLat={30.3398}
              centerLon={76.3869}
              areaHa={8.5}
              ndviCurrent={0.36}
              ndviBaseline={0.76}
              ndviDropPct={52.6}
              evi={0.29}
              ndwi={-0.21}
              damageProb={0.88}
              riskCategory="HIGH"
            />
          </div>
        </section>

        {/* ============================================================== */}
        {/* ZERO-PII VAULT & SPECTRAL INDICES SECTION                     */}
        {/* ============================================================== */}
        <section id="sensors" className="py-24 px-6 md:px-12 max-w-7xl mx-auto relative z-20">
          <div className="glass-panel rounded-3xl p-8 md:p-12 border border-primary/30 relative overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              
              <div className="lg:col-span-7">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-fixed/10 border border-secondary-fixed/30 mb-4 font-label-caps text-xs text-secondary-fixed">
                  <span>POLYGON COMMITMENT HASH</span>
                </div>
                <h2 className="font-headline-lg text-3xl md:text-4xl font-extrabold text-white mb-4">
                  Zero-PII Farm Vault &amp; Sentinel-2 Sync
                </h2>
                <p className="font-body-md text-slate-300 text-sm md:text-base leading-relaxed mb-6">
                  Raw boundary coordinates are hashed using salted cryptographic commitments before leaving the client. 
                  Satellite multi-spectral queries execute over anonymized bounding boxes with synthetic differential privacy.
                </p>

                {/* Simulated Live Hex Output */}
                <div className="bg-black/80 rounded-xl p-4 border border-white/10 font-label-caps text-xs text-primary space-y-2">
                  <div className="flex items-center justify-between text-white/50 border-b border-white/10 pb-2">
                    <span>TELEMETRY PACKET</span>
                    <span className="text-emerald-400">STATUS: 200 OK</span>
                  </div>
                  <div className="text-secondary-fixed break-all font-mono text-[11px]">
                    HASH: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
                  </div>
                  <div className="flex justify-between text-xs text-slate-300 pt-1">
                    <span>ΔNDVI: <strong className="text-white">-41.5% (Drought Anomaly)</strong></span>
                    <span>Rain Anomaly: <strong className="text-white">-58.3%</strong></span>
                    <span>ZK State: <strong className="text-emerald-400">ELIGIBLE</strong></span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 space-y-4">
                <div className="bg-black/60 rounded-2xl p-6 border border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-headline-lg text-lg font-bold text-white">Spectral Indices</span>
                    <span className="font-label-caps text-xs text-primary">LIVE INGEST</span>
                  </div>
                  <div className="space-y-3 font-label-caps text-xs">
                    <div>
                      <div className="flex justify-between text-slate-300 mb-1">
                        <span>NDVI (Vegetation Vigour)</span>
                        <span className="text-white font-bold">0.34 (Baseline 0.74)</span>
                      </div>
                      <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                        <div className="bg-amber-400 h-full rounded-full" style={{ width: '46%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-slate-300 mb-1">
                        <span>NDWI (Water / Moisture)</span>
                        <span className="text-white font-bold">-0.24</span>
                      </div>
                      <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                        <div className="bg-cyan-400 h-full rounded-full" style={{ width: '32%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-slate-300 mb-1">
                        <span>EVI (Enhanced Index)</span>
                        <span className="text-white font-bold">0.28</span>
                      </div>
                      <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-400 h-full rounded-full" style={{ width: '38%' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* END-TO-END EXECUTION FLOW RIBBON                              */}
        {/* ============================================================== */}
        <section className="py-16 px-6 md:px-12 max-w-5xl mx-auto relative z-20">
          <div className="glass-panel rounded-2xl p-8 border border-white/10">
            <h4 className="text-center font-bold text-slate-300 text-xs uppercase tracking-widest mb-8 font-mono">
              Autonomous Parametric Execution Flow
            </h4>
            <div className="flex flex-col md:flex-row items-center justify-between text-center gap-4">
              <div className="flex-1 p-4 bg-black/60 rounded-xl border border-white/10 w-full md:w-auto">
                <Satellite className="w-8 h-8 mx-auto text-sky-400 mb-2" />
                <p className="text-xs font-bold text-white">1. Satellite EO</p>
                <p className="text-[10px] text-slate-400">PlanetScope + Sentinel-2</p>
              </div>
              <ArrowRight className="text-slate-600 hidden md:block" />
              <div className="flex-1 p-4 bg-black/60 rounded-xl border border-white/10 w-full md:w-auto">
                <Activity className="w-8 h-8 mx-auto text-emerald-400 mb-2" />
                <p className="text-xs font-bold text-white">2. AI Damage Model</p>
                <p className="text-[10px] text-slate-400">XGBoost &amp; Spectral Anomaly</p>
              </div>
              <ArrowRight className="text-slate-600 hidden md:block" />
              <div className="flex-1 p-4 bg-black/60 rounded-xl border border-white/10 w-full md:w-auto">
                <Lock className="w-8 h-8 mx-auto text-purple-400 mb-2" />
                <p className="text-xs font-bold text-white">3. Groth16 ZK Proof</p>
                <p className="text-[10px] text-slate-400">Private Policy Circuit</p>
              </div>
              <ArrowRight className="text-slate-600 hidden md:block" />
              <div className="flex-1 p-4 bg-black/60 rounded-xl border border-white/10 w-full md:w-auto">
                <Database className="w-8 h-8 mx-auto text-amber-400 mb-2" />
                <p className="text-xs font-bold text-white">4. Ledger Payout</p>
                <p className="text-[10px] text-slate-400">Instant Smart Contract</p>
              </div>
            </div>

            <div className="mt-10 text-center">
              <Link
                to="/onboard"
                className="inline-flex items-center gap-3 px-8 py-4 neon-button font-label-caps text-xs font-bold tracking-wider rounded-xl uppercase"
              >
                <span>Start Farm Analysis</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

      </div>

      {/* Footer */}
      <footer className="w-full bg-black/90 backdrop-blur-xl border-t border-white/10 relative z-20 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center w-full px-6 md:px-12 max-w-7xl mx-auto gap-6">
          <div className="flex flex-col items-center md:items-start">
            <div className="flex items-center gap-2 mb-2">
              <Satellite className="h-5 w-5 text-primary" />
              <span className="font-headline-lg text-xl font-extrabold text-white">AgriProof.AI</span>
            </div>
            <span className="font-label-caps text-xs text-slate-400">
              Precision Orbit &amp; Zero-Knowledge Agricultural Insurance Engine
            </span>
          </div>
          
          <div className="flex flex-wrap justify-center gap-6 font-label-caps text-xs text-slate-400">
            <Link to="/register" className="hover:text-primary transition-colors">Register Farm</Link>
            <Link to="/farms" className="hover:text-primary transition-colors">My Farms</Link>
            <Link to="/ledger" className="hover:text-primary transition-colors">Claim Ledger</Link>
            <a href="#hero" className="hover:text-primary transition-colors">Back to Top</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
