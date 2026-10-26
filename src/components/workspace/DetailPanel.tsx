import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Copy,
  Check,
  ShieldCheck,
  Globe,
  Terminal,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  Sparkles,
  Shield,
  UserCheck,
  Building2,
  Mail,
} from 'lucide-react';
import { EmailResult } from '../../types.ts';
import { detectMailProvider, isDisposableDomain } from '../../lib/intelligence.ts';
import { Badge } from '../ui/Badge.tsx';
import { Button } from '../ui/Button.tsx';
import { useToast } from '../ui/Toast.tsx';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion.ts';

interface DetailPanelProps {
  result: EmailResult | null;
  onClose: () => void;
  onApplyTypoFix?: (oldEmail: string, correctedEmail: string) => void;
}

export const DetailPanel: React.FC<DetailPanelProps> = ({ result, onClose, onApplyTypoFix }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'trace' | 'json'>('overview');
  const [copied, setCopied] = useState(false);
  const toast = useToast();
  const prefersReduced = usePrefersReducedMotion();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!result) return null;

  const provider = detectMailProvider(result.reason, result.domain);
  const isDisposable = result.isDisposableDomain ?? isDisposableDomain(result.domain);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(result.email);
    setCopied(true);
    toast.show({
      type: 'info',
      message: `Copied ${result.email} to clipboard`,
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    toast.show({
      type: 'ok',
      message: 'Raw JSON diagnostic report copied',
    });
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
        role="presentation"
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onClose();
        }}
      >
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="detail-panel-title"
          initial={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 16 }}
          animate={prefersReduced ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
          exit={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 12 }}
          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-2xl bg-[var(--bg-raised)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-[var(--border-subtle)] bg-[var(--bg-canvas)]/60">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[var(--accent)]/10 text-[var(--accent)]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 id="detail-panel-title" className="text-base font-bold text-[var(--text-primary)]">
                  Diagnostic Breakdown
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">RFC syntax, MX records, protocol probe & authentication</p>
              </div>
            </div>

            <button
              onClick={onClose}
              aria-label="Close dialog"
              className="p-2 text-[var(--text-faint)] hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-canvas)] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-[var(--border-subtle)] bg-[var(--bg-canvas)]/30 px-6 gap-2 pt-2">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                activeTab === 'overview'
                  ? 'border-[var(--accent)] text-[var(--accent)]'
                  : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Overview & Verdict
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('trace')}
              className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                activeTab === 'trace'
                  ? 'border-[var(--accent)] text-[var(--accent)]'
                  : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Protocol Trace
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('json')}
              className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                activeTab === 'json'
                  ? 'border-[var(--accent)] text-[var(--accent)]'
                  : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Raw Diagnostic JSON
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-5 flex-1">
            {/* Target Address Card */}
            <div className="p-4 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-[11px] text-[var(--text-faint)] uppercase tracking-wider font-mono font-medium">
                  Evaluated Recipient
                </div>
                <div className="text-base font-semibold text-[var(--text-primary)] break-all font-mono">
                  {result.email}
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  <Badge variant={result.classification} size="sm">
                    {result.classification === 'likely_deliverable'
                      ? 'Likely Deliverable'
                      : result.classification === 'likely_bounce'
                      ? 'Likely to Bounce'
                      : 'Unknown Status'}
                  </Badge>
                  <span className="text-xs text-[var(--text-faint)] font-mono">· {provider.name}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={handleCopyEmail}>
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
                <Button variant="secondary" size="sm" onClick={handleCopyJson}>
                  <Terminal className="w-3.5 h-3.5 mr-1" />
                  JSON
                </Button>
              </div>
            </div>

            {/* Informational Typo Suggestion Chip */}
            {result.suggestion && (
              <div className="p-3.5 rounded-xl bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-500/30 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-cyan-900 dark:text-cyan-200">
                      Possible typo detected: Did you mean <strong>{result.suggestion.corrected}</strong>?
                    </span>
                    <p className="text-[11px] text-cyan-700 dark:text-cyan-300 mt-0.5">
                      {result.suggestion.reason}.
                    </p>
                  </div>
                </div>
                {onApplyTypoFix && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      onApplyTypoFix(result.email, result.suggestion!.corrected);
                      onClose();
                    }}
                    className="shrink-0 text-xs"
                  >
                    Apply fix
                  </Button>
                )}
              </div>
            )}

            {/* Tab: Overview */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                {/* Diagnostic Reason */}
                <div className="p-4 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] space-y-2">
                  <div className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-[var(--accent)]" />
                    Classification Rationale
                  </div>
                  <div className="p-3 rounded-lg bg-[var(--bg-raised)] font-mono text-xs text-[var(--text-secondary)] leading-relaxed border border-[var(--border-subtle)]">
                    {result.reason}
                  </div>
                </div>

                {/* Informational Signal Badges with Icon + Text (Never color alone) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="p-3 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)]">
                    <div className="flex items-center gap-1.5 text-xs text-[var(--text-faint)] font-mono uppercase">
                      <UserCheck className="w-3.5 h-3.5" />
                      Role Address
                    </div>
                    <div className="text-xs font-semibold text-[var(--text-primary)] mt-1 flex items-center gap-1.5">
                      {result.isRoleAddress ? (
                        <span className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                          <Check className="w-3.5 h-3.5" /> Role-based mailbox
                        </span>
                      ) : (
                        <span className="text-[var(--text-secondary)]">Personal mailbox</span>
                      )}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)]">
                    <div className="flex items-center gap-1.5 text-xs text-[var(--text-faint)] font-mono uppercase">
                      <Shield className="w-3.5 h-3.5" />
                      Disposable Service
                    </div>
                    <div className="text-xs font-semibold text-[var(--text-primary)] mt-1 flex items-center gap-1.5">
                      {isDisposable ? (
                        <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400">
                          <AlertTriangle className="w-3.5 h-3.5" /> Disposable domain
                        </span>
                      ) : (
                        <span className="text-[var(--text-secondary)]">Permanent domain</span>
                      )}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)]">
                    <div className="flex items-center gap-1.5 text-xs text-[var(--text-faint)] font-mono uppercase">
                      <Building2 className="w-3.5 h-3.5" />
                      Provider Tier
                    </div>
                    <div className="text-xs font-semibold text-[var(--text-primary)] mt-1 flex items-center gap-1.5">
                      {result.isFreeProvider ? (
                        <span className="inline-flex items-center gap-1 text-cyan-600 dark:text-cyan-400">
                          <Mail className="w-3.5 h-3.5" /> Free provider
                        </span>
                      ) : (
                        <span className="text-[var(--text-secondary)]">Custom / Corporate</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Domain Email-Authentication (Informational SPF & DMARC) */}
                {result.domainAuth && (
                  <div className="p-4 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-[var(--accent)]" />
                        Domain Email-Authentication (Informational)
                      </span>
                      <span className="text-[10px] uppercase font-mono text-[var(--accent)] font-semibold">
                        Domain-Level
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                      <div className="p-3 rounded-lg bg-[var(--bg-raised)] border border-[var(--border-subtle)] flex items-center justify-between">
                        <span className="text-[var(--text-secondary)]">SPF Record:</span>
                        <span className={`font-bold uppercase ${
                          result.domainAuth.spf === 'present'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : result.domainAuth.spf === 'absent'
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}>
                          {result.domainAuth.spf}
                        </span>
                      </div>

                      <div className="p-3 rounded-lg bg-[var(--bg-raised)] border border-[var(--border-subtle)] flex items-center justify-between">
                        <span className="text-[var(--text-secondary)]">DMARC Policy:</span>
                        <span className={`font-bold uppercase ${
                          result.domainAuth.dmarc === 'reject' || result.domainAuth.dmarc === 'quarantine'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : result.domainAuth.dmarc === 'none'
                            ? 'text-cyan-600 dark:text-cyan-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}>
                          {result.domainAuth.dmarc}
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-[var(--text-faint)] leading-relaxed">
                      SPF and DMARC describe how the <em>domain sends</em> mail. They describe domain sender identity policies rather than mailbox deliverability, and consequently never change the classification verdict.
                    </p>
                  </div>
                )}

                {/* Evidence & Honesty Notice */}
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p>
                    <strong className="font-semibold">Evidence, not a guarantee:</strong> Evaluated via transparent syntax checks and DNS/SMTP handshakes. Final mailbox delivery is determined by remote receiving spam filters and mailbox quotas.
                  </p>
                </div>

                {/* DNS / MX Status */}
                <div className="p-4 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                      <Globe className="w-4 h-4 text-[var(--accent)]" />
                      DNS Mail Routing Status
                    </span>
                    <span className="text-[11px] text-[var(--text-faint)] font-mono">Domain: {result.domain || 'N/A'}</span>
                  </div>

                  <div className="p-3 rounded-lg bg-[var(--bg-raised)] font-mono text-xs border border-[var(--border-subtle)] flex items-center justify-between">
                    <span className="text-[var(--text-secondary)]">MX Routing State:</span>
                    <span className="font-semibold text-[var(--accent)] uppercase">{result.mxStatus}</span>
                  </div>

                  <div className="p-3 rounded-lg bg-[var(--bg-raised)] font-mono text-xs border border-[var(--border-subtle)] flex items-center justify-between">
                    <span className="text-[var(--text-secondary)]">SMTP Handshake State:</span>
                    <span className="font-semibold text-[var(--accent)] uppercase">{result.smtpStatus}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Protocol Trace */}
            {activeTab === 'trace' && (
              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)] space-y-1">
                  <div className="text-[var(--text-faint)] text-[10px] uppercase">Step 1: Syntax Analysis</div>
                  {result.syntaxValid ? (
                    <div className="text-[var(--ok)] flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Passed practical subset of RFC 5321/5322
                    </div>
                  ) : (
                    <div className="text-[var(--bad)] flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5" />
                      Syntax invalid against practical RFC limits
                    </div>
                  )}
                </div>

                <div className="p-3 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)] space-y-1">
                  <div className="text-[var(--text-faint)] text-[10px] uppercase">Step 2: DNS MX Resolution</div>
                  <div className="text-[var(--text-primary)] flex items-center gap-1">
                    {result.mxStatus === 'found' || result.mxStatus === 'implicit_a' ? (
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-rose-500" />
                    )}
                    <span>MX Status: {result.mxStatus}</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)] space-y-1">
                  <div className="text-[var(--text-faint)] text-[10px] uppercase">Step 3: Protocol Probe Handshake</div>
                  <div className="text-[var(--text-secondary)]">
                    Probe issued EHLO & MAIL FROM commands without issuing DATA.
                  </div>
                  <div className="p-2 rounded bg-[var(--bg-raised)] text-[11px] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                    {result.reason}
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Raw JSON */}
            {activeTab === 'json' && (
              <div className="relative">
                <pre className="p-4 rounded-xl bg-[var(--bg-canvas)] text-[var(--accent)] font-mono text-xs overflow-x-auto max-h-80 border border-[var(--border-subtle)]">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-[var(--border-subtle)] bg-[var(--bg-canvas)]/60 flex items-center justify-end">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close Inspector
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
