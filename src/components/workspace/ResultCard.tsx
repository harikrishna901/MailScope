import React, { useState } from 'react';
import { Copy, Check, ChevronRight, Server, Shield, Sparkles, UserCheck, Building2 } from 'lucide-react';
import { EmailResult } from '../../types.ts';
import { detectMailProvider, isDisposableDomain } from '../../lib/intelligence.ts';
import { Badge } from '../ui/Badge.tsx';

interface ResultCardProps {
  result: EmailResult;
  onSelect: (result: EmailResult) => void;
}

export const ResultCard: React.FC<ResultCardProps> = ({ result, onSelect }) => {
  const [copied, setCopied] = useState(false);
  const provider = detectMailProvider(result.reason, result.domain);
  const disposable = result.isDisposableDomain ?? isDisposableDomain(result.domain);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(result.email);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div
      onClick={() => onSelect(result)}
      tabIndex={0}
      role="button"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(result);
        }
      }}
      className="surface surface-interactive p-4 flex flex-col gap-3 text-left focus:outline-none focus:ring-2 focus:ring-[var(--accent)] cursor-pointer"
      aria-label={`Inspect diagnostic breakdown for ${result.email}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="font-mono text-sm font-semibold text-[var(--text-primary)] truncate">
            {result.email}
          </div>
          <div className="flex flex-wrap items-center gap-1.5 mt-1 text-xs text-[var(--text-secondary)] font-mono">
            <span className="flex items-center gap-1">
              <Server className="w-3.5 h-3.5 text-[var(--text-faint)]" />
              <span className="truncate">{result.domain || 'no domain'}</span>
            </span>
            <span>·</span>
            <span>{provider.name}</span>
          </div>
        </div>

        <Badge variant={result.classification} size="sm">
          {result.classification === 'likely_deliverable'
            ? 'Deliverable'
            : result.classification === 'likely_bounce'
            ? 'Bounce'
            : 'Unknown'}
        </Badge>
      </div>

      {result.suggestion && (
        <div className="p-2 rounded-lg bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-500/30 text-xs text-cyan-800 dark:text-cyan-300 flex items-center gap-1.5 font-sans">
          <Sparkles className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
          <span>Did you mean <strong>{result.suggestion.corrected}</strong>?</span>
        </div>
      )}

      {/* Flag Badges */}
      <div className="flex flex-wrap gap-1.5">
        {result.isRoleAddress && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/25">
            <UserCheck className="w-2.5 h-2.5" />
            Role address
          </span>
        )}
        {disposable && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/25">
            <Shield className="w-2.5 h-2.5" />
            Disposable
          </span>
        )}
        {result.isFreeProvider && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <Building2 className="w-2.5 h-2.5" />
            Free provider
          </span>
        )}
      </div>

      <div className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed bg-[var(--bg-canvas)]/60 p-2.5 rounded-lg border border-[var(--border-subtle)] font-mono">
        {result.reason}
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-[var(--border-subtle)] text-xs text-[var(--text-faint)]">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] uppercase">
            MX: {result.mxStatus}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="p-1.5 rounded-lg text-[var(--text-faint)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-canvas)] transition-colors cursor-pointer"
            title={`Copy ${result.email}`}
            aria-label={`Copy ${result.email}`}
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <span className="inline-flex items-center text-[var(--accent)] font-medium text-xs">
            Inspect <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
          </span>
        </div>
      </div>
    </div>
  );
};
