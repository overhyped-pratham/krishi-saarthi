import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Satellite, Plus, Zap, Bell, LogOut, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import clsx from 'clsx';
import NotificationCenterModal from './NotificationCenterModal';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

const NAV_LINKS = [
  { to: '/', label: 'Overview', icon: 'dashboard' },
  { to: '/farms', label: 'My Fields', icon: 'agriculture' },
  { to: '/doctor', label: 'Crop Doctor', icon: 'local_hospital' },
  { to: '/weather', label: 'Weather', icon: 'cloud' },
  { to: '/market', label: 'Market', icon: 'trending_up' },
  { to: '/ledger', label: 'ZK Ledger', icon: 'verified' },
  { to: '/insurer', label: 'Insurer', icon: 'shield' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [activeAlertCount, setActiveAlertCount] = useState(2);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  useEffect(() => {
    // Poll or fetch active disease anomaly count
    api.diseaseAnomalies
      .getAllActiveAlerts()
      .then((res) => {
        if (res.data) {
          setActiveAlertCount(res.data.length);
        }
      })
      .catch(() => {});
  }, [location.pathname]);

  return (
    <>
      {/* ── Top Navigation Bar — Dark Space Minimalist ── */}
      <nav className="fixed top-0 w-full z-50 bg-black/70 backdrop-blur-xl border-b border-white/[0.06] shadow-[0_1px_0_0_rgba(0,163,255,0.08)] transition-all duration-300 print:hidden no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Brand */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center group-hover:border-cyan-400/60 group-hover:bg-cyan-500/20 transition-all">
                <Satellite className="h-4 w-4 text-cyan-400" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-mono font-bold text-base tracking-wider text-white group-hover:text-cyan-100 transition-colors">
                  AGRIPROF<span className="text-cyan-400">.AI</span>
                </span>
                <span className="text-[9px] text-white/30 font-mono tracking-widest uppercase">
                  Sentinel-2 · ZK Engine
                </span>
              </div>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-0.5 font-mono text-xs">
              {NAV_LINKS.map(({ to, label }) => {
                const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
                return (
                  <Link
                    key={to}
                    to={to}
                    className={clsx(
                      'px-3.5 py-2 rounded-lg font-medium tracking-wide transition-all duration-200',
                      isActive
                        ? 'text-cyan-300 bg-cyan-500/10 border border-cyan-500/20'
                        : 'text-white/50 hover:text-white/90 hover:bg-white/[0.04]',
                    )}
                  >
                    {label}
                  </Link>
                );
              })}
            </div>

            {/* Right CTA */}
            <div className="hidden md:flex items-center gap-3">
              {/* Disease Anomaly Notification Bell */}
              <button
                onClick={() => setIsNotifOpen(true)}
                title="AI Disease & Anomaly Notifications"
                className="relative p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white/70 hover:text-white transition-all group"
              >
                <Bell className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                {activeAlertCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-black">
                    {activeAlertCount}
                  </span>
                )}
              </button>

              {/* Live Orbit Indicator */}
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[10px] font-mono text-white/40">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                <span>ORBIT ACTIVE</span>
              </div>

              <Link
                to="/onboard"
                className="px-4 py-2 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 hover:border-cyan-400/50 text-cyan-300 text-xs font-mono font-semibold flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,163,255,0.15)] hover:shadow-[0_0_20px_rgba(0,163,255,0.25)] transition-all active:scale-95 tracking-wide"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>ANALYZE FIELD</span>
              </Link>

              {/* User + Sign Out */}
              {user ? (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08]">
                    <User className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-[11px] font-mono text-white/60 max-w-[120px] truncate">
                      {user.email}
                    </span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    title="Sign out"
                    className="p-2 rounded-lg bg-white/[0.04] hover:bg-red-500/10 border border-white/[0.08] hover:border-red-500/30 text-white/50 hover:text-red-400 transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-semibold transition-all"
                >
                  Sign In
                </Link>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center gap-2 md:hidden">
              <button
                onClick={() => setIsNotifOpen(true)}
                className="relative p-1.5 rounded-lg bg-white/[0.04] text-white/70 hover:text-white"
              >
                <Bell className="w-4 h-4 text-cyan-400" />
                {activeAlertCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white">
                    {activeAlertCount}
                  </span>
                )}
              </button>
              <div className="w-7 h-7 rounded-full border border-cyan-500/30 overflow-hidden shrink-0">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBkOja07M3e2a_VQPc0xXDFLISczngZDv1yUdIxNJi994WdlKEAR5F4B2cRYEo-qgAJ-X-Z7IDmyrmmhr4trh9T8m8MdQ7wtc-e14sXV81o4YDchTp79VQAhLxTR02fBnx9qKnA5E4cXWAYkEZC_HpDmcceap6xGhIksa6ny96NfI8xMRnOXZUhvDDawPJJrkY8nv9hb_yv8bpaq1s3ljCaGq_2p2ChORvGIww9Q-P1cVGNGhbuWeBDyQ"
                  alt="Farmer"
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile slide-down menu */}
        <div className={clsx('md:hidden border-t border-white/[0.06] bg-black/90 backdrop-blur-xl', isOpen ? 'block' : 'hidden')}>
          <div className="px-4 pt-3 pb-5 space-y-1">
            {NAV_LINKS.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setIsOpen(false)}
                className={clsx(
                  'block px-4 py-3 rounded-lg text-sm font-mono tracking-wide transition-colors',
                  location.pathname === to
                    ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20'
                    : 'text-white/40 hover:text-white hover:bg-white/[0.04]',
                )}
              >
                {label}
              </Link>
            ))}
            <div className="pt-3 flex gap-2">
              <Link
                to="/onboard"
                onClick={() => setIsOpen(false)}
                className="flex-1 py-3 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold flex items-center justify-center gap-1.5 tracking-wide"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>ANALYZE FIELD</span>
              </Link>
              <Link
                to="/register"
                onClick={() => setIsOpen(false)}
                className="py-3 px-4 rounded-lg bg-white/[0.04] border border-white/10 text-white/50 text-xs font-mono flex items-center justify-center"
              >
                <span>Draw Field</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Mobile Bottom Navigation — Dark Space Style ── */}
      <nav className="fixed bottom-0 left-0 w-full h-[68px] flex justify-around items-center px-2 pb-safe bg-black/90 backdrop-blur-xl border-t border-white/[0.06] shadow-[0_-1px_0_rgba(0,163,255,0.08)] z-50 md:hidden">
        {[
          { to: '/', label: 'Home', icon: 'dashboard' },
          { to: '/weather', label: 'Weather', icon: 'cloud' },
          { to: '/market', label: 'Market', icon: 'trending_up' },
          { to: '/farms', label: 'Fields', icon: 'agriculture' },
        ].map(({ to, label, icon }) => {
          const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
          return (
            <Link
              key={to}
              to={to}
              className={clsx(
                'flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-150',
                isActive
                  ? 'text-cyan-300 bg-cyan-500/10'
                  : 'text-white/30 hover:text-white/70',
              )}
            >
              <span className={clsx('material-symbols-outlined text-xl', isActive ? 'text-cyan-300' : '')}>{icon}</span>
              <span className={clsx('text-[10px] font-mono tracking-wide', isActive ? 'text-cyan-300' : 'text-white/30')}>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* AI Disease & Anomaly Notification Center Modal */}
      <NotificationCenterModal isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
    </>
  );
}
