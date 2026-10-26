import React from 'react';
import { ShieldCheck, CheckCircle, XCircle, AlertTriangle, Filter } from 'lucide-react';
import { Card } from '../ui/Card.tsx';
import { StatusFilterValue } from '../../lib/statusFilter.ts';
import { CountUp } from '../ui/CountUp.tsx';

interface SummaryCounts {
  all: number;
  deliverable: number;
  bounce: number;
  unknown: number;
}

interface SummaryCardsProps {
  counts: SummaryCounts;
  activeFilter?: string;
  onFilterChange?: (filter: StatusFilterValue) => void;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  counts,
  activeFilter = 'all',
  onFilterChange,
}) => {
  const handleCardClick = (target: StatusFilterValue) => {
    if (!onFilterChange) return;
    if (activeFilter === target && target !== 'all') {
      onFilterChange('all');
    } else {
      onFilterChange(target);
    }
  };

  const deliverablePct = counts.all > 0 ? Math.round((counts.deliverable / counts.all) * 100) : 0;
  const bouncePct = counts.all > 0 ? Math.round((counts.bounce / counts.all) * 100) : 0;
  const unknownPct = counts.all > 0 ? Math.round((counts.unknown / counts.all) * 100) : 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {/* Total Card */}
      <Card
        interactive
        onClick={() => handleCardClick('all')}
        className={`p-4! space-y-1 cursor-pointer transition-all ${
          activeFilter === 'all'
            ? 'ring-2 ring-cyan-500/80 bg-cyan-50/20 dark:bg-cyan-950/20'
            : 'opacity-85 hover:opacity-100'
        }`}
        role="button"
        aria-pressed={activeFilter === 'all'}
        aria-label={`Show all ${counts.all} verification results`}
        tabIndex={0}
      >
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span className="font-medium">Total Verified</span>
          <ShieldCheck className="w-4 h-4 text-slate-400" />
        </div>
        <div className="text-2xl font-extrabold text-[var(--text-primary)] font-mono tabular-nums">
          <CountUp value={counts.all} />
        </div>
        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
          <span>100% in-memory</span>
          {activeFilter === 'all' && (
            <span className="text-[var(--accent)] font-semibold flex items-center gap-0.5">
              <Filter className="w-2.5 h-2.5" /> All
            </span>
          )}
        </div>
      </Card>

      {/* Deliverable Card */}
      <Card
        interactive
        onClick={() => handleCardClick('likely_deliverable')}
        className={`p-4! space-y-1 bg-emerald-50/50 dark:bg-emerald-950/15 border-emerald-200 dark:border-emerald-500/20 cursor-pointer transition-all ${
          activeFilter === 'likely_deliverable'
            ? 'ring-2 ring-emerald-500 dark:ring-emerald-400 shadow-md shadow-emerald-500/10'
            : 'opacity-85 hover:opacity-100'
        }`}
        role="button"
        aria-pressed={activeFilter === 'likely_deliverable'}
        aria-label={`Filter to show only ${counts.deliverable} deliverable email results`}
        tabIndex={0}
      >
        <div className="flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-400">
          <span className="flex items-center gap-1 font-semibold">
            <CheckCircle className="w-3.5 h-3.5" /> Deliverable
          </span>
          <span className="font-mono text-[11px]">{deliverablePct}%</span>
        </div>
        <div className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-300 font-mono tabular-nums">
          <CountUp value={counts.deliverable} />
        </div>
        <div className="flex items-center justify-between text-[10px] text-emerald-600/80 dark:text-emerald-400/80">
          <span>Positive evidence found</span>
          {activeFilter === 'likely_deliverable' && (
            <span className="text-emerald-600 dark:text-emerald-300 font-bold flex items-center gap-0.5">
              <Filter className="w-2.5 h-2.5" /> Active
            </span>
          )}
        </div>
      </Card>

      {/* Bounce Card */}
      <Card
        interactive
        onClick={() => handleCardClick('likely_bounce')}
        className={`p-4! space-y-1 bg-rose-50/50 dark:bg-rose-950/15 border-rose-200 dark:border-rose-500/20 cursor-pointer transition-all ${
          activeFilter === 'likely_bounce'
            ? 'ring-2 ring-rose-500 dark:ring-rose-400 shadow-md shadow-rose-500/10'
            : 'opacity-85 hover:opacity-100'
        }`}
        role="button"
        aria-pressed={activeFilter === 'likely_bounce'}
        aria-label={`Filter to show only ${counts.bounce} bounce email results`}
        tabIndex={0}
      >
        <div className="flex items-center justify-between text-xs text-rose-700 dark:text-rose-400">
          <span className="flex items-center gap-1 font-semibold">
            <XCircle className="w-3.5 h-3.5" /> Bounce
          </span>
          <span className="font-mono text-[11px]">{bouncePct}%</span>
        </div>
        <div className="text-2xl font-extrabold text-rose-700 dark:text-rose-300 font-mono tabular-nums">
          <CountUp value={counts.bounce} />
        </div>
        <div className="flex items-center justify-between text-[10px] text-rose-600/80 dark:text-rose-400/80">
          <span>Permanent bounce / no MX</span>
          {activeFilter === 'likely_bounce' && (
            <span className="text-rose-600 dark:text-rose-300 font-bold flex items-center gap-0.5">
              <Filter className="w-2.5 h-2.5" /> Active
            </span>
          )}
        </div>
      </Card>

      {/* Unknown Card */}
      <Card
        interactive
        onClick={() => handleCardClick('unknown')}
        className={`p-4! space-y-1 bg-amber-50/50 dark:bg-amber-950/15 border-amber-200 dark:border-amber-500/20 cursor-pointer transition-all ${
          activeFilter === 'unknown'
            ? 'ring-2 ring-amber-500 dark:ring-amber-400 shadow-md shadow-amber-500/10'
            : 'opacity-85 hover:opacity-100'
        }`}
        role="button"
        aria-pressed={activeFilter === 'unknown'}
        aria-label={`Filter to show only ${counts.unknown} unknown email results`}
        tabIndex={0}
      >
        <div className="flex items-center justify-between text-xs text-amber-700 dark:text-amber-400">
          <span className="flex items-center gap-1 font-semibold">
            <AlertTriangle className="w-3.5 h-3.5" /> Unknown
          </span>
          <span className="font-mono text-[11px]">{unknownPct}%</span>
        </div>
        <div className="text-2xl font-extrabold text-amber-700 dark:text-amber-300 font-mono tabular-nums">
          <CountUp value={counts.unknown} />
        </div>
        <div className="flex items-center justify-between text-[10px] text-amber-600/80 dark:text-amber-400/80">
          <span>Catch-all or skipped probe</span>
          {activeFilter === 'unknown' && (
            <span className="text-amber-600 dark:text-amber-300 font-bold flex items-center gap-0.5">
              <Filter className="w-2.5 h-2.5" /> Active
            </span>
          )}
        </div>
      </Card>
    </div>
  );
};
