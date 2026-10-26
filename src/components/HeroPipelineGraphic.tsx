import React, { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Terminal, Globe, Server, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

export const HeroPipelineGraphic: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();
  const [activeStage, setActiveStage] = useState(0); // 0: Syntax, 1: DNS, 2: SMTP, 3: Outcome
  const [outcomeIndex, setOutcomeIndex] = useState(0); // 0: Deliverable, 1: Bounce, 2: Unknown

  const testEmails = [
    'alex@stripe.com',
    'invalid..syntax@domain',
    'support@example.com',
    'contact@catchall-host.io',
  ];

  const outcomes = [
    { label: 'Likely Deliverable', status: 'ok', icon: CheckCircle2, color: '#34D399', bg: 'rgba(52, 211, 153, 0.12)' },
    { label: 'Likely to Bounce', status: 'bad', icon: XCircle, color: '#FB7185', bg: 'rgba(251, 113, 133, 0.12)' },
    { label: 'Unknown Evidence', status: 'unknown', icon: AlertTriangle, color: '#FBBF24', bg: 'rgba(251, 191, 36, 0.12)' },
  ];

  useEffect(() => {
    if (shouldReduceMotion) return;

    const interval = setInterval(() => {
      setActiveStage((prev) => {
        if (prev >= 3) {
          setOutcomeIndex((o) => (o + 1) % outcomes.length);
          return 0;
        }
        return prev + 1;
      });
    }, 1800);

    return () => clearInterval(interval);
  }, [shouldReduceMotion, outcomes.length]);

  const currentOutcome = outcomes[outcomeIndex];
  const OutcomeIcon = currentOutcome.icon;
  const currentEmail = testEmails[outcomeIndex % testEmails.length];

  return (
    <div className="w-full max-w-4xl mx-auto p-6 sm:p-8 rounded-2xl bg-white/70 dark:bg-[#0C1426]/80 border border-slate-200 dark:border-slate-800 shadow-xl backdrop-blur-md relative overflow-hidden transition-colors">
      {/* Subtle background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-40 bg-cyan-500/10 dark:bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800/80 mb-6 text-xs">
        <div className="flex items-center gap-2 font-mono text-slate-500 dark:text-slate-400">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>LIVE VERIFICATION PIPELINE CHOREOGRAPHY</span>
        </div>
        <div className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400 font-semibold px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
          STAGE {activeStage + 1} / 4
        </div>
      </div>

      {/* Moving email chip */}
      <div className="mb-6 flex justify-center">
        <motion.div
          animate={shouldReduceMotion ? {} : { y: [0, -3, 0] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-[#111B33] border border-slate-300 dark:border-slate-700 font-mono text-xs text-slate-900 dark:text-cyan-300 shadow-md"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
          <span className="font-semibold">{currentEmail}</span>
        </motion.div>
      </div>

      {/* The 4-Node Pipeline Diagram */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
        {/* Node 1: Syntax */}
        <div
          className={`p-4 rounded-xl border transition-all duration-300 ${
            activeStage >= 0
              ? 'bg-slate-50 dark:bg-[#111B33] border-cyan-500/50 shadow-md shadow-cyan-500/10'
              : 'bg-transparent border-slate-200 dark:border-slate-800/60 opacity-60'
          }`}
        >
          <div className="flex items-center gap-2.5 mb-2">
            <div
              className={`p-2 rounded-lg ${
                activeStage === 0
                  ? 'bg-cyan-500 text-slate-950 font-bold scale-105'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              } transition-all`}
            >
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">1. Syntax Filter</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">RFC Practical Subset</div>
            </div>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-tight">
            254 char limit, no consecutive dots, non-numeric TLD check.
          </p>
        </div>

        {/* Node 2: DNS & MX */}
        <div
          className={`p-4 rounded-xl border transition-all duration-300 ${
            activeStage >= 1
              ? 'bg-slate-50 dark:bg-[#111B33] border-cyan-500/50 shadow-md shadow-cyan-500/10'
              : 'bg-transparent border-slate-200 dark:border-slate-800/60 opacity-60'
          }`}
        >
          <div className="flex items-center gap-2.5 mb-2">
            <div
              className={`p-2 rounded-lg ${
                activeStage === 1
                  ? 'bg-cyan-500 text-slate-950 font-bold scale-105'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              } transition-all`}
            >
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">2. DNS / MX Routing</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">RFC 7505 Null MX</div>
            </div>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-tight">
            Priority MX sorting & implicit A/AAAA host fallback.
          </p>
        </div>

        {/* Node 3: SMTP Probe */}
        <div
          className={`p-4 rounded-xl border transition-all duration-300 ${
            activeStage >= 2
              ? 'bg-slate-50 dark:bg-[#111B33] border-cyan-500/50 shadow-md shadow-cyan-500/10'
              : 'bg-transparent border-slate-200 dark:border-slate-800/60 opacity-60'
          }`}
        >
          <div className="flex items-center gap-2.5 mb-2">
            <div
              className={`p-2 rounded-lg ${
                activeStage === 2
                  ? 'bg-cyan-500 text-slate-950 font-bold scale-105'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              } transition-all`}
            >
              <Server className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">3. SMTP Probe</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">RCPT TO Handshake</div>
            </div>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-tight">
            Port 25 socket probe. Zero DATA sent; catch-all detection.
          </p>
        </div>

        {/* Node 4: Objective Outcome */}
        <div
          className={`p-4 rounded-xl border transition-all duration-300 ${
            activeStage >= 3
              ? 'bg-slate-50 dark:bg-[#111B33] shadow-md'
              : 'bg-transparent border-slate-200 dark:border-slate-800/60 opacity-60'
          }`}
          style={{ borderColor: activeStage >= 3 ? currentOutcome.color : undefined }}
        >
          <div className="flex items-center gap-2.5 mb-2">
            <div
              className="p-2 rounded-lg font-bold transition-all"
              style={{
                backgroundColor: activeStage >= 3 ? currentOutcome.color : 'rgba(148,163,184,0.1)',
                color: activeStage >= 3 ? '#060A16' : '#94A3B8',
              }}
            >
              <OutcomeIcon className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">4. Honest Outcome</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">7-Rule Hierarchy</div>
            </div>
          </div>
          <div
            className="text-[11px] font-semibold truncate"
            style={{ color: currentOutcome.color }}
          >
            {activeStage >= 3 ? currentOutcome.label : 'Evaluating...'}
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
        <span>Inconclusive cases are classified as Unknown</span>
        <span>Never claims absolute mailbox existence</span>
      </div>
    </div>
  );
};
