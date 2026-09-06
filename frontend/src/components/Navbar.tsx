import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Menu, X, Satellite, Plus, Bell, LogOut, Languages, 
  ChevronDown, Sparkles, MapPin, Stethoscope, CloudSun, Network, 
  ShieldCheck, Landmark, Presentation, Check, Radio
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import clsx from 'clsx';
import NotificationCenterModal from './NotificationCenterModal';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage, SUPPORTED_LANGUAGES, LanguageCode } from '../contexts/LanguageContext';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isModulesOpen, setIsModulesOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [activeAlertCount, setActiveAlertCount] = useState(2);
  const [isScrolled, setIsScrolled] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const modulesRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const langMenuRef = useRef<HTMLDivElement>(null);

  // Dynamic scroll styling
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdowns on route change
  useEffect(() => {
    setIsOpen(false);
    setIsModulesOpen(false);
    setIsUserMenuOpen(false);
    setIsLangOpen(false);
  }, [location.pathname]);

  // Click outside to close popovers
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modulesRef.current && !modulesRef.current.contains(e.target as Node)) {
        setIsModulesOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setIsLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch active alerts
  useEffect(() => {
    api.diseaseAnomalies
      .getAllActiveAlerts()
      .then((res) => {
        if (res.data) {
          setActiveAlertCount(res.data.length);
        }
      })
      .catch(() => {});
  }, [location.pathname]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  interface PrimaryLink {
    to: string;
    label: string;
    icon: any;
    highlight?: boolean;
    accent?: boolean;
    badge?: string;
  }

  // Primary navigation links visible directly on the bar
  const PRIMARY_LINKS: PrimaryLink[] = [
    { 
      to: '/krishi-saarthi', 
      label: language === 'hi' ? 'कृषि सारथी' : 'Krishi Saarthi', 
      icon: Sparkles,
      highlight: true
    },
    { 
      to: '/farms', 
      label: language === 'hi' ? 'मेरे खेत' : 'My Fields', 
      icon: MapPin 
    },
    { 
      to: '/doctor', 
      label: language === 'hi' ? 'क्रॉप डॉक्टर' : 'Crop Doctor', 
      icon: Stethoscope 
    },
    { 
      to: '/pitch', 
      label: language === 'hi' ? 'प्रदर्शन व अनुक्रम' : 'Display & Pitch', 
      icon: Presentation,
      accent: true 
    },
  ];

  // Secondary protocol & specialized modules in the dynamic dropdown
  const MODULE_ITEMS = [
    {
      to: '/cooperation',
      title: language === 'hi' ? 'राज्य सहयोग नेटवर्क' : 'State Cooperative Network',
      desc: language === 'hi' ? 'राज्यों के बीच साझा एआई और डेटा मॉडल' : 'Cross-state federated AI models & agro intelligence',
      icon: Network,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30'
    },
    {
      to: '/weather',
      title: language === 'hi' ? 'मौसम व रडार' : 'Weather & Radar',
      desc: language === 'hi' ? 'उपग्रह वर्षा विसंगति व तापमान ट्रैकिंग' : 'Satellite rainfall anomalies & extreme event alerts',
      icon: CloudSun,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30'
    },
    {
      to: '/ledger',
      title: language === 'hi' ? 'क्रिप्टो जेके लेजर' : 'ZK Blockchain Ledger',
      desc: language === 'hi' ? 'अपरिवर्तनीय SHA-256 ब्लॉकचेन सत्यापन' : 'Immutable SHA-256 parametric claim ledger',
      icon: ShieldCheck,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
    },
    {
      to: '/insurer',
      title: language === 'hi' ? 'बीमा कंपनी पोर्टल' : 'Insurer & Underwriter',
      desc: language === 'hi' ? 'पैरामीट्रिक क्लेम समीक्षा व एस्क्रो भुगतान' : 'Automated 5-sec claim assessment & payouts',
      icon: Landmark,
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30'
    },
  ];

  const isModuleActive = MODULE_ITEMS.some(item => 
    location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to))
  );

  const currentLangObj = SUPPORTED_LANGUAGES.find(l => l.code === language) || SUPPORTED_LANGUAGES[0];

  return (
    <>
      {/* ── Top Navigation Bar — Dynamic Glassmorphism ── */}
      <nav 
        className={clsx(
          "fixed top-0 w-full z-50 transition-all duration-300 print:hidden no-print",
          isScrolled 
            ? "bg-black/85 backdrop-blur-2xl border-b border-cyan-500/20 shadow-[0_4px_30px_rgba(0,0,0,0.8)] shadow-cyan-950/20" 
            : "bg-black/70 backdrop-blur-xl border-b border-white/[0.08]"
        )}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6">
          <div className="flex items-center justify-between h-16 gap-2">

            {/* Left: Brand Identity */}
            <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center group-hover:border-cyan-400/60 group-hover:bg-cyan-500/20 group-hover:shadow-[0_0_12px_rgba(0,163,255,0.4)] transition-all">
                <Satellite className="h-4 w-4 text-cyan-400 transition-transform group-hover:rotate-12" />
              </div>
              <div className="flex flex-col leading-none">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-sm sm:text-base tracking-wider text-white group-hover:text-cyan-200 transition-colors">
                    KRISHI<span className="text-cyan-400"> SAARTHI</span>
                  </span>
                  <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <Radio className="w-2.5 h-2.5 animate-pulse" /> S2 LIVE
                  </span>
                </div>
                <span className="text-[8.5px] sm:text-[9px] text-white/40 font-mono tracking-widest uppercase truncate max-w-[140px] sm:max-w-none">
                  Cooperative Agri Intelligence
                </span>
              </div>
            </Link>

            {/* Center: Structured Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1 font-mono text-xs">
              <Link
                to="/"
                className={clsx(
                  'px-3 py-1.5 rounded-lg font-medium tracking-wide transition-all',
                  location.pathname === '/'
                    ? 'text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 shadow-[0_0_10px_rgba(0,163,255,0.15)]'
                    : 'text-white/60 hover:text-white hover:bg-white/[0.05]'
                )}
              >
                {language === 'hi' ? 'होम' : 'Home'}
              </Link>

              {PRIMARY_LINKS.map(({ to, label, icon: Icon, badge, accent }) => {
                const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
                return (
                  <Link
                    key={to}
                    to={to}
                    className={clsx(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium tracking-wide transition-all relative',
                      isActive
                        ? accent 
                          ? 'text-cyan-300 bg-cyan-500/20 border border-cyan-400/40 shadow-[0_0_12px_rgba(0,163,255,0.25)] font-bold'
                          : 'text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 font-bold'
                        : 'text-white/60 hover:text-white hover:bg-white/[0.05]'
                    )}
                  >
                    <Icon className={clsx("w-3.5 h-3.5", isActive ? "text-cyan-400" : "text-white/40")} />
                    <span>{label}</span>
                    {badge && (
                      <span className="text-[8px] tracking-tight px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                        {badge}
                      </span>
                    )}
                  </Link>
                );
              })}

              {/* Dynamic Modules Dropdown */}
              <div className="relative" ref={modulesRef}>
                <button
                  type="button"
                  onClick={() => {
                    setIsModulesOpen(!isModulesOpen);
                    setIsUserMenuOpen(false);
                    setIsLangOpen(false);
                  }}
                  className={clsx(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium tracking-wide transition-all',
                    isModuleActive || isModulesOpen
                      ? 'text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 font-semibold'
                      : 'text-white/60 hover:text-white hover:bg-white/[0.05]'
                  )}
                >
                  <span>{language === 'hi' ? 'मॉड्यूल व नेटवर्क' : 'Modules'}</span>
                  <ChevronDown className={clsx("w-3.5 h-3.5 transition-transform duration-200", isModulesOpen && "rotate-180")} />
                </button>

                {/* Dropdown Card */}
                {isModulesOpen && (
                  <div className="absolute top-full left-0 mt-2 w-72 rounded-2xl bg-black/95 backdrop-blur-2xl border border-white/[0.12] p-2 shadow-2xl shadow-cyan-950/40 ring-1 ring-white/10 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3 py-2 border-b border-white/[0.06] mb-1">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold">
                        Specialized Protocols & Networks
                      </span>
                    </div>
                    <div className="space-y-1">
                      {MODULE_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const isCurrent = location.pathname === item.to || location.pathname.startsWith(item.to);
                        return (
                          <Link
                            key={item.to}
                            to={item.to}
                            onClick={() => setIsModulesOpen(false)}
                            className={clsx(
                              "flex items-start gap-3 p-2.5 rounded-xl transition-all group",
                              isCurrent 
                                ? "bg-cyan-500/15 border border-cyan-500/30" 
                                : "hover:bg-white/[0.06] border border-transparent"
                            )}
                          >
                            <div className={clsx("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border transition-all", item.color)}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className={clsx("text-xs font-mono font-bold tracking-wide", isCurrent ? "text-cyan-300" : "text-white group-hover:text-cyan-200")}>
                                  {item.title}
                                </span>
                                {isCurrent && <Check className="w-3 h-3 text-cyan-400" />}
                              </div>
                              <p className="text-[10.5px] text-white/40 line-clamp-1 mt-0.5 font-sans">
                                {item.desc}
                              </p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Side Utility Toolbar */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              
              {/* Language Switcher Popover */}
              <div className="relative" ref={langMenuRef}>
                <button
                  type="button"
                  onClick={() => {
                    setIsLangOpen(!isLangOpen);
                    setIsModulesOpen(false);
                    setIsUserMenuOpen(false);
                  }}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-mono text-white/80 hover:text-white transition-all"
                  title="Switch Language"
                >
                  <Languages className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="font-medium text-[11px]">{currentLangObj.nativeLabel}</span>
                  <ChevronDown className="w-3 h-3 text-white/40" />
                </button>

                {isLangOpen && (
                  <div className="absolute right-0 top-full mt-2 w-36 rounded-xl bg-black/95 backdrop-blur-2xl border border-white/[0.12] p-1.5 shadow-2xl ring-1 ring-white/10 z-50">
                    {SUPPORTED_LANGUAGES.map((l) => (
                      <button
                        key={l.code}
                        onClick={() => {
                          setLanguage(l.code as LanguageCode);
                          setIsLangOpen(false);
                        }}
                        className={clsx(
                          "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-mono transition-all text-left",
                          language === l.code
                            ? "bg-cyan-500/20 text-cyan-300 font-bold"
                            : "text-white/70 hover:bg-white/[0.08] hover:text-white"
                        )}
                      >
                        <span>{l.nativeLabel}</span>
                        {language === l.code && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Disease Anomaly Notification Bell */}
              <button
                type="button"
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

              {/* Primary Dynamic Action Button (Compact & Adaptive) */}
              <Link
                to="/onboard"
                className="hidden sm:inline-flex px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-mono font-bold items-center gap-1.5 shadow-[0_0_15px_rgba(0,163,255,0.25)] hover:shadow-[0_0_20px_rgba(0,163,255,0.4)] transition-all active:scale-95 tracking-wide shrink-0"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="truncate">{t('markField')}</span>
              </Link>

              {/* User Profile Popover / Sign In */}
              {user ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(!isUserMenuOpen);
                      setIsModulesOpen(false);
                      setIsLangOpen(false);
                    }}
                    className="flex items-center gap-1.5 p-1 sm:px-2.5 sm:py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-all"
                  >
                    <div className="w-6 h-6 rounded-md bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 text-xs font-mono font-bold">
                      {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <span className="hidden md:inline text-xs font-mono text-white/70 max-w-[90px] truncate">
                      {user.email?.split('@')[0]}
                    </span>
                    <ChevronDown className="w-3 h-3 text-white/40 hidden sm:inline" />
                  </button>

                  {/* User Profile Popover */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-black/95 backdrop-blur-2xl border border-white/[0.12] p-2 shadow-2xl ring-1 ring-white/10 z-50 animate-in fade-in duration-150">
                      <div className="px-3 py-2.5 border-b border-white/[0.08] mb-1">
                        <div className="text-[11px] font-mono text-white/40 uppercase tracking-widest">Signed in as</div>
                        <div className="text-xs font-mono font-bold text-white truncate mt-0.5">{user.email}</div>
                        <div className="text-[10px] text-cyan-400 font-mono mt-1 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                          Verified Farmer Partner
                        </div>
                      </div>

                      <div className="space-y-0.5">
                        <Link
                          to="/farms"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors"
                        >
                          <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                          <span>My Registered Parcels</span>
                        </Link>
                        <Link
                          to="/claims"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>ZK Parametric Claims</span>
                        </Link>
                        <button
                          type="button"
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors text-left"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/login"
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-semibold transition-all"
                >
                  Sign In
                </Link>
              )}

              {/* Mobile Hamburger Button */}
              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="lg:hidden p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors border border-white/[0.08]"
                aria-label="Toggle navigation menu"
              >
                {isOpen ? <X className="h-5 w-5 text-cyan-400" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* ── Mobile Slide-Down Navigation Menu ── */}
        {isOpen && (
          <div className="lg:hidden border-t border-white/[0.08] bg-black/95 backdrop-blur-2xl max-h-[calc(100vh-4rem)] overflow-y-auto animate-in slide-in-from-top-4 duration-200">
            <div className="px-4 py-4 space-y-4">
              
              {/* Core Links */}
              <div>
                <div className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase font-bold px-2 mb-1.5">
                  Core AI Intelligence
                </div>
                <div className="space-y-1">
                  <Link
                    to="/"
                    onClick={() => setIsOpen(false)}
                    className={clsx(
                      'block px-3 py-2.5 rounded-xl text-xs font-mono font-medium transition-colors',
                      location.pathname === '/' ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30' : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
                    )}
                  >
                    🏠 {language === 'hi' ? 'मुख्य पृष्ठ' : 'Home'}
                  </Link>
                  {PRIMARY_LINKS.map(({ to, label, icon: Icon, badge }) => (
                    <Link
                      key={to}
                      to={to}
                      onClick={() => setIsOpen(false)}
                      className={clsx(
                        'flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-mono font-medium transition-colors',
                        location.pathname.startsWith(to) ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold' : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-cyan-400" />
                        <span>{label}</span>
                      </div>
                      {badge && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">
                          {badge}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Protocol Modules */}
              <div>
                <div className="text-[10px] font-mono tracking-widest text-white/40 uppercase font-bold px-2 mb-1.5">
                  Specialized Modules
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {MODULE_ITEMS.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-colors"
                      >
                        <div className={clsx("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", item.color)}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-mono text-white font-semibold truncate">{item.title}</div>
                          <div className="text-[10px] text-white/40 truncate font-sans">{item.desc}</div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col gap-2">
                <Link
                  to="/onboard"
                  onClick={() => setIsOpen(false)}
                  className="w-full py-3 rounded-xl bg-cyan-500 text-black text-xs font-mono font-bold flex items-center justify-center gap-2 tracking-wide shadow-lg shadow-cyan-500/20"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>{t('markField')}</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* ── Dynamic Mobile Bottom Navigation Bar ── */}
      <nav className="fixed bottom-0 left-0 w-full h-[64px] flex justify-around items-center px-2 pb-safe bg-black/90 backdrop-blur-2xl border-t border-white/[0.08] shadow-[0_-4px_20px_rgba(0,0,0,0.8)] z-40 md:hidden">
        {[
          { to: '/', label: 'Home', emoji: '🏠' },
          { to: '/krishi-saarthi', label: 'Saarthi AI', emoji: '✨' },
          { to: '/farms', label: 'Fields', emoji: '🗺️' },
          { to: '/doctor', label: 'Doctor', emoji: '🩺' },
          { to: '/pitch', label: 'Pitch', emoji: '⚡' },
        ].map(({ to, label, emoji }) => {
          const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
          return (
            <Link
              key={to}
              to={to}
              className={clsx(
                'flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-150',
                isActive
                  ? 'text-cyan-300 bg-cyan-500/15 border border-cyan-500/30'
                  : 'text-white/40 hover:text-white/80',
              )}
            >
              <span className="text-lg leading-none">{emoji}</span>
              <span className={clsx('text-[9.5px] font-mono tracking-wide', isActive ? 'text-cyan-300 font-bold' : 'text-white/40')}>
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* AI Disease & Anomaly Notification Center Modal */}
      <NotificationCenterModal isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
    </>
  );
}
