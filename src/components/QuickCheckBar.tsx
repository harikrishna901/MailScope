import React, { useState } from 'react';
import { Search, CheckCircle, XCircle, AlertTriangle, Zap, Server, ShieldAlert, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { EmailResult } from '../types.ts';
import { verifyEmailsApi } from '../services/api.ts';
import { validateEmailSyntax } from '../../server/src/verification/syntax.ts';
import { detectMailProvider, isDisposableDomain } from '../lib/intelligence.ts';

interface QuickCheckBarProps {
  onAddResult?: (result: EmailResult) => void;
  onInspectDetails?: (result: EmailResult) => void;
}

export const QuickCheckBar: React.FC<QuickCheckBarProps> = ({ onAddResult, onInspectDetails }) => {
  const [singleInput, setSingleInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EmailResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const localSyntax = singleInput.trim() ? validateEmailSyntax(singleInput.trim()) : null;

  const handleQuickCheck = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const email = singleInput.trim();
    if (!email) return;

    setError(null);
    setLoading(true);

    try {
      const response = await verifyEmailsApi([email]);
      if (response.results.length > 0) {
        const res = response.results[0];
        setResult(res);
        if (onAddResult) onAddResult(res);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Verification probe failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const provider = result ? detectMailProvider(result.reason, result.domain) : null;
  const isDisposable = result ? isDisposableDomain(result.domain) : false;

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-[var(--bg-raised)] border border-[var(--border-subtle)] shadow-sm dark:shadow-xl transition-colors space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider">
            Quick Single-Address Live Inspector
          </span>
        </div>
        <span className="text-[11px] text-[var(--text-faint)] font-mono">
          Instant format, MX routing & provider probe
        </span>
      </div>

      <form onSubmit={handleQuickCheck} className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={singleInput}
            onChange={(e) => {
              setSingleInput(e.target.value);
              setResult(null);
              setError(null);
            }}
            placeholder="Test single address (e.g., satya@microsoft.com, alex@stripe.com)..."
            className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-[var(--bg-input)] border border-slate-200 dark:border-slate-800 text-[var(--text-primary)] placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500 transition-all font-mono"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !singleInput.trim()}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-cyan-600 dark:bg-cyan-500 hover:bg-cyan-500 text-white dark:text-slate-950 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Verifying...</span>
            </>
          ) : (
            <>
              <span>Inspect Live</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </form>

      {/* Live typing syntax indicator if no full result yet */}
      {!result && singleInput.trim() && localSyntax && (
        <div className="flex items-center gap-2 text-xs font-mono pt-1 text-slate-500 dark:text-slate-400">
          <span>Live Syntax:</span>
          {localSyntax.valid ? (
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> Valid RFC Syntax
            </span>
          ) : (
            <span className="text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
              <XCircle className="w-3.5 h-3.5" /> {localSyntax.reason}
            </span>
          )}
        </div>
      )}

      {/* Live Probe Result Card */}
      {result && (
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-2.5 mt-2 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs sm:text-sm font-bold text-[var(--text-primary)]">
                {result.email}
              </span>
              {provider && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  <Server className="w-3 h-3 text-cyan-500" />
                  {provider.name}
                </span>
              )}
              {isDisposable && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <ShieldAlert className="w-3 h-3" />
                  Disposable Domain
                </span>
              )}
              {result.isRoleAddress && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  Role Address
                </span>
              )}
              {result.isFreeProvider && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  Free Provider
                </span>
              )}
            </div>

            <div>
              {result.classification === 'likely_deliverable' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                  <CheckCircle className="w-3.5 h-3.5" /> Likely Deliverable
                </span>
              )}
              {result.classification === 'likely_bounce' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
                  <XCircle className="w-3.5 h-3.5" /> Likely to Bounce
                </span>
              )}
              {result.classification === 'unknown' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                  <AlertTriangle className="w-3.5 h-3.5" /> Unknown
                </span>
              )}
            </div>
          </div>

          {result.suggestion && (
            <div className="p-2.5 rounded-lg bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-500/30 text-xs flex items-center justify-between gap-2">
              <span className="text-cyan-800 dark:text-cyan-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Possible typo detected: Did you mean <strong>{result.suggestion.corrected}</strong>?
              </span>
              <button
                type="button"
                onClick={() => {
                  setSingleInput(result.suggestion!.corrected);
                  setResult(null);
                }}
                className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-cyan-600 text-white hover:bg-cyan-500 cursor-pointer"
              >
                Apply fix
              </button>
            </div>
          )}

          <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-sans">
            {result.reason}
          </p>

          <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400 pt-1">
            <div className="flex items-center gap-3">
              <span>MX: <strong className="text-slate-700 dark:text-slate-200">{result.mxStatus}</strong></span>
              <span>·</span>
              <span>SMTP: <strong className="text-slate-700 dark:text-slate-200">{result.smtpStatus}</strong></span>
            </div>
            {onInspectDetails && (
              <button
                onClick={() => onInspectDetails(result)}
                className="text-cyan-600 dark:text-cyan-400 hover:underline font-semibold cursor-pointer"
              >
                Inspect RFC Trace &rarr;
              </button>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 text-xs">
          {error}
        </div>
      )}
    </div>
  );
};
