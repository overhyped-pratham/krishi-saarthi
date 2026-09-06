import React, { useState } from 'react';
import { Layers, Sliders } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export interface SoilData {
  nitrogen_kg_ha: number;
  phosphorus_kg_ha: number;
  potassium_kg_ha: number;
  ph: number;
  organic_carbon_pct: number;
  soil_moisture_vwc_pct: number;
  soil_type: string;
  data_source: 'farmer_entered' | 'regional_spatial_default' | 'state_soil_health_card';
}

interface Props {
  soil: SoilData;
  onChange: (updated: SoilData) => void;
  state: string;
}

export const SoilIntelligencePanel: React.FC<Props> = ({ soil, onChange, state }) => {
  const { t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);

  const getStatus = (val: number, low: number, high: number) => {
    if (val < low) return { label: 'Deficient', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' };
    if (val > high) return { label: 'Surplus', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' };
    return { label: 'Optimal', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' };
  };

  const nStatus = getStatus(soil.nitrogen_kg_ha, 30, 60);
  const pStatus = getStatus(soil.phosphorus_kg_ha, 20, 50);
  const kStatus = getStatus(soil.potassium_kg_ha, 30, 60);
  const ocStatus = soil.organic_carbon_pct >= 0.65 
    ? { label: 'Good (>0.6%)', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' }
    : { label: 'Low (<0.6%)', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' };

  return (
    <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-5 hover:border-cyan-500/30 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
            <Layers className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h3 className="font-mono font-semibold text-sm text-white tracking-wide flex items-center gap-2">
              {t('soilIntelligence')}
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-mono">
                {soil.data_source === 'farmer_entered' ? 'Farmer Verified' : 'State Soil Card (ICAR)'}
              </span>
            </h3>
            <p className="text-[11px] text-white/40 font-mono">
              {state} · {soil.soil_type}
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsEditing(!isEditing)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.1] text-xs font-mono text-white/80 transition-all"
        >
          <Sliders className="w-3.5 h-3.5 text-cyan-400" />
          <span>{isEditing ? 'Save Profile' : 'Adjust Soil Values'}</span>
        </button>
      </div>

      {isEditing ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
          <div>
            <label className="text-[10px] font-mono text-white/50 block mb-1">Nitrogen (N) kg/ha</label>
            <input
              type="number"
              value={soil.nitrogen_kg_ha}
              onChange={(e) => onChange({ ...soil, nitrogen_kg_ha: parseFloat(e.target.value) || 0, data_source: 'farmer_entered' })}
              className="w-full bg-black/60 border border-white/20 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white"
            />
          </div>
          <div>
            <label className="text-[10px] font-mono text-white/50 block mb-1">Phosphorus (P) kg/ha</label>
            <input
              type="number"
              value={soil.phosphorus_kg_ha}
              onChange={(e) => onChange({ ...soil, phosphorus_kg_ha: parseFloat(e.target.value) || 0, data_source: 'farmer_entered' })}
              className="w-full bg-black/60 border border-white/20 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white"
            />
          </div>
          <div>
            <label className="text-[10px] font-mono text-white/50 block mb-1">Potassium (K) kg/ha</label>
            <input
              type="number"
              value={soil.potassium_kg_ha}
              onChange={(e) => onChange({ ...soil, potassium_kg_ha: parseFloat(e.target.value) || 0, data_source: 'farmer_entered' })}
              className="w-full bg-black/60 border border-white/20 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white"
            />
          </div>
          <div>
            <label className="text-[10px] font-mono text-white/50 block mb-1">Soil pH</label>
            <input
              type="number"
              step="0.1"
              value={soil.ph}
              onChange={(e) => onChange({ ...soil, ph: parseFloat(e.target.value) || 7.0, data_source: 'farmer_entered' })}
              className="w-full bg-black/60 border border-white/20 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white"
            />
          </div>
          <div>
            <label className="text-[10px] font-mono text-white/50 block mb-1">Organic Carbon (%)</label>
            <input
              type="number"
              step="0.01"
              value={soil.organic_carbon_pct}
              onChange={(e) => onChange({ ...soil, organic_carbon_pct: parseFloat(e.target.value) || 0.6, data_source: 'farmer_entered' })}
              className="w-full bg-black/60 border border-white/20 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white"
            />
          </div>
          <div>
            <label className="text-[10px] font-mono text-white/50 block mb-1">Moisture VWC (%)</label>
            <input
              type="number"
              step="0.5"
              value={soil.soil_moisture_vwc_pct}
              onChange={(e) => onChange({ ...soil, soil_moisture_vwc_pct: parseFloat(e.target.value) || 20, data_source: 'farmer_entered' })}
              className="w-full bg-black/60 border border-white/20 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white"
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          <div className="bg-black/40 border border-white/[0.06] rounded-xl p-3">
            <span className="text-[10px] font-mono text-white/40 block">Nitrogen (N)</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-base font-mono font-bold text-white">{soil.nitrogen_kg_ha}</span>
              <span className="text-[10px] text-white/40 font-mono">kg/ha</span>
            </div>
            <span className={`inline-block text-[9px] font-mono px-1.5 py-0.5 rounded border mt-1.5 ${nStatus.bg} ${nStatus.color}`}>
              {nStatus.label}
            </span>
          </div>

          <div className="bg-black/40 border border-white/[0.06] rounded-xl p-3">
            <span className="text-[10px] font-mono text-white/40 block">Phosphorus (P)</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-base font-mono font-bold text-white">{soil.phosphorus_kg_ha}</span>
              <span className="text-[10px] text-white/40 font-mono">kg/ha</span>
            </div>
            <span className={`inline-block text-[9px] font-mono px-1.5 py-0.5 rounded border mt-1.5 ${pStatus.bg} ${pStatus.color}`}>
              {pStatus.label}
            </span>
          </div>

          <div className="bg-black/40 border border-white/[0.06] rounded-xl p-3">
            <span className="text-[10px] font-mono text-white/40 block">Potassium (K)</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-base font-mono font-bold text-white">{soil.potassium_kg_ha}</span>
              <span className="text-[10px] text-white/40 font-mono">kg/ha</span>
            </div>
            <span className={`inline-block text-[9px] font-mono px-1.5 py-0.5 rounded border mt-1.5 ${kStatus.bg} ${kStatus.color}`}>
              {kStatus.label}
            </span>
          </div>

          <div className="bg-black/40 border border-white/[0.06] rounded-xl p-3">
            <span className="text-[10px] font-mono text-white/40 block">pH Level</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-base font-mono font-bold text-white">{soil.ph}</span>
              <span className="text-[10px] text-white/40 font-mono">index</span>
            </div>
            <span className="inline-block text-[9px] font-mono px-1.5 py-0.5 rounded border mt-1.5 bg-cyan-500/10 border-cyan-500/20 text-cyan-300">
              {soil.ph >= 6.5 && soil.ph <= 7.5 ? 'Neutral' : soil.ph < 6.5 ? 'Acidic' : 'Alkaline'}
            </span>
          </div>

          <div className="bg-black/40 border border-white/[0.06] rounded-xl p-3 col-span-2 sm:col-span-1">
            <span className="text-[10px] font-mono text-white/40 block">Organic Carbon</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-base font-mono font-bold text-white">{soil.organic_carbon_pct}%</span>
            </div>
            <span className={`inline-block text-[9px] font-mono px-1.5 py-0.5 rounded border mt-1.5 ${ocStatus.bg} ${ocStatus.color}`}>
              {ocStatus.label}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
