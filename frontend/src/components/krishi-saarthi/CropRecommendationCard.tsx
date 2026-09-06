import React, { useState } from 'react';
import { Sprout, Info, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export interface CropRecommendation {
  crop: string;
  suitability_score: number;
  suitability_pct: number;
  rank: number;
  breakdown: {
    soil_suitability: number;
    rainfall_suitability: number;
    temperature_suitability: number;
    water_requirement_match: number;
    satellite_condition_fit: number;
  };
  rationale: string;
  season_fit: boolean;
  state_recommended: boolean;
}

interface Props {
  recommendations: CropRecommendation[];
  activeCrop?: string;
  onSelectCrop?: (cropName: string) => void;
}

export const CropRecommendationCard: React.FC<Props> = ({ recommendations, activeCrop, onSelectCrop }) => {
  const { t } = useLanguage();
  const [expandedRank, setExpandedRank] = useState<number | null>(1);

  return (
    <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-5 hover:border-emerald-500/30 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
            <Sprout className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h3 className="font-mono font-semibold text-sm text-white tracking-wide flex items-center gap-2">
              {t('cropRecommendation')}
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 font-mono">
                Suitability Rating
              </span>
            </h3>
            <p className="text-[11px] text-white/40 font-mono">
              ICAR Agronomy Benchmark · Soil & Weather Fit
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono text-emerald-400">
          <ShieldCheck className="w-3 h-3" />
          <span>Agronomic Fit</span>
        </div>
      </div>

      <div className="space-y-3">
        {recommendations.map((rec) => {
          const isExpanded = expandedRank === rec.rank;
          const isSelected = activeCrop?.toLowerCase() === rec.crop.toLowerCase();

          return (
            <div
              key={rec.crop}
              className={`border rounded-xl transition-all duration-200 ${
                isSelected
                  ? 'bg-emerald-950/20 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                  : 'bg-black/40 border-white/[0.06] hover:border-white/20'
              }`}
            >
              {/* Header Row */}
              <div
                onClick={() => setExpandedRank(isExpanded ? null : rec.rank)}
                className="p-3.5 flex items-center justify-between cursor-pointer select-none"
              >
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-md font-mono text-xs font-bold flex items-center justify-center ${
                    rec.rank === 1
                      ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                      : rec.rank === 2
                      ? 'bg-white/10 border border-white/20 text-white/90'
                      : 'bg-white/[0.04] text-white/50'
                  }`}>
                    #{rec.rank}
                  </span>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-white">{rec.crop}</span>
                      {rec.state_recommended && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">
                          State Recommended
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-white/40 block mt-0.5">
                      {rec.season_fit ? 'Season Optimal' : 'Alternative Rotation'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="font-mono font-bold text-base text-emerald-400">
                      {rec.suitability_pct}%
                    </span>
                    <span className="text-[10px] font-mono text-white/40 block">suitability</span>
                  </div>

                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-white/40" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-white/40" />
                  )}
                </div>
              </div>

              {/* Collapsible Explainability Details */}
              {isExpanded && (
                <div className="px-3.5 pb-3.5 pt-1 border-t border-white/[0.06] space-y-3">
                  {/* Feature Contribution Bars */}
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-white/50 block mb-2">
                      Feature Attribution Breakdown
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                      <div>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-white/60">Soil Suitability</span>
                          <span className="text-cyan-300 font-bold">{rec.breakdown.soil_suitability}%</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-cyan-400 h-full rounded-full transition-all duration-500"
                            style={{ width: `${rec.breakdown.soil_suitability}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-white/60">Rainfall Fit</span>
                          <span className="text-blue-300 font-bold">{rec.breakdown.rainfall_suitability}%</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-blue-400 h-full rounded-full transition-all duration-500"
                            style={{ width: `${rec.breakdown.rainfall_suitability}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-white/60">Temperature Fit</span>
                          <span className="text-amber-300 font-bold">{rec.breakdown.temperature_suitability}%</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-amber-400 h-full rounded-full transition-all duration-500"
                            style={{ width: `${rec.breakdown.temperature_suitability}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-white/60">Water Match</span>
                          <span className="text-teal-300 font-bold">{rec.breakdown.water_requirement_match}%</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-teal-400 h-full rounded-full transition-all duration-500"
                            style={{ width: `${rec.breakdown.water_requirement_match}%` }}
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-2">
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-white/60">Satellite Ground Vigor Fit</span>
                          <span className="text-emerald-300 font-bold">{rec.breakdown.satellite_condition_fit}%</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                            style={{ width: `${rec.breakdown.satellite_condition_fit}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Agronomic Rationale */}
                  <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                    <div className="flex items-start gap-2">
                      <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-white/70 font-sans leading-relaxed">
                        <strong className="text-white font-mono">{t('whyThisCrop')}</strong> {rec.rationale}
                      </p>
                    </div>
                  </div>

                  {onSelectCrop && (
                    <button
                      onClick={() => onSelectCrop(rec.crop)}
                      className="w-full py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-medium transition-all"
                    >
                      {isSelected ? '✓ Selected Field Crop' : `Set ${rec.crop} as Field Target`}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
