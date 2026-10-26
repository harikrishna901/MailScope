import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, Layers, RotateCcw } from 'lucide-react';
import { StatusFilterValue, StatusCounts, getStatusFilterDisplayName } from '../../lib/statusFilter.ts';

interface StatusFilterToggleProps {
  activeFilter: string;
  onFilterChange: (filter: StatusFilterValue) => void;
  counts: StatusCounts;
  className?: string;
  showLabel?: boolean;
}

export const StatusFilterToggle: React.FC<StatusFilterToggleProps> = ({
  activeFilter,
  onFilterChange,
  counts,
  className = '',
  showLabel = true,
}) => {
  const handleToggle = (target: StatusFilterValue) => {
    // If user clicks the currently active filter (and it's not 'all'), toggle back to 'all'
    if (activeFilter === target && target !== 'all') {
      onFilterChange('all');
    } else {
      onFilterChange(target);
    }
  };

  const isFiltered = activeFilter !== 'all';

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {showLabel && (
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-mono uppercase tracking-wider hidden sm:inline-flex items-center gap-1">
          Status:
        </span>
      )}

      {/* Segmented Toggle Group */}
      <div
        role="group"
        aria-label="Filter results table by email status"
        className="inline-flex flex-wrap items-center p-1 rounded-xl bg-slate-100 dark:bg-[var(--bg-input)] border border-slate-200 dark:border-slate-800 shadow-inner gap-1"
      >
        {/* All Toggle */}
        <button
          type="button"
          aria-pressed={activeFilter === 'all'}
          aria-label={`Show all ${counts.all} email results`}
          onClick={() => handleToggle('all')}
          className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 cursor-pointer ${
            activeFilter === 'all'
              ? 'bg-white dark:bg-[var(--bg-overlay)] text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-slate-700/80 font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>All</span>
          <span
            className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono leading-tight ${
              activeFilter === 'all'
                ? 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                : 'bg-slate-200/70 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400'
            }`}
          >
            {counts.all}
          </span>
        </button>

        {/* Deliverable Toggle */}
        <button
          type="button"
          aria-pressed={activeFilter === 'likely_deliverable'}
          aria-label={`Toggle filter to show only ${counts.deliverable} deliverable emails`}
          onClick={() => handleToggle('likely_deliverable')}
          className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 cursor-pointer ${
            activeFilter === 'likely_deliverable'
              ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-500/40 shadow-sm shadow-emerald-500/10 font-bold'
              : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30'
          }`}
        >
          <CheckCircle className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
          <span>Deliverable</span>
          <span
            className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono leading-tight ${
              activeFilter === 'likely_deliverable'
                ? 'bg-emerald-200 dark:bg-emerald-900/80 text-emerald-900 dark:text-emerald-100 font-bold'
                : 'bg-emerald-100/70 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
            }`}
          >
            {counts.deliverable}
          </span>
        </button>

        {/* Bounce Toggle */}
        <button
          type="button"
          aria-pressed={activeFilter === 'likely_bounce'}
          aria-label={`Toggle filter to show only ${counts.bounce} bounce emails`}
          onClick={() => handleToggle('likely_bounce')}
          className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 cursor-pointer ${
            activeFilter === 'likely_bounce'
              ? 'bg-rose-50 dark:bg-rose-950/70 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-500/40 shadow-sm shadow-rose-500/10 font-bold'
              : 'text-rose-700 dark:text-rose-400 hover:bg-rose-50/50 dark:hover:bg-rose-950/30'
          }`}
        >
          <XCircle className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
          <span>Bounce</span>
          <span
            className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono leading-tight ${
              activeFilter === 'likely_bounce'
                ? 'bg-rose-200 dark:bg-rose-900/80 text-rose-900 dark:text-rose-100 font-bold'
                : 'bg-rose-100/70 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
            }`}
          >
            {counts.bounce}
          </span>
        </button>

        {/* Unknown Toggle */}
        <button
          type="button"
          aria-pressed={activeFilter === 'unknown'}
          aria-label={`Toggle filter to show only ${counts.unknown} unknown emails`}
          onClick={() => handleToggle('unknown')}
          className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 cursor-pointer ${
            activeFilter === 'unknown'
              ? 'bg-amber-50 dark:bg-amber-950/70 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-500/40 shadow-sm shadow-amber-500/10 font-bold'
              : 'text-amber-700 dark:text-amber-400 hover:bg-amber-50/50 dark:hover:bg-amber-950/30'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
          <span>Unknown</span>
          <span
            className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono leading-tight ${
              activeFilter === 'unknown'
                ? 'bg-amber-200 dark:bg-amber-900/80 text-amber-900 dark:text-amber-100 font-bold'
                : 'bg-amber-100/70 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
            }`}
          >
            {counts.unknown}
          </span>
        </button>
      </div>

      {/* Quick Reset Button when an active filter is engaged */}
      {isFiltered && (
        <button
          type="button"
          onClick={() => onFilterChange('all')}
          className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-200/50 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Reset status filter to show all results"
          aria-label="Reset status filter to show all"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset filter ({getStatusFilterDisplayName(activeFilter)})</span>
        </button>
      )}
    </div>
  );
};
