import React, { useState } from 'react';
import {
  Copy,
  Check,
  ChevronRight,
  Server,
  ArrowUpDown,
  Download,
  Filter,
  RotateCcw,
  Sparkles,
  Shield,
  UserCheck,
  Building2,
  RefreshCw,
  Info,
} from 'lucide-react';
import { EmailResult } from '../../types.ts';
import { detectMailProvider, isDisposableDomain } from '../../lib/intelligence.ts';
import { Badge } from '../ui/Badge.tsx';
import { ResultCard } from './ResultCard.tsx';
import { StatusFilterValue, getStatusFilterDisplayName, StatusCounts } from '../../lib/statusFilter.ts';

interface ResultsTableProps {
  results: EmailResult[];
  onSelectResult: (result: EmailResult) => void;
  sortField: 'email' | 'classification' | 'domain';
  sortAsc: boolean;
  onSortChange: (field: 'email' | 'classification' | 'domain') => void;
  onExportCsv?: () => void;
  activeFilter?: string;
  onFilterChange?: (filter: StatusFilterValue) => void;
  counts?: StatusCounts;
  totalCount?: number;
  onApplyTypoFix?: (oldEmail: string, correctedEmail: string) => void;
  onRetryUnknown?: () => void;
  isRetryingUnknown?: boolean;
  retryRoundsLeft?: number;
  lastRetryResolutionMsg?: string | null;
}

