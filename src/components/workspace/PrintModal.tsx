import React from 'react';
import { Printer, X } from 'lucide-react';
import { Button } from '../ui/Button.tsx';
import { EmailResult } from '../../types.ts';

interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  results: EmailResult[];
  includeFullList: boolean;
  setIncludeFullList: (val: boolean) => void;
  onPrint: () => void;
}

export const PrintModal: React.FC<PrintModalProps> = ({
  isOpen,
  onClose,
  results,
  includeFullList,
  setIncludeFullList,
  onPrint,
}) => {
  if (!isOpen) return null;

  const total = results.length;
  const deliverable = results.filter((r) => r.classification === 'likely_deliverable').length;
  const bounce = results.filter((r) => r.classification === 'likely_bounce').length;
  const unknown = results.filter((r) => r.classification === 'unknown').length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 no-print"
      role="dialog"
      aria-modal="true"
      aria-labelledby="print-modal-title"
    >
      {/* Backdrop button */}
      <button
        type="button"
        aria-label="Close modal"
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs cursor-default w-full h-full border-0 p-0"
      />

      <div className="relative z-10 w-full max-w-md bg-[var(--bg-raised)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl overflow-hidden p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 id="print-modal-title" className="text-base font-bold text-[var(--text-primary)]">
                Print Deliverability Report
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">Formatted for paper printing and PDF export</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-faint)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-canvas)] transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Snapshot Summary */}
        <div className="grid grid-cols-3 gap-2.5 text-center">
          <div className="p-2.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)]">
            <div className="text-[10px] uppercase font-mono text-[var(--text-faint)]">Deliverable</div>
            <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{deliverable}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)]">
            <div className="text-[10px] uppercase font-mono text-[var(--text-faint)]">Bounce</div>
            <div className="text-base font-bold text-rose-600 dark:text-rose-400 mt-0.5">{bounce}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)]">
            <div className="text-[10px] uppercase font-mono text-[var(--text-faint)]">Unknown</div>
            <div className="text-base font-bold text-amber-600 dark:text-amber-400 mt-0.5">{unknown}</div>
          </div>
        </div>

        {/* Print Options */}
        <div className="space-y-3 pt-1">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)]">
            <input
              id="include-full-list-checkbox"
              type="checkbox"
              checked={includeFullList}
              onChange={(e) => setIncludeFullList(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 dark:border-slate-700 text-cyan-600 focus:ring-cyan-500 w-4 h-4 cursor-pointer"
            />
            <label htmlFor="include-full-list-checkbox" className="text-xs cursor-pointer select-none">
              <span className="font-semibold text-[var(--text-primary)] block">
                Include full address list ({total} rows)
              </span>
              <span className="text-[var(--text-secondary)] mt-0.5 block leading-relaxed">
                Appends a complete breakdown table of all verified addresses with reasons and flags. Uncheck for a 1-page executive summary.
              </span>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-subtle)]">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              onPrint();
              onClose();
            }}
            icon={<Printer className="w-4 h-4" />}
          >
            Open Print / PDF Dialog
          </Button>
        </div>
      </div>
    </div>
  );
};
