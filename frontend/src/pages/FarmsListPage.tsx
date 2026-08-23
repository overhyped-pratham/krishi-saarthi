import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, Farm } from '../lib/api';
import { offlineStorage } from '../lib/offlineStorage';
import { Tractor, Plus, ChevronRight, Activity, Clock, Scale, List, CheckSquare, Square, ArrowRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { FarmCompareView } from '../components/FarmCompareView';
import { OfflineStatusBanner } from '../components/OfflineStatusBanner';

const STATUS_COLORS: Record<string, string> = {
  registered: 'bg-slate-500/20 text-slate-400 border-slate-600',
  analyzing:  'bg-yellow-500/20 text-yellow-400 border-yellow-600',
  analyzed:   'bg-success/20 text-success border-success/50',
};

export default function FarmsListPage() {
  const [farms, setFarms] = useState<Farm[]>(() => offlineStorage.getFarms() || []);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'compare'>('list');
  const [selectedFarmIds, setSelectedFarmIds] = useState<string[]>([]);
  const [isFromCache, setIsFromCache] = useState<boolean>(false);

  const fetchFarms = () => {
    setLoading(true);
    api.farms.list()
      .then(res => {
        if (res.data) {
          setFarms(res.data);
          setIsFromCache(false);
          offlineStorage.saveFarms(res.data);
          if (res.data.length >= 2 && selectedFarmIds.length === 0) {
            setSelectedFarmIds([res.data[0].id, res.data[1].id]);
          } else if (res.data.length === 1 && selectedFarmIds.length === 0) {
            setSelectedFarmIds([res.data[0].id]);
          }
        }
      })
      .catch(err => {
        console.warn('[FarmsListPage] Network request failed, using cached list:', err);
        const cached = offlineStorage.getFarms();
        if (cached && cached.length > 0) {
          setFarms(cached);
          setIsFromCache(true);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchFarms();
  }, []);

  const handleToggleSelect = (farmId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedFarmIds(prev => {
      if (prev.includes(farmId)) {
        return prev.filter(id => id !== farmId);
      }
      if (prev.length >= 2) {
        // Replace second farm
        return [prev[0], farmId];
      }
      return [...prev, farmId];
    });
  };

  const handleOpenCompareWithSelection = (farmAId?: string, farmBId?: string) => {
    if (farmAId && farmBId) {
      setSelectedFarmIds([farmAId, farmBId]);
    }
    setViewMode('compare');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
            <Tractor className="text-primary-500 shrink-0" /> My Farms
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            Monitor registered parcels, inspect satellite telemetry, or compare fields.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* View Mode Toggle */}
          {farms.length >= 2 && (
            <div className="flex items-center bg-dark-800 border border-dark-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  viewMode === 'list'
                    ? 'bg-primary-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                List
              </button>
              <button
                onClick={() => setViewMode('compare')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  viewMode === 'compare'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Scale className="w-3.5 h-3.5" />
                Compare
              </button>
            </div>
          )}

          <Link
            to="/register"
            className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors text-sm active:scale-95"
          >
            <Plus className="w-4 h-4" /> Register New Farm
          </Link>
        </div>
      </div>

      {/* Offline Status Alert */}
      <div className="mb-6">
        <OfflineStatusBanner
          isFromCache={isFromCache}
          isLoading={loading}
          onRefresh={fetchFarms}
        />
      </div>

      {loading && farms.length === 0 ? (
        <div className="text-center py-16 text-slate-400">Loading farms telemetry…</div>
      ) : farms.length === 0 ? (
        <div className="text-center py-16 bg-dark-800 rounded-xl border border-dark-700">
          <Tractor className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 text-lg mb-2">No farms registered yet.</p>
          <Link to="/register" className="text-primary-400 hover:text-primary-300 underline text-sm">
            Register your first farm →
          </Link>
        </div>
      ) : viewMode === 'compare' ? (
        /* Split-View Mode Active */
        <div className="space-y-6">
          <FarmCompareView
            farms={farms}
            initialFarmAId={selectedFarmIds[0] || farms[0]?.id}
            initialFarmBId={selectedFarmIds[1] || (farms.length > 1 ? farms[1]?.id : farms[0]?.id)}
            onClose={() => setViewMode('list')}
          />
        </div>
      ) : (
        /* Standard List Mode */
        <div className="space-y-4">
          {/* Quick Selection Toolbar for Compare */}
          {farms.length >= 2 && (
            <div className="bg-dark-800/80 border border-dark-700 rounded-xl px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <span className="text-slate-300 flex items-center gap-2">
                <Scale className="w-4 h-4 text-emerald-400" />
                Select any 2 farms to compare them side-by-side ({selectedFarmIds.length}/2 selected):
              </span>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {selectedFarmIds.length === 2 && (
                  <button
                    onClick={() => setViewMode('compare')}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <span>Launch Side-by-Side Compare</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="space-y-3">
            {farms.map(farm => {
              const isSelected = selectedFarmIds.includes(farm.id);
              return (
                <div
                  key={farm.id}
                  className={`flex items-center gap-3 bg-dark-800 hover:bg-dark-750 border rounded-xl p-4 sm:p-5 transition-all group relative ${
                    isSelected
                      ? 'border-emerald-500/60 bg-emerald-950/10 shadow-lg shadow-emerald-500/5'
                      : 'border-dark-700 hover:border-dark-600'
                  }`}
                >
                  {/* Select Checkbox for quick multi-farm comparison */}
                  {farms.length >= 2 && (
                    <button
                      onClick={(e) => handleToggleSelect(farm.id, e)}
                      className="p-1 rounded text-slate-500 hover:text-emerald-400 transition-colors shrink-0"
                      title={isSelected ? 'Deselect for comparison' : 'Select to compare'}
                    >
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-600" />
                      )}
                    </button>
                  )}

                  <Link
                    to={`/dashboard/${farm.id}`}
                    className="flex-1 min-w-0"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <h3 className="text-white font-semibold truncate group-hover:text-primary-400 transition-colors text-sm sm:text-base">
                        {farm.name}
                      </h3>
                      <span className={`px-2 py-0.5 text-xs rounded-full border capitalize font-medium shrink-0 ${STATUS_COLORS[farm.status] ?? STATUS_COLORS.registered}`}>
                        {farm.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Activity className="w-3 h-3 text-emerald-400" />
                        {(farm.crop_type || 'Crop').charAt(0).toUpperCase() + (farm.crop_type || 'Crop').slice(1)}
                      </span>
                      <span>{(farm.area_hectares ?? 0).toFixed(1)} ha</span>
                      <span className="hidden sm:inline">{farm.policy_id || 'POLICY-001'}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {farm.created_at ? format(parseISO(farm.created_at), 'MMM dd, yyyy') : 'Recent'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-mono mt-1 truncate hidden sm:block">
                      {farm.center_lat != null && farm.center_lon != null
                        ? `${farm.center_lat.toFixed(4)}°N, ${farm.center_lon.toFixed(4)}°E`
                        : 'Coordinates calibrated'} · {(farm.commitment_hash || '').substring(0, 16)}…
                    </p>
                  </Link>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {farms.length >= 2 && (
                      <button
                        onClick={() => {
                          const otherFarm = farms.find(f => f.id !== farm.id);
                          handleOpenCompareWithSelection(farm.id, otherFarm?.id);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-300 border border-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors hidden sm:flex"
                      >
                        <Scale className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Compare</span>
                      </button>
                    )}

                    <Link
                      to={`/dashboard/${farm.id}`}
                      className="p-2 text-slate-500 group-hover:text-slate-300 transition-colors"
                      title="Open Dashboard"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

