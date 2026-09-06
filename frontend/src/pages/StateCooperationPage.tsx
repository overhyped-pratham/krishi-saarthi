import { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  CheckCircle2,
  Building2,
  ChevronRight,
} from 'lucide-react';
import { api } from '../lib/api';

interface StateModel {
  id: string;
  state: string;
  institution: string;
  model_name: string;
  version: string;
  crop: string;
  model_type: string;
  supported_regions: string[];
  input_schema: Record<string, any>;
  output_schema: Record<string, any>;
  endpoint: string;
  language_support: string[];
  accuracy_metric: string;
  status: string;
  created_at: string;
}

export default function StateCooperationPage() {
  const [models, setModels] = useState<StateModel[]>([]);
  const [statesList, setStatesList] = useState<any[]>([]);
  const [selectedState, setSelectedState] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [inspectModel, setInspectModel] = useState<StateModel | null>(null);
  const [showRegisterModal, setShowRegisterModal] = useState<boolean>(false);

  // Registration Form State
  const [newModelState, setNewModelState] = useState('Rajasthan');
  const [newModelName, setNewModelName] = useState('Thar Mustard & Chickpea Frost Guard');
  const [newModelInstitution, setNewModelInstitution] = useState('Rajasthan Directorate of Agriculture (Jaipur)');
  const [newModelCrop, setNewModelCrop] = useState('Mustard');
  const [newModelType, setNewModelType] = useState<'Suitability' | 'Disease Vision' | 'Weather Risk' | 'Yield Forecaster' | 'Advisory'>('Weather Risk');
  const [newModelVersion, setNewModelVersion] = useState('1.0');
  const [newModelRegions, setNewModelRegions] = useState('Bharatpur, Alwar, Sikar, Jaipur');
  const [registerSuccess, setRegisterSuccess] = useState(false);

  // Load models and participating states
  useEffect(() => {
    api.krishiSaarthi.getModels().then((res) => {
      if (res.data) setModels(res.data);
    }).catch(() => {});

    api.krishiSaarthi.getStates().then((res) => {
      if (res.data) setStatesList(res.data);
    }).catch(() => {});
  }, []);

  const filteredModels = models.filter((m) => {
    const matchesState = selectedState === 'all' || m.state.toLowerCase() === selectedState.toLowerCase();
    const matchesType = selectedType === 'all' || m.model_type.toLowerCase() === selectedType.toLowerCase();
    const matchesSearch =
      !searchQuery.trim() ||
      m.model_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.crop.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.institution.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesState && matchesType && matchesSearch;
  });

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const regionsArray = newModelRegions.split(',').map((r) => r.trim()).filter(Boolean);
    const newEntry = {
      state: newModelState,
      institution: newModelInstitution,
      model_name: newModelName,
      version: newModelVersion,
      crop: newModelCrop,
      model_type: newModelType,
      supported_regions: regionsArray,
      endpoint: `https://agri.${newModelState.toLowerCase().replace(/\s+/g, '')}.gov.in/api/v1/models`,
      language_support: ['hi', 'en'],
      accuracy_metric: '93.6% validation accuracy on state field trials',
      status: 'active'
    };

    try {
      const res = await api.krishiSaarthi.registerModel(newEntry);
      if (res.data?.model) {
        setModels((prev) => [res.data.model, ...prev]);
        setRegisterSuccess(true);
        setTimeout(() => {
          setRegisterSuccess(false);
          setShowRegisterModal(false);
        }, 1500);
      }
    } catch (err) {
      console.error('Registration failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto space-y-8">
      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-[11px] font-mono tracking-widest text-emerald-400 uppercase">
              Digital Public Good (DPG) · Interoperable Architecture
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-mono font-bold text-white tracking-tight flex items-center gap-3">
            <span>Cooperative Agricultural Intelligence Network</span>
          </h1>
          <p className="text-xs sm:text-sm font-sans text-white/50 mt-1">
            Enabling Indian states and agricultural institutions to share, federate, and consume verified ML models and datasets.
          </p>
        </div>

        <button
          onClick={() => setShowRegisterModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs shadow-[0_0_20px_rgba(0,163,255,0.25)] transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Register State Model</span>
        </button>
      </div>

      {/* ── Participating States Metrics Banner ──────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {statesList.map((s) => (
          <button
            key={s.state}
            onClick={() => setSelectedState(selectedState === s.state ? 'all' : s.state)}
            className={`p-3.5 rounded-2xl border text-left transition-all ${
              selectedState === s.state
                ? 'bg-cyan-500/15 border-cyan-400 text-white shadow-[0_0_15px_rgba(0,163,255,0.2)]'
                : 'bg-white/[0.03] border-white/[0.08] text-white/70 hover:border-white/20 hover:text-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-white">{s.state}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            </div>
            <span className="text-[10px] text-white/40 font-mono block mt-1 truncate">
              {s.institution}
            </span>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/[0.06]">
              <span className="text-[10px] font-mono text-cyan-300">
                {s.models_count} Active Models
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/[0.06] text-white/60">
                Federated
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* ── Search & Filter Controls ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/[0.02] border border-white/[0.06] rounded-2xl p-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by state, crop, model name, or institute..."
            className="w-full bg-black/50 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-500/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar">
          <span className="text-xs font-mono text-white/40 shrink-0">Filter by Type:</span>
          {['all', 'Suitability', 'Disease Vision', 'Weather Risk'].map((t) => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition-all capitalize shrink-0 ${
                selectedType === t
                  ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-bold'
                  : 'bg-black/40 border border-white/[0.06] text-white/50 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* ── Registered Models Grid ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredModels.map((m) => (
          <div
            key={m.id}
            className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] hover:border-cyan-500/40 rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 group shadow-sm hover:shadow-[0_0_20px_rgba(0,163,255,0.1)]"
          >
            <div>
              {/* State & Type Badge */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-white/[0.06] text-white border border-white/10">
                  {m.state}
                </span>

                <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
                  {m.model_type}
                </span>
              </div>

              {/* Model Title & Crop */}
              <h3 className="font-mono font-bold text-sm text-white group-hover:text-cyan-200 transition-colors">
                {m.model_name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-mono text-emerald-400 font-semibold">
                  Crop: {m.crop}
                </span>
                <span className="text-[10px] text-white/40 font-mono">
                  v{m.version}
                </span>
              </div>

              {/* Institution */}
              <p className="text-[11px] text-white/50 font-sans mt-2 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-white/40 shrink-0" />
                <span className="truncate">{m.institution}</span>
              </p>

              {/* Accuracy & Regions */}
              <div className="mt-3.5 p-2.5 rounded-xl bg-black/40 border border-white/[0.04] space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-white/40">Benchmark Score:</span>
                  <span className="text-emerald-400 font-bold">{m.accuracy_metric}</span>
                </div>
                <div className="text-[10px] font-mono text-white/50 truncate">
                  Regions: {m.supported_regions?.join(', ')}
                </div>
              </div>
            </div>

            {/* Card Footer Actions */}
            <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {m.status.toUpperCase()}
              </span>

              <button
                onClick={() => setInspectModel(m)}
                className="flex items-center gap-1 text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                <span>Inspect Schema</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Inspect Model Schema Modal ───────────────────────────────────────── */}
      {inspectModel && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-[#0b0f17] border border-cyan-500/30 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-xs font-mono text-cyan-400">{inspectModel.state} · v{inspectModel.version}</span>
                <h3 className="text-base font-mono font-bold text-white mt-0.5">{inspectModel.model_name}</h3>
                <p className="text-xs text-white/50 font-sans mt-0.5">{inspectModel.institution}</p>
              </div>
              <button
                onClick={() => setInspectModel(null)}
                className="text-white/40 hover:text-white font-mono text-sm px-2 py-1 rounded"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <span className="text-[10px] text-white/40 uppercase block mb-1">Input Telemetry Schema:</span>
                <pre className="p-3 rounded-xl bg-black/80 border border-white/10 text-cyan-300 text-[11px] overflow-x-auto">
                  {JSON.stringify(inspectModel.input_schema, null, 2)}
                </pre>
              </div>

              <div>
                <span className="text-[10px] text-white/40 uppercase block mb-1">Generated Output Schema:</span>
                <pre className="p-3 rounded-xl bg-black/80 border border-white/10 text-emerald-300 text-[11px] overflow-x-auto">
                  {JSON.stringify(inspectModel.output_schema, null, 2)}
                </pre>
              </div>

              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between text-[11px]">
                <span className="text-white/50">Federated Endpoint:</span>
                <span className="text-white font-mono truncate max-w-[280px]">{inspectModel.endpoint}</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end">
              <button
                onClick={() => setInspectModel(null)}
                className="px-4 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 font-mono text-xs font-semibold"
              >
                Close Model Card
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Register New State Model Modal ───────────────────────────────────── */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-[#0b0f17] border border-white/20 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-base font-mono font-bold text-white">Register State Agricultural Model</h3>
                <p className="text-xs text-white/50 font-sans mt-0.5">
                  Contribute your state department's model to the National Cooperative Network
                </p>
              </div>
              <button
                onClick={() => setShowRegisterModal(false)}
                className="text-white/40 hover:text-white font-mono text-sm px-2 py-1 rounded"
              >
                ✕
              </button>
            </div>

            {registerSuccess ? (
              <div className="p-6 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto animate-bounce" />
                <h4 className="font-mono font-bold text-sm text-white">Model Successfully Registered!</h4>
                <p className="text-xs text-white/60 font-mono">Federation node is now active across all connected states.</p>
              </div>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-3 font-mono text-xs">
                <div>
                  <label className="text-[10px] text-white/50 block mb-1">State / Union Territory</label>
                  <input
                    type="text"
                    value={newModelState}
                    onChange={(e) => setNewModelState(e.target.value)}
                    required
                    className="w-full bg-black/60 border border-white/20 rounded-lg px-3 py-1.5 text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-white/50 block mb-1">Contributing Institution / Department</label>
                  <input
                    type="text"
                    value={newModelInstitution}
                    onChange={(e) => setNewModelInstitution(e.target.value)}
                    required
                    className="w-full bg-black/60 border border-white/20 rounded-lg px-3 py-1.5 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-white/50 block mb-1">Model Name</label>
                    <input
                      type="text"
                      value={newModelName}
                      onChange={(e) => setNewModelName(e.target.value)}
                      required
                      className="w-full bg-black/60 border border-white/20 rounded-lg px-3 py-1.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-white/50 block mb-1">Target Crop</label>
                    <input
                      type="text"
                      value={newModelCrop}
                      onChange={(e) => setNewModelCrop(e.target.value)}
                      required
                      className="w-full bg-black/60 border border-white/20 rounded-lg px-3 py-1.5 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-white/50 block mb-1">Model Type</label>
                    <select
                      value={newModelType}
                      onChange={(e: any) => setNewModelType(e.target.value)}
                      className="w-full bg-black/60 border border-white/20 rounded-lg px-3 py-1.5 text-white"
                    >
                      <option value="Suitability">Suitability</option>
                      <option value="Disease Vision">Disease Vision</option>
                      <option value="Weather Risk">Weather Risk</option>
                      <option value="Yield Forecaster">Yield Forecaster</option>
                      <option value="Advisory">Advisory</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-white/50 block mb-1">Version</label>
                    <input
                      type="text"
                      value={newModelVersion}
                      onChange={(e) => setNewModelVersion(e.target.value)}
                      required
                      className="w-full bg-black/60 border border-white/20 rounded-lg px-3 py-1.5 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-white/50 block mb-1">Supported Districts / Agro-climatic Regions</label>
                  <input
                    type="text"
                    value={newModelRegions}
                    onChange={(e) => setNewModelRegions(e.target.value)}
                    required
                    placeholder="Comma separated districts"
                    className="w-full bg-black/60 border border-white/20 rounded-lg px-3 py-1.5 text-white"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRegisterModal(false)}
                    className="px-3 py-1.5 rounded-lg border border-white/20 text-white/60 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold font-mono"
                  >
                    Submit to Registry
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
