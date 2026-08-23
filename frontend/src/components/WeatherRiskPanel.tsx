import { motion } from 'framer-motion';
import { Droplets, ThermometerSun, CloudRain, Waves } from 'lucide-react';

interface WeatherRiskPanelProps {
  drought_risk: number;
  flood_risk: number;
  heat_stress: number;
  rainfall_mm_30d: number;
  rainfall_anomaly_pct: number;
}

const normalizeRisk = (val?: number) => {
  if (val == null) return 0;
  return Math.abs(val) <= 1.0 ? val * 100 : val;
};

const RiskBar = ({ label, value, icon, max = 100 }: { label: string, value: number, icon: React.ReactNode, max?: number }) => {
  const normalized = Math.max(0, Math.min(100, normalizeRisk(value)));
  const percent = (normalized / max) * 100;
  
  let colorClass = "bg-success";
  let textClass = "text-success";
  if (percent > 25) { colorClass = "bg-warning"; textClass = "text-warning"; }
  if (percent > 55) { colorClass = "bg-orange-500"; textClass = "text-orange-500"; }
  if (percent > 75) { colorClass = "bg-danger"; textClass = "text-danger"; }

  return (
    <div className="mb-4 last:mb-0">
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center gap-2 text-slate-300 text-sm font-medium">
          {icon} {label}
        </div>
        <span className={`font-bold ${textClass}`}>{normalized.toFixed(1)}%</span>
      </div>
      <div className="w-full h-2 bg-dark-900 rounded-full overflow-hidden">
        <motion.div 
          className={`h-full ${colorClass}`}
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
    </div>
  );
};

export default function WeatherRiskPanel(props: WeatherRiskPanelProps) {
  return (
    <div className="bg-dark-800 p-6 rounded-xl border border-dark-700 shadow-md h-full">
      <h3 className="text-lg font-semibold text-white mb-6">Environmental Risks</h3>
      
      <div className="space-y-6">
        <RiskBar 
          label="Drought Risk" 
          value={props.drought_risk} 
          icon={<Droplets className="w-4 h-4 text-warning" />} 
        />
        <RiskBar 
          label="Flood Risk" 
          value={props.flood_risk} 
          icon={<Waves className="w-4 h-4 text-blue-500" />} 
        />
        <RiskBar 
          label="Heat Stress" 
          value={props.heat_stress} 
          icon={<ThermometerSun className="w-4 h-4 text-orange-500" />} 
        />
        
        <div className="pt-4 border-t border-dark-700 mt-4">
          <div className="flex items-center gap-2 text-slate-300 text-sm font-medium mb-2">
            <CloudRain className="w-4 h-4 text-blue-400" /> 30-Day Rainfall
          </div>
          <div className="flex justify-between items-end">
            <span className="text-2xl font-bold text-white">{props.rainfall_mm_30d.toFixed(1)} <span className="text-sm text-slate-400 font-normal">mm</span></span>
            <span className={`text-sm font-medium ${props.rainfall_anomaly_pct >= 0 ? 'text-success' : 'text-danger'}`}>
              {props.rainfall_anomaly_pct >= 0 ? '+' : ''}{props.rainfall_anomaly_pct.toFixed(1)}% vs norm
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
