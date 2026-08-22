import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Satellite, Bot, ShieldCheck, CheckCircle2, Loader2, Lock, EyeOff, FileCheck, Sparkles, HelpCircle } from 'lucide-react';

interface ZKProofCardProps {
  claimId: string;
  eligible: boolean;
  isVerifying: boolean;
  predictedPayout?: number;
}

export default function ZKProofCard({ claimId, eligible, isVerifying, predictedPayout }: ZKProofCardProps) {
  const [step, setStep] = useState(0);
  const [showExplainer, setShowExplainer] = useState(false);

  useEffect(() => {
    if (isVerifying) {
      setStep(0);
      const timer1 = setTimeout(() => setStep(1), 1200);
      const timer2 = setTimeout(() => setStep(2), 2400);
      const timer3 = setTimeout(() => setStep(3), 3800);
      const timer4 = setTimeout(() => setStep(4), 5000);
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
        clearTimeout(timer4);
      };
    } else {
      setStep(4);
    }
  }, [isVerifying]);

  const steps = [
    {
      id: 1,
      icon: <Satellite className="w-5 h-5" />,
      label: '1. Satellite Crop Scan',
      simpleText: 'Sentinel-2 satellite captures vegetation drop from orbit',
      badge: 'Earth Observation',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    },
    {
      id: 2,
      icon: <Bot className="w-5 h-5" />,
      label: '2. AI Damage Assessment',
      simpleText: 'Machine learning model calculates exact crop loss percentage',
      badge: 'AI Audited',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    },
    {
      id: 3,
      icon: <Lock className="w-5 h-5" />,
      label: '3. Zero-Knowledge Privacy Seal',
      simpleText: 'Proves damage is real without revealing private farm coordinates or finances',
      badge: '100% Private (ZKP)',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    },
    {
      id: 4,
      icon: <ShieldCheck className="w-5 h-5" />,
      label: '4. Instant Ledger Approval',
      simpleText: 'Tamper-proof smart contract confirms payout eligibility with zero paperwork',
      badge: 'Instant Settlement',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    },
  ];

  return (
    <div className="bg-dark-800 rounded-2xl border border-dark-700 shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-dark-700 bg-dark-900/80 flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-500/10 border border-primary-500/30 text-primary-400 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Privacy-Verified Claim Proof (ZKP)
            </h2>
            <p className="text-xs text-slate-400 font-mono">Claim ID: {claimId}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowExplainer(!showExplainer)}
            className="px-3 py-1.5 rounded-xl text-xs font-medium bg-dark-700 hover:bg-dark-600 border border-dark-600 text-slate-300 flex items-center gap-1.5 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5 text-primary-400" />
            <span>{showExplainer ? 'Hide Explanation' : 'What is ZKP?'}</span>
          </button>

          {step === 4 && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-2"
            >
              {predictedPayout && predictedPayout > 0 && eligible && (
                <span className="px-3 py-1 rounded-xl font-mono font-black text-xs bg-emerald-500 text-black shadow-lg shadow-emerald-500/30">
                  ₹{predictedPayout.toLocaleString('en-IN')}
                </span>
              )}
              <div
                className={`px-3 py-1.5 rounded-full font-bold text-xs flex items-center gap-1.5 ${
                  eligible
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${eligible ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                <span>{eligible ? 'PAYOUT APPROVED ✓' : 'BELOW THRESHOLD'}</span>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Optional "ZKP in Simple Words" Interactive Explainer Box */}
      <AnimatePresence>
        {showExplainer && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-primary-950/30 border-b border-primary-500/20 p-4 text-xs space-y-2.5"
          >
            <div className="flex items-center gap-2 font-bold text-primary-300">
              <Sparkles className="w-4 h-4 text-primary-400" />
              <span>How Zero-Knowledge Proof Works in Simple Words</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="bg-dark-900/80 p-3 rounded-xl border border-dark-700 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                  <EyeOff className="w-3.5 h-3.5 text-purple-400" /> 1. Private Inputs
                </span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Your exact GPS coordinates, revenue, and trade data stay hidden on your device.
                </p>
              </div>
              <div className="bg-dark-900/80 p-3 rounded-xl border border-dark-700 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-blue-400" /> 2. Mathematical Proof
                </span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  A cryptographic formula checks: <em>"Did crop health drop past 30% threshold?"</em>
                </p>
              </div>
              <div className="bg-dark-900/80 p-3 rounded-xl border border-dark-700 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                  <FileCheck className="w-3.5 h-3.5 text-emerald-400" /> 3. Public Result
                </span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  The insurer sees only <strong>"YES: 100% Genuine Loss Confirmed"</strong> and releases payment.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4 Step Visual Progression */}
      <div className="p-6 space-y-5">
        {steps.map((s, i) => {
          const isActive = step === i;
          const isComplete = step > i;

          return (
            <div key={s.id} className="flex items-start gap-4">
              <div className="mt-0.5 relative">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center border-2 transition-all duration-500 ${
                    isComplete
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                      : isActive
                      ? 'bg-primary-500/20 border-primary-500 text-primary-400 animate-pulse'
                      : 'bg-dark-900 border-dark-700 text-slate-600'
                  }`}
                >
                  {isComplete ? <CheckCircle2 className="w-5 h-5" /> : s.icon}
                </div>
                {i < steps.length - 1 && (
                  <div
                    className={`absolute top-9 left-1/2 -ml-[1px] w-[2px] h-9 transition-colors duration-500 ${
                      isComplete ? 'bg-emerald-500/60' : 'bg-dark-700'
                    }`}
                  />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3
                    className={`text-sm font-bold flex items-center gap-2 ${
                      isComplete || isActive ? 'text-white' : 'text-slate-500'
                    }`}
                  >
                    <span>{s.label}</span>
                  </h3>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${s.badgeColor}`}>
                    {s.badge}
                  </span>
                </div>
                <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">{s.simpleText}</p>

                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-2 text-primary-400 flex items-center gap-2 text-xs font-mono bg-dark-900/70 border border-primary-500/30 p-2 rounded-lg"
                    >
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Cryptographic verification in progress…</span>
                    </motion.div>
                  )}
                  {isComplete && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-1 text-emerald-400 flex items-center gap-1.5 text-[11px] font-mono font-medium"
                    >
                      <span>✓ Verified &amp; Signed</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Banner */}
      {step === 4 && eligible && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-950/60 border-t border-emerald-500/30 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left"
        >
          <div className="flex items-center gap-2.5 text-emerald-300 text-xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>
              <strong>Zero-Knowledge Proof Validated:</strong> 100% tamper-proof parametric claim ready for instant disbursement.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {predictedPayout && predictedPayout > 0 && (
              <span className="text-xs font-mono font-extrabold text-emerald-300">
                ₹{predictedPayout.toLocaleString('en-IN')}
              </span>
            )}
            <span className="px-3 py-1 bg-emerald-500 text-black font-bold text-xs rounded-lg shadow-sm whitespace-nowrap">
              Payout Cleared
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
}

