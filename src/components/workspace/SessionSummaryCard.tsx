import React from 'react';
import {
  TrendingUp,
  ShieldCheck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Activity,
  Layers,
} from 'lucide-react';
import { SessionStats, getHealthRating } from '../../lib/sessionStats.ts';
import { Card } from '../ui/Card.tsx';
import { CountUp } from '../ui/CountUp.tsx';

interface SessionSummaryCardProps {
  stats: SessionStats;
  onReset?: () => void;
  className?: string;
}

export const SessionSummaryCard: React.FC<SessionSummaryCardProps> = ({
  stats,
  onReset,
  className = '',
}) => {
  const rating = getHealthRating(stats.successRate, stats.totalProcessed);

  // Percentages for segmented bar
  const deliverablePct =
    stats.totalProcessed > 0
      ? Math.round((stats.deliverableCount / stats.totalProcessed) * 100)
      : 0;
  const bouncePct =
    stats.totalProcessed > 0
      ? Math.round((stats.bounceCount / stats.totalProcessed) * 100)
      : 0;
  const unknownPct =
    stats.totalProcessed > 0
      ? Math.max(0, 100 - deliverablePct - bouncePct)
      : 0;

  return (
    <Card
      data-testid="session-summary-card-container"
      className={`overflow-hidden border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[var(--bg-raised)]/95 shadow-sm dark:shadow-xl backdrop-blur-sm ${className}`}
    >
      {/* Top Banner / Session Status */}
      <div className="p-5 sm:p-6 pb-4 border-b border-slate-200 dark:border-slate-800/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  Current Session Summary
                </h3>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                  Live Session
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Cumulative deliverability performance across all checks and batches in this browser session
              </p>
            </div>
          </div>

          {/* Action / Reset Button */}
          {onReset && stats.totalProcessed > 0 && (
            <button
              onClick={onReset}
              type="button"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-lg transition-colors border border-transparent hover:border-slate-300 dark:hover:border-slate-700 self-start sm:self-auto cursor-pointer"
              title="Reset session counters back to 0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Session</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Metric Spotlight Grid */}
      <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-center" data-testid="session-summary-card">
        {/* Left Spotlight: Overall Success Rate Percentage */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              Overall Success Rate
            </span>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${rating.badgeClass}`}
            >
              {rating.label}
            </span>
          </div>

          <div className="flex items-baseline gap-3">
            <div
              data-testid="overall-success-rate"
              className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-slate-900 dark:text-white"
            >
              <CountUp value={stats.successRate} suffix="%" formatter={(v) => v.toFixed(1)} />
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              deliverability ratio
            </div>
          </div>

          {/* Segmented Deliverability Bar */}
          <div className="space-y-1.5">
            <div className="h-3 w-full bg-slate-100 dark:bg-slate-800/80 rounded-full overflow-hidden flex shadow-inner">
              {deliverablePct > 0 && (
                <div
                  style={{ width: `${deliverablePct}%` }}
                  className="bg-emerald-500 h-full transition-all duration-500 ease-out"
                  title={`Deliverable: ${deliverablePct}%`}
                />
              )}
              {unknownPct > 0 && (
                <div
                  style={{ width: `${unknownPct}%` }}
                  className="bg-amber-400 h-full transition-all duration-500 ease-out"
                  title={`Unknown: ${unknownPct}%`}
                />
              )}
              {bouncePct > 0 && (
                <div
                  style={{ width: `${bouncePct}%` }}
                  className="bg-rose-500 h-full transition-all duration-500 ease-out"
                  title={`Bounce: ${bouncePct}%`}
                />
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {rating.description}
            </p>
          </div>
        </div>

        {/* Right Spotlight: Total Addresses Processed */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-500" />
              Total Addresses Processed
            </span>
            <span className="text-xs font-mono text-slate-400 dark:text-slate-500">
              Session Total
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span
              data-testid="session-total-processed"
              className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-slate-900 dark:text-white"
            >
              <CountUp value={stats.totalProcessed} />
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              emails verified
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>
              {stats.batchesCount > 0
                ? `${stats.batchesCount} batch${stats.batchesCount === 1 ? '' : 'es'} processed in memory`
                : 'Awaiting first verification'}
            </span>
          </div>
        </div>
      </div>

      {/* Granular Session Breakdown Row */}
      <div className="bg-slate-50/50 dark:bg-slate-900/30 border-t border-slate-200 dark:border-slate-800/80 px-5 sm:px-6 py-3.5 grid grid-cols-3 gap-3">
        {/* Deliverable Stat */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Deliverable</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm sm:text-base font-bold font-mono text-slate-900 dark:text-white">
              <CountUp value={stats.deliverableCount} />
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              ({deliverablePct}%)
            </span>
          </div>
        </div>

        {/* Bounce Stat */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-x border-slate-200 dark:border-slate-800/80 px-2 sm:px-4">
          <div className="flex items-center gap-1.5 text-xs text-rose-700 dark:text-rose-400 font-semibold">
            <XCircle className="w-3.5 h-3.5" />
            <span>Bounces</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm sm:text-base font-bold font-mono text-slate-900 dark:text-white">
              <CountUp value={stats.bounceCount} />
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              ({bouncePct}%)
            </span>
          </div>
        </div>

        {/* Unknown Stat */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pl-1 sm:pl-2">
          <div className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400 font-semibold">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Unknown</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm sm:text-base font-bold font-mono text-slate-900 dark:text-white">
              <CountUp value={stats.unknownCount} />
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              ({unknownPct}%)
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};
