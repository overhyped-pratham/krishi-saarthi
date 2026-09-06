import { Link } from 'react-router-dom';
import { Satellite, ShieldCheck, Activity, Cpu, Stethoscope, Bot, ArrowRight, Globe, Sprout } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero */}
      <section className="min-h-screen flex flex-col justify-center items-center text-center px-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Satellite className="w-5 h-5 text-cyan-400" />
            <span className="text-xs font-mono text-cyan-400 tracking-widest uppercase">
              Cooperative Agricultural Intelligence
            </span>
          </div>

          <h1 className="text-5xl sm:text-7xl font-bold tracking-tight mb-4">
            KRISHI <span className="text-cyan-400">SAARTHI</span>
          </h1>

          <p className="text-lg text-white/60 mb-8 max-w-xl mx-auto">
            From satellite intelligence to farmer action. A Digital Public Good connecting
            Indian states into an interoperable agricultural intelligence network.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/krishi-saarthi"
              className="px-6 py-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-sm flex items-center gap-2 transition-colors"
            >
              <Sprout className="w-4 h-4" />
              Enter Dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/farms"
              className="px-6 py-3 rounded-lg bg-white/10 hover:bg-white/15 border border-white/20 text-white font-medium text-sm flex items-center gap-2 transition-colors"
            >
              <Globe className="w-4 h-4 text-cyan-400" />
              My Fields
            </Link>
            <Link
              to="/login"
              className="px-6 py-3 rounded-lg bg-white/10 hover:bg-white/15 border border-white/20 text-white font-medium text-sm transition-colors"
            >
              Sign In
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16">
            {[
              { label: 'Connected States', value: '5', sub: 'FEDERATED' },
              { label: 'Spectral Precision', value: '10m', sub: 'RESOLUTION' },
              { label: 'Languages', value: '5', sub: 'REGIONAL' },
              { label: 'ZK Proof', value: '100%', sub: 'ZERO-PII' },
            ].map((s) => (
              <div key={s.label} className="p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="text-[10px] font-mono text-white/40 uppercase tracking-wider mb-1">{s.label}</div>
                <div className="text-xl font-bold text-white">
                  {s.value} <span className="text-xs text-cyan-400 font-normal">{s.sub}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-white mb-2">How It Works</h2>
          <p className="text-sm text-white/50">From satellite passes to farmer action in 6 steps.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { icon: Satellite, title: 'Satellite EO', desc: 'Sentinel-2 MSI Level-2A', color: 'text-cyan-400' },
            { icon: Activity, title: 'Weather & Soil', desc: 'Open-Meteo & Soil Card', color: 'text-blue-400' },
            { icon: Cpu, title: 'Crop AI', desc: 'XGBoost & Explainability', color: 'text-amber-400' },
            { icon: Stethoscope, title: 'Pathology', desc: 'Grad-CAM Leaf Vision', color: 'text-red-400' },
            { icon: Bot, title: 'Copilot', desc: '5 Regional Languages', color: 'text-emerald-400' },
            { icon: ShieldCheck, title: 'ZK Proofs', desc: 'Groth16 & SHA-256', color: 'text-purple-400' },
          ].map((item) => (
            <div key={item.title} className="p-5 rounded-lg bg-white/5 border border-white/10">
              <item.icon className={`w-6 h-6 ${item.color} mb-3`} />
              <div className="font-semibold text-white text-sm mb-1">{item.title}</div>
              <div className="text-xs text-white/40">{item.desc}</div>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link
            to="/krishi-saarthi"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-sm transition-colors"
          >
            Launch Dashboard
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 max-w-5xl mx-auto">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-6 rounded-lg bg-white/5 border border-white/10">
            <h3 className="font-semibold text-white mb-2">State Cooperation</h3>
            <p className="text-sm text-white/50">
              Cross-state federated AI models. States register, version, and share specialized
              agronomic models through a standardized DPG schema.
            </p>
          </div>
          <div className="p-6 rounded-lg bg-white/5 border border-white/10">
            <h3 className="font-semibold text-white mb-2">Multilingual Copilot</h3>
            <p className="text-sm text-white/50">
              AI assistant grounded in real telemetry. Speaks Hindi, Marathi, Gujarati,
              Telugu, and English with audio briefings.
            </p>
          </div>
          <div className="p-6 rounded-lg bg-white/5 border border-white/10">
            <h3 className="font-semibold text-white mb-2">ZK Parametric Insurance</h3>
            <p className="text-sm text-white/50">
              Cryptographic proofs verify crop drought conditions without exposing
              private farmer GPS coordinates or parcel boundaries.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Satellite className="w-4 h-4 text-cyan-400" />
            <span className="font-mono text-sm font-bold text-white">KRISHI SAARTHI</span>
          </div>
          <div className="flex gap-5 text-xs font-mono text-white/40">
            <Link to="/krishi-saarthi" className="hover:text-cyan-400 transition-colors">Dashboard</Link>
            <Link to="/farms" className="hover:text-cyan-400 transition-colors">Fields</Link>
            <Link to="/doctor" className="hover:text-cyan-400 transition-colors">Crop Doctor</Link>
            <Link to="/login" className="hover:text-cyan-400 transition-colors">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
