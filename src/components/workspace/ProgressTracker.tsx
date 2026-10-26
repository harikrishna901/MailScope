import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, Globe, Server, CheckCircle2 } from 'lucide-react';

interface ProgressTrackerProps {
  total?: number;
  totalCount?: number;
  isRunning?: boolean;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  total,
  totalCount,
  isRunning = true,
}) => {
  const effectiveTotal = total || totalCount || 0;
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    const timer0 = setTimeout(() => setCurrentStep(0), 0);
    const timer1 = setTimeout(() => setCurrentStep(1), 350);
    const timer2 = setTimeout(() => setCurrentStep(2), 850);
    const timer3 = setTimeout(() => setCurrentStep(3), 1400);

    return () => {
      clearTimeout(timer0);
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [isRunning]);

  if (!isRunning) return null;

  const steps = [
    { label: 'Normalizing & Syntax', icon: Terminal },
    { label: 'DNS & MX Routing', icon: Globe },
    { label: 'SMTP Response Audit', icon: Server },
    { label: '7-Rule Decision Engine', icon: CheckCircle2 },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="surface p-5 space-y-4"
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-[var(--text-secondary)]">
            Analyzing {effectiveTotal} unique address{effectiveTotal > 1 ? 'es' : ''}...
          </span>
          <span className="text-[var(--accent)] font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-ping" />
            Step {currentStep + 1} of 4
          </span>
        </div>

        {/* Multi-step progress bars */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isCompleted = idx < currentStep;
            const isCurrent = idx === currentStep;

            return (
              <div
                key={step.label}
                className={`p-2.5 rounded-xl border text-xs transition-all ${
                  isCurrent
                    ? 'bg-[var(--accent)]/10 border-[var(--accent)]/40 text-[var(--text-primary)] shadow-sm'
                    : isCompleted
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                    : 'bg-[var(--bg-canvas)] border-[var(--border-subtle)] text-[var(--text-muted)] opacity-60'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="font-semibold text-[11px] truncate">{step.label}</span>
                </div>
                <div className="w-full bg-[var(--border-subtle)] h-1 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full ${
                      isCompleted ? 'bg-emerald-500' : isCurrent ? 'bg-[var(--accent)]' : 'bg-transparent'
                    }`}
                    initial={{ width: '0%' }}
                    animate={{ width: isCompleted ? '100%' : isCurrent ? '75%' : '0%' }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
