import React from 'react';
import { ShieldCheck, Check } from 'lucide-react';
import { EmailResult } from '../types.ts';
import { calculateListHealth } from '../lib/intelligence.ts';
import { CountUp } from './ui/CountUp.tsx';

interface HealthAuditCardProps {
  results: EmailResult[];
}

export const HealthAuditCard: React.FC<HealthAuditCardProps> = ({ results }) => {
  if (results.length === 0) return null;

  const audit = calculateListHealth(results);

  const getGradeBadge = () => {
    switch (audit.grade) {
      case 'A+':
      case 'A':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
      case 'B':
        return 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30';
      case 'C':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
      case 'D':
      case 'F':
      default:
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30';
    }
  };

  return (
    <div className="p-5 rounded-2xl bg-[var(--bg-raised)] border border-[var(--border-subtle)] shadow-sm dark:shadow-xl transition-colors space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
              Deliverability Health Grade & Hygiene Audit
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Evaluated across syntax integrity, domain routing, and bounce probability
            </p>
          </div>
        </div>

        {/* Score & Grade Circle */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="text-right">
            <div className="text-xs text-[var(--text-faint)] font-mono">List Quality Score</div>
            <div className="text-lg font-bold text-[var(--text-primary)] font-mono">
              <CountUp value={audit.score} /> / 100
            </div>
          </div>
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center font-extrabold text-xl font-mono border ${getGradeBadge()}`}
          >
            {audit.grade}
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)]">
          <div className="text-[11px] text-[var(--text-secondary)] font-medium">Deliverable</div>
          <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono">
            <CountUp value={audit.deliverableCount} />
          </div>
        </div>
        <div className="p-3 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)]">
          <div className="text-[11px] text-[var(--text-secondary)] font-medium">Bounces Detected</div>
          <div className="text-lg font-bold text-rose-600 dark:text-rose-400 font-mono">
            <CountUp value={audit.bounceCount} />
          </div>
        </div>
        <div className="p-3 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)]">
          <div className="text-[11px] text-[var(--text-secondary)] font-medium">Inconclusive / Unknown</div>
          <div className="text-lg font-bold text-amber-600 dark:text-amber-400 font-mono">
            <CountUp value={audit.unknownCount} />
          </div>
        </div>
        <div className="p-3 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)]">
          <div className="text-[11px] text-[var(--text-secondary)] font-medium">Disposable Burners</div>
          <div className="text-lg font-bold text-cyan-600 dark:text-cyan-400 font-mono">
            <CountUp value={audit.disposableCount} />
          </div>
        </div>
      </div>

      {/* Recommendations Checklist */}
      <div className="space-y-2 pt-1">
        <div className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider">
          Actionable Hygiene Recommendations
        </div>
        <div className="space-y-1.5">
          {audit.recommendations.map((rec, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2 p-2.5 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)]"
            >
              <Check className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" />
              <span>{rec}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
