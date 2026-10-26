import React, { useState, useRef, useEffect } from 'react';
import { Search, ArrowUpDown, Download, ChevronDown, CheckCircle, XCircle, FileText, FileCode, Printer } from 'lucide-react';
import { StatusFilterToggle } from './StatusFilterToggle.tsx';

export type FlagFilterValue = 'all' | 'typo' | 'role' | 'disposable' | 'free';

interface ResultsToolbarProps {
  counts: { all: number; deliverable: number; bounce: number; unknown: number };
  filterClassification: string;
  setFilterClassification: (val: string) => void;
  providerFilter: string;
  setProviderFilter: (val: string) => void;
  flagFilter?: FlagFilterValue;
  setFlagFilter?: (val: FlagFilterValue) => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  sortAsc: boolean;
  setSortAsc: (val: boolean) => void;
  filteredCount: number;
  totalCount: number;
  onExportCsv: (mode?: 'current' | 'all' | 'filtered' | 'deliverable' | 'bounce' | boolean) => void;
  onExportJson: (filteredOnly: boolean) => void;
  onPrintReport?: () => void;
}

export const ResultsToolbar: React.FC<ResultsToolbarProps> = ({
  counts,
  filterClassification,
  setFilterClassification,
  providerFilter,
  setProviderFilter,
  flagFilter = 'all',
  setFlagFilter,
  searchQuery,
  setSearchQuery,
  sortAsc,
  setSortAsc,
  filteredCount,
  totalCount,
  onExportCsv,
  onExportJson,
  onPrintReport,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  return (
    <div className="surface p-4 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
      {/* Status Filtering Toggle */}
      <StatusFilterToggle
        activeFilter={filterClassification}
        onFilterChange={setFilterClassification}
        counts={counts}
        showLabel={true}
      />

      {/* Provider Filter, Flag Filter, Search, Sort & Export */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Mail Infrastructure Provider Filter */}
        <select
          value={providerFilter}
          onChange={(e) => setProviderFilter(e.target.value)}
          className="px-2.5 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-[var(--bg-input)] border border-slate-200 dark:border-slate-800 text-[var(--text-secondary)] hover:text-[var(--text-primary)] focus:outline-none focus:border-cyan-500 font-mono cursor-pointer"
          aria-label="Filter by mail infrastructure provider"
        >
          <option value="all">All Providers</option>
          <option value="google">Google Workspace</option>
          <option value="microsoft">Microsoft 365</option>
          <option value="cloudflare">Cloudflare Area 1</option>
          <option value="proton">ProtonMail</option>
          <option value="fastmail">Fastmail</option>
          <option value="apple">Apple iCloud</option>
          <option value="generic">Custom / Other</option>
        </select>

        {/* Phase 2 Informational Flag Filter */}
        {setFlagFilter && (
          <div className="flex items-center gap-1">
            <select
              value={flagFilter}
              onChange={(e) => setFlagFilter(e.target.value as FlagFilterValue)}
              className="px-2.5 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-[var(--bg-input)] border border-slate-200 dark:border-slate-800 text-[var(--text-secondary)] hover:text-[var(--text-primary)] focus:outline-none focus:border-cyan-500 font-mono cursor-pointer"
              aria-label="Filter by informational flags"
            >
              <option value="all">All Signals</option>
              <option value="typo">With Typo Fix</option>
              <option value="role">Role Addresses</option>
              <option value="disposable">Disposable Domains</option>
              <option value="free">Free Providers</option>
            </select>
          </div>
        )}

        {/* Search Input */}
        <div className="relative flex-1 sm:flex-initial">
          <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search address or domain..."
            className="pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-[var(--bg-input)] border border-slate-200 dark:border-slate-800 text-[var(--text-primary)] placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 w-full sm:w-44 font-mono"
            aria-label="Search verified addresses or domains"
          />
        </div>

        {/* Sort Order Toggle */}
        <button
          type="button"
          onClick={() => setSortAsc(!sortAsc)}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-xl bg-slate-50 dark:bg-[var(--bg-input)] border border-slate-200 dark:border-slate-800 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          title={`Sort ${sortAsc ? 'Ascending' : 'Descending'}`}
        >
          <ArrowUpDown className="w-3.5 h-3.5 text-[var(--accent)]" />
          <span>{sortAsc ? 'A → Z' : 'Z → A'}</span>
        </button>

        {/* Printable Summary Report Action (Part B5) */}
        {onPrintReport && (
          <button
            type="button"
            onClick={onPrintReport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-[var(--bg-raised)] hover:bg-[var(--bg-overlay-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)] shadow-xs transition-colors cursor-pointer"
            title="Generate and print an executive deliverability summary report"
          >
            <Printer className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span className="hidden sm:inline">Report</span>
          </button>
        )}

        {/* Dedicated Export CSV Action with Split Menu */}
        <div ref={dropdownRef} className="relative flex items-center">
          <button
            type="button"
            onClick={() => onExportCsv('current')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-l-xl bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition-colors cursor-pointer border border-cyan-500 hover:border-cyan-400 active:scale-[0.98]"
            title="Download currently displayed results as a sanitized CSV file"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
            <span className="px-1.5 py-0.5 rounded-md bg-white/20 text-[10px] font-mono leading-none">
              {filteredCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="inline-flex items-center justify-center px-2 py-1.5 text-xs font-semibold rounded-r-xl bg-cyan-700 hover:bg-cyan-600 text-white transition-colors cursor-pointer border-y border-r border-cyan-500 active:scale-[0.98]"
            title="Additional export options (All leads, Deliverable only, Bounces only, JSON report)"
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
            aria-label="Export options dropdown"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-60 rounded-xl bg-[var(--bg-raised)] border border-[var(--border-subtle)] shadow-2xl py-1.5 z-30 divide-y divide-[var(--border-subtle)] animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
                CSV Export Options
              </div>
              <div className="py-1">
                <button
                  type="button"
                  onClick={() => {
                    onExportCsv('current');
                    setDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-canvas)] flex items-center justify-between cursor-pointer transition-colors"
                >
                  <span className="flex items-center gap-1.5 font-medium">
                    <FileText className="w-3.5 h-3.5 text-cyan-500" /> Current View CSV
                  </span>
                  <span className="font-mono text-[var(--accent)] font-semibold">({filteredCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onExportCsv('all');
                    setDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-canvas)] flex items-center justify-between cursor-pointer transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-400" /> All Verified CSV
                  </span>
                  <span className="font-mono text-slate-400">({totalCount})</span>
                </button>
                {counts.deliverable > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      onExportCsv('deliverable');
                      setDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-canvas)] flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle className="w-3.5 h-3.5" /> Deliverable Only CSV
                    </span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400">({counts.deliverable})</span>
                  </button>
                )}
                {counts.bounce > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      onExportCsv('bounce');
                      setDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-canvas)] flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                      <XCircle className="w-3.5 h-3.5" /> Bounces Only CSV
                    </span>
                    <span className="font-mono text-rose-600 dark:text-rose-400">({counts.bounce})</span>
                  </button>
                )}
              </div>

              <div className="pt-1">
                <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
                  Full Technical Audit
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onExportJson(false);
                    setDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-canvas)] flex items-center justify-between cursor-pointer transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <FileCode className="w-3.5 h-3.5 text-amber-500" /> Export JSON Report
                  </span>
                  <span className="font-mono text-slate-400 text-[10px]">.json</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