export const ResultsTable: React.FC<ResultsTableProps> = ({
  results,
  onSelectResult,
  sortField,
  sortAsc,
  onSortChange,
  onExportCsv,
  activeFilter = 'all',
  onFilterChange,
  counts,
  totalCount,
  onApplyTypoFix,
  onRetryUnknown,
  isRetryingUnknown = false,
  retryRoundsLeft = 3,
  lastRetryResolutionMsg,
}) => {
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  const handleCopy = (e: React.MouseEvent, email: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 1800);
  };

  const isFiltered = activeFilter !== 'all';
  const filterLabel = getStatusFilterDisplayName(activeFilter);
  const totalVerified = totalCount ?? (counts ? counts.all : results.length);
  const unknownCount = counts ? counts.unknown : results.filter((r) => r.classification === 'unknown').length;

  if (results.length === 0) {
    return (
      <div className="surface p-12 text-center flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-faint)] mb-3">
          <Server className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-[var(--text-primary)]">
          {isFiltered ? `No ${filterLabel} addresses found` : 'No verification results found'}
        </h3>
        <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-sm">
          {isFiltered
            ? `There are no emails categorized as "${filterLabel}" in the current dataset.`
            : 'No records match the active search or infrastructure provider filters.'}
        </p>
        {isFiltered && onFilterChange && (
          <button
            type="button"
            onClick={() => onFilterChange('all')}
            className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Show all verified emails ({totalVerified})</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Re-check Unknown Action Bar (Part B3) */}
      {unknownCount > 0 && onRetryUnknown && (
        <div className="p-3.5 rounded-xl bg-amber-50/90 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-slate-900 dark:text-amber-200">
                {unknownCount} address{unknownCount === 1 ? '' : 'es'} returned inconclusive evidence (Unknown)
              </div>
              <p className="text-[11px] text-slate-600 dark:text-amber-300/80 mt-0.5">
                Temporary mail server failures and greylisting defenses frequently clear upon retry.
                {retryRoundsLeft > 0 ? ` (${retryRoundsLeft} re-check round${retryRoundsLeft === 1 ? '' : 's'} remaining this session)` : ' (Session re-check limit reached)'}
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isRetryingUnknown || retryRoundsLeft <= 0}
            onClick={onRetryUnknown}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-xs transition-colors shrink-0 cursor-pointer"
            aria-label={`Re-check ${unknownCount} unknown addresses`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRetryingUnknown ? 'animate-spin' : ''}`} />
            <span>{isRetryingUnknown ? 'Re-checking...' : 'Re-check Unknown'}</span>
          </button>
        </div>
      )}

      {/* Screen Reader Resolution Feedback for Retry */}
      {lastRetryResolutionMsg && (
        <div
          role="status"
          aria-live="polite"
          className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/25 border border-emerald-200 dark:border-emerald-500/30 text-xs text-emerald-800 dark:text-emerald-200 font-medium"
        >
          {lastRetryResolutionMsg}
        </div>
      )}

      {/* Active Filter Announcement Strip */}
      {isFiltered && onFilterChange && (
        <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-cyan-50/80 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-500/20 text-xs">
          <div className="flex items-center gap-2 text-cyan-800 dark:text-cyan-200 font-medium">
            <Filter className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>
              Showing only <strong>{filterLabel}</strong> emails ({results.length} of {totalVerified} records)
            </span>
          </div>
          <button
            type="button"
            onClick={() => onFilterChange('all')}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-700 dark:text-cyan-300 hover:underline cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Show all</span>
          </button>
        </div>
      )}

      {/* Mobile Card Stack (<md) */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {results.map((item) => (
          <ResultCard key={item.email} result={item} onSelect={onSelectResult} />
        ))}
      </div>

      {/* Desktop Responsive Table (>=md) */}
      <div className="hidden md:block surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs" role="table" aria-label="Email verification results">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-canvas)]/80 text-[var(--text-secondary)] font-mono uppercase tracking-wider text-[11px]">
                <th
                  scope="col"
                  className="py-3.5 px-4 font-semibold cursor-pointer hover:text-[var(--text-primary)] select-none"
                  onClick={() => onSortChange('email')}
                  aria-sort={sortField === 'email' ? (sortAsc ? 'ascending' : 'descending') : undefined}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Email Address</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
                <th
                  scope="col"
                  className="py-3.5 px-4 font-semibold cursor-pointer hover:text-[var(--text-primary)] select-none"
                  onClick={() => onSortChange('classification')}
                  aria-sort={sortField === 'classification' ? (sortAsc ? 'ascending' : 'descending') : undefined}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Verdict</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
                <th scope="col" className="py-3.5 px-4 font-semibold">
                  Provider & Flags
                </th>
                <th scope="col" className="py-3.5 px-4 font-semibold">
                  Diagnostic Reason
                </th>
                <th scope="col" className="py-3.5 px-4 font-semibold text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)] font-mono">
              {results.map((item) => {
                const provider = detectMailProvider(item.reason, item.domain);
                const isDisposable = item.isDisposableDomain ?? isDisposableDomain(item.domain);
                const isCopied = copiedEmail === item.email;

                return (
                  <tr
                    key={item.email}
                    onClick={() => onSelectResult(item)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelectResult(item);
                      }
                    }}
                    tabIndex={0}
                    className="hover:bg-[var(--accent-glow)]/40 transition-colors cursor-pointer group focus:outline-none focus:bg-[var(--accent-glow)]/60"
                  >
                    {/* Email Column with Typo Chip */}
                    <td className="py-3.5 px-4 font-medium text-[var(--text-primary)] whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{item.email}</span>
                          <button
                            type="button"
                            onClick={(e) => handleCopy(e, item.email)}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[var(--bg-canvas)] text-[var(--text-faint)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
                            title="Copy address"
                            aria-label={`Copy ${item.email}`}
                          >
                            {isCopied ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        {/* Typo chip if detected (Part B1) */}
                        {item.suggestion && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                            role="presentation"
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-500/30 text-[11px] text-cyan-800 dark:text-cyan-300 font-sans"
                          >
                            <Sparkles className="w-3 h-3 text-[var(--accent)] shrink-0" />
                            <span>Did you mean <strong>{item.suggestion.corrected}</strong>?</span>
                            {onApplyTypoFix && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onApplyTypoFix(item.email, item.suggestion!.corrected);
                                }}
                                className="ml-1 text-[10px] font-bold text-cyan-600 dark:text-cyan-400 hover:underline uppercase tracking-wider cursor-pointer"
                              >
                                Apply fix
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Classification Verdict */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <Badge
                        variant={
                          item.classification === 'likely_deliverable'
                            ? 'ok'
                            : item.classification === 'likely_bounce'
                            ? 'bad'
                            : 'unknown'
                        }
                        size="sm"
                      >
                        {item.classification === 'likely_deliverable'
                          ? 'Deliverable'
                          : item.classification === 'likely_bounce'
                          ? 'Bounce'
                          : 'Unknown'}
                      </Badge>
                    </td>

                    {/* Infrastructure Provider & Informational Flags (Part B2: Icon + Text, Never Color Alone) */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-[var(--text-secondary)]">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-sans font-medium text-[12px]">{provider.name}</span>

                        {item.isRoleAddress && (
                          <span
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/25"
                            title="Shared / Departmental role mailbox"
                          >
                            <UserCheck className="w-2.5 h-2.5" />
                            Role address
                          </span>
                        )}

                        {isDisposable && (
                          <span
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/25"
                            title="Temporary or throwaway mailbox service"
                          >
                            <Shield className="w-2.5 h-2.5" />
                            Disposable domain
                          </span>
                        )}

                        {item.isFreeProvider && (
                          <span
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                            title="Consumer free mail provider"
                          >
                            <Building2 className="w-2.5 h-2.5" />
                            Free provider
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Reason / Diagnostic */}
                    <td className="py-3.5 px-4 text-[var(--text-secondary)] max-w-md truncate font-sans text-xs">
                      {item.reason}
                    </td>

                    {/* Action Column */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <span className="inline-flex items-center text-xs font-semibold text-[var(--accent)] group-hover:underline">
                        Details <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Summary and Quick Export */}
        <div className="px-4 py-3 bg-slate-50/80 dark:bg-[var(--bg-input)]/80 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[var(--text-secondary)]">
          <div className="font-mono flex items-center gap-2">
            <span>
              Showing <strong className="text-[var(--text-primary)] font-bold">{results.length}</strong> of{' '}
              <strong className="text-[var(--text-primary)] font-bold">{totalVerified}</strong> verified entries
            </span>
            {isFiltered && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-cyan-100/60 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-200 text-[10px] font-semibold">
                Filter: {filterLabel}
              </span>
            )}
          </div>
          {onExportCsv && (
            <button
              onClick={onExportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30 hover:bg-cyan-100 dark:hover:bg-cyan-900/40 transition-colors cursor-pointer"
              title="Download currently visible results as CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export visible to CSV ({results.length})</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
