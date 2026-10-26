import React from 'react';
import { Upload, Play, RotateCcw, Sparkles, Layers, ShieldAlert, ShieldCheck } from 'lucide-react';
import { Button } from '../ui/Button.tsx';

interface PreflightInfo {
  totalLines: number;
  uniqueCount: number;
  duplicateCount: number;
  invalidCount: number;
  uniqueList: string[];
}

interface InputPanelProps {
  inputText: string;
  setInputText: (val: string) => void;
  preflight: PreflightInfo;
  maxBatch: number;
  loading: boolean;
  errorMessage?: string | null;
  includeDomainAuth?: boolean;
  setIncludeDomainAuth?: (val: boolean) => void;
  domainAuthSupported?: boolean;
  onVerify: () => void;
  onLoadDemo: () => void;
  onClear: () => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const InputPanel: React.FC<InputPanelProps> = ({
  inputText,
  setInputText,
  preflight,
  maxBatch,
  loading,
  errorMessage,
  includeDomainAuth = false,
  setIncludeDomainAuth,
  domainAuthSupported = true,
  onVerify,
  onLoadDemo,
  onClear,
  onFileUpload,
}) => {
  return (
    <div className="surface p-5 sm:p-6 space-y-4">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-500" />
            Batch Email Verification Input
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Paste addresses, upload a <code className="text-slate-700 dark:text-slate-300 font-mono">.csv</code> or <code className="text-slate-700 dark:text-slate-300 font-mono">.txt</code> file, or test with demo data.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" onClick={onLoadDemo} icon={<Sparkles className="w-3.5 h-3.5 text-cyan-500" />}>
            Load Demo Data
          </Button>

          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-[var(--bg-overlay)] dark:hover:bg-[var(--bg-overlay-hover)] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 cursor-pointer transition-colors">
            <Upload className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Upload CSV / TXT</span>
            <input
              type="file"
              accept=".txt,.csv"
              onChange={onFileUpload}
              className="hidden"
              aria-label="Upload CSV or TXT file"
            />
          </label>

          {inputText && (
            <Button variant="ghost" size="sm" onClick={onClear} icon={<RotateCcw className="w-3.5 h-3.5" />}>
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Text Area */}
      <div className="relative">
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={loading}
          rows={5}
          placeholder="user@example.com&#10;sales@company.org&#10;contact@domain.co.uk"
          className="w-full p-4 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40 focus:border-[var(--accent)] transition-all placeholder:text-[var(--text-faint)] resize-y"
          aria-label="Email address input list"
        />
      </div>

      {/* Pre-flight Metrics, Domain Auth Checkbox & Submit Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2.5 text-xs text-[var(--text-secondary)] font-mono">
            <div>
              Detected: <strong className="text-[var(--text-primary)] font-semibold">{preflight.totalLines}</strong>
            </div>
            <span>·</span>
            <div>
              Unique: <strong className="text-[var(--accent)] font-semibold">{preflight.uniqueCount}</strong> / {maxBatch}
            </div>
            {preflight.duplicateCount > 0 && (
              <>
                <span>·</span>
                <div className="text-amber-600 dark:text-amber-400">
                  Duplicates removed: <span className="font-semibold">{preflight.duplicateCount}</span>
                </div>
              </>
            )}
            {preflight.invalidCount > 0 && (
              <>
                <span>·</span>
                <div className="text-rose-600 dark:text-rose-400">
                  Malformed syntax: <span className="font-semibold">{preflight.invalidCount}</span>
                </div>
              </>
            )}
          </div>

          {/* Opt-in SPF/DMARC lookup checkbox (Part B4) */}
          {domainAuthSupported && setIncludeDomainAuth && (
            <label className="inline-flex items-center gap-2 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeDomainAuth}
                onChange={(e) => setIncludeDomainAuth(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-700 text-cyan-600 focus:ring-cyan-500 w-3.5 h-3.5"
              />
              <span className="flex items-center gap-1 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-500" />
                Include SPF/DMARC lookup (informational DNS signals)
              </span>
            </label>
          )}
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={onVerify}
          disabled={loading || preflight.uniqueCount === 0 || preflight.uniqueCount > maxBatch}
          icon={!loading && <Play className="w-4 h-4 fill-current" />}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white dark:border-slate-950 border-t-transparent rounded-full animate-spin" />
              <span>Running Verification Pipeline...</span>
            </span>
          ) : (
            `Analyze ${preflight.uniqueCount > 0 ? `${preflight.uniqueCount} Addresses` : 'Batch'}`
          )}
        </Button>
      </div>

      {/* Error Message Notice */}
      {errorMessage && (
        <div
          className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5"
          role="alert"
        >
          <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <div className="flex-1">{errorMessage}</div>
        </div>
      )}
    </div>
  );
};
