import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Server,
  Terminal,
  Lock,
  Zap,
  Layers,
} from 'lucide-react';
import { HeroPipelineGraphic } from '../components/HeroPipelineGraphic.tsx';
import { Button } from '../components/ui/Button.tsx';
import { Badge } from '../components/ui/Badge.tsx';

export const LandingPage: React.FC = () => {
  return (
    <div className="space-y-24 pb-20 overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-6 sm:pt-14 text-center max-w-5xl mx-auto px-4">
        {/* Subtle ambient back-glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[360px] bg-[var(--accent)]/10 rounded-full blur-3xl pointer-events-none -z-10" />

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/30 text-[var(--accent)] text-xs font-semibold mb-6 shadow-sm"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Evidence-Based Deliverability Intelligence</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[var(--text-primary)] leading-[1.12]"
        >
          Know What Your Email List <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400">
            Can Actually Tell You.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-6 text-base sm:text-lg text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed"
        >
          No marketing hype, no fake certainty. Mailscope validates syntax against a practical subset of RFC
          5321/5322, discovers authoritative DNS/MX topology, and inspects SMTP handshake responses with transparent
          uncertainty.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link to="/app">
            <Button size="lg" className="w-full sm:w-auto shadow-lg shadow-cyan-500/20">
              Launch Workspace
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <Link to="/docs">
            <Button variant="secondary" size="lg" className="w-full sm:w-auto">
              Read Verification Docs
            </Button>
          </Link>
        </motion.div>

        {/* Trust Indicators (Honest, verifiable guarantees) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-5 text-xs text-[var(--text-secondary)] font-mono"
        >
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span>Zero Email Sent (Never issues DATA)</span>
          </div>
          <span className="text-[var(--text-muted)] hidden sm:inline">·</span>
          <div className="flex items-center gap-1.5">
            <Lock className="w-4 h-4 text-[var(--accent)]" />
            <span>100% In-Memory (No Stored Contacts)</span>
          </div>
          <span className="text-[var(--text-muted)] hidden sm:inline">·</span>
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Explicit Unknown State</span>
          </div>
        </motion.div>

        {/* Interactive Verification Pipeline Animated Graphic */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="mt-12"
        >
          <HeroPipelineGraphic />
        </motion.div>
      </section>

      {/* Bento Grid: 5 Core Architectural Capabilities */}
      <section id="features" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
            Built for Engineers & Deliverability Specialists
          </h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Engineered with strict adherence to mail protocol standards, defensive timeouts, and deterministic classification.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Bento Card 1: 3-Tier Classification (Spans 2 columns on md) */}
          <div className="md:col-span-2 surface p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-[var(--accent)] flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[var(--text-primary)]">
                Tri-State Classification Engine
              </h3>
              <p className="mt-2 text-sm text-[var(--text-secondary)] leading-relaxed">
                Most checkers force a binary valid/invalid label, giving dangerous false positives on catch-all domains or
                greylisting servers. Mailscope isolates verdicts into three evidence-backed categories:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
                <div className="p-3.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] space-y-1">
                  <Badge variant="ok" size="sm">Likely Deliverable</Badge>
                  <p className="text-[11px] text-[var(--text-secondary)] pt-1">
                    Valid syntax, active MX records, and SMTP probe accepted with positive 250 response.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] space-y-1">
                  <Badge variant="bad" size="sm">Likely to Bounce</Badge>
                  <p className="text-[11px] text-[var(--text-secondary)] pt-1">
                    Malformed syntax, missing/null MX, or 550 permanent mailbox rejection.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] space-y-1">
                  <Badge variant="unknown" size="sm">Unknown Status</Badge>
                  <p className="text-[11px] text-[var(--text-secondary)] pt-1">
                    Catch-all accepting any user, greylisting 4xx deferral, or timeout.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[var(--border-subtle)] text-xs text-[var(--text-muted)] font-mono">
              Deterministic 7-rule classification table · Zero hallucination
            </div>
          </div>

          {/* Bento Card 2: Safe Probe Protocol */}
          <div className="surface p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4">
                <Terminal className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[var(--text-primary)]">
                Zero Email Sent
              </h3>
              <p className="mt-2 text-sm text-[var(--text-secondary)] leading-relaxed">
                Our protocol probe issues <code className="font-mono text-cyan-600 dark:text-cyan-400 font-semibold">EHLO</code>,{' '}
                <code className="font-mono text-cyan-600 dark:text-cyan-400 font-semibold">MAIL FROM</code>, and{' '}
                <code className="font-mono text-cyan-600 dark:text-cyan-400 font-semibold">RCPT TO</code>. It cleanly closes the
                socket with <code className="font-mono text-cyan-600 dark:text-cyan-400 font-semibold">RSET / QUIT</code> and never
                issues the <code className="font-mono text-rose-500 font-semibold">DATA</code> command.
              </p>
            </div>

            <div className="mt-6 p-3 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)] font-mono text-[11px] text-[var(--text-muted)]">
              &gt; RSET<br />
              &lt; 250 OK Reset<br />
              &gt; QUIT
            </div>
          </div>

          {/* Bento Card 3: Provider Fingerprinting */}
          <div className="surface p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-4">
                <Server className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[var(--text-primary)]">
                Provider Fingerprinting
              </h3>
              <p className="mt-2 text-sm text-[var(--text-secondary)] leading-relaxed">
                Identifies receiving mail systems like Google Workspace, Microsoft 365, Cloudflare Area 1, and ProtonMail to
                help optimize deliverability strategy.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-1.5">
              <span className="px-2 py-1 rounded bg-[var(--bg-canvas)] text-[11px] font-mono border border-[var(--border-subtle)]">
                Google Workspace
              </span>
              <span className="px-2 py-1 rounded bg-[var(--bg-canvas)] text-[11px] font-mono border border-[var(--border-subtle)]">
                Microsoft 365
              </span>
              <span className="px-2 py-1 rounded bg-[var(--bg-canvas)] text-[11px] font-mono border border-[var(--border-subtle)]">
                Cloudflare
              </span>
            </div>
          </div>

          {/* Bento Card 4: Disposable Detection */}
          <div className="surface p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center mb-4">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[var(--text-primary)]">
                Disposable Mailbox Filter
              </h3>
              <p className="mt-2 text-sm text-[var(--text-secondary)] leading-relaxed">
                Flags temporary, 10-minute mail, and burn-after-reading inboxes (Mailinator, GuerillaMail, TempMail) that burn
                sender reputation.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-[var(--border-subtle)] text-xs text-[var(--text-muted)] font-mono">
              In-memory compiled trie lookup
            </div>
          </div>

          {/* Bento Card 5: Pre-flight Hygiene */}
          <div className="surface p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[var(--text-primary)]">
                Pre-flight Deduplication
              </h3>
              <p className="mt-2 text-sm text-[var(--text-secondary)] leading-relaxed">
                Cleanses pasted batches and uploaded CSV files instantly in your browser before firing network probes,
                saving bandwidth and compute.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-[var(--border-subtle)] text-xs text-[var(--text-muted)] font-mono">
              Instant RFC syntax pre-check & deduplication
            </div>
          </div>
        </div>
      </section>

      {/* 3-Step "How It Works" Section with connector */}
      <section id="how-it-works" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-mono uppercase tracking-wider text-[var(--accent)] font-semibold">
            Standard Operating Procedure
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mt-1">
            How The Verification Pipeline Works
          </h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Every email passes through three distinct, observable verification phases.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Step 1 */}
          <div className="surface p-6 flex flex-col items-center text-center relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center font-bold text-lg mb-4 border border-[var(--accent)]/20">
              1
            </div>
            <h3 className="text-base font-bold text-[var(--text-primary)]">Practical Syntax Parser</h3>
            <p className="text-xs text-[var(--text-secondary)] mt-2 leading-relaxed">
              Validates email addresses against a practical subset of RFC 5321/5322 specifications. Rejects missing <code className="font-mono">@</code>,
              consecutive dots, invalid ASCII, and illegal local parts.
            </p>
          </div>

          {/* Step 2 */}
          <div className="surface p-6 flex flex-col items-center text-center relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold text-lg mb-4 border border-indigo-500/20">
              2
            </div>
            <h3 className="text-base font-bold text-[var(--text-primary)]">Authoritative DNS & MX</h3>
            <p className="text-xs text-[var(--text-secondary)] mt-2 leading-relaxed">
              Queries authoritative DNS servers for Mail Exchanger (MX) records. Identifies Null MX (<code className="font-mono">.</code>)
              blackholes and sorts targets by server priority.
            </p>
          </div>

          {/* Step 3 */}
          <div className="surface p-6 flex flex-col items-center text-center relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-lg mb-4 border border-emerald-500/20">
              3
            </div>
            <h3 className="text-base font-bold text-[var(--text-primary)]">Safe Protocol Handshake</h3>
            <p className="text-xs text-[var(--text-secondary)] mt-2 leading-relaxed">
              Connects via SMTP on port 25 with defensive timeouts. Checks recipient responsiveness via <code className="font-mono">RCPT TO</code>{' '}
              and aborts cleanly without sending message data.
            </p>
          </div>
        </div>
      </section>

      {/* Honest Limitations Card */}
      <section className="max-w-4xl mx-auto px-4">
        <div className="surface p-6 sm:p-8 border-l-4 border-l-amber-500">
          <div className="flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                Evidence, Not a Guarantee: What Probe Verification Can and Cannot Do
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Deliverability is an empirical science, not an absolute prophecy. While probe verification proves that a
                mailbox host currently exists and responds to protocol commands, it cannot predict spam folder placement,
                domain-level sender reputation blocks, or dynamic post-acceptance quarantine heuristics.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-[var(--text-secondary)]">
                <div className="p-3 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)]">
                  <strong className="text-[var(--text-primary)] block font-semibold mb-1">Catch-All Domains</strong>
                  Servers configured with catch-all will return 250 for any randomized recipient. We classify these as{' '}
                  <span className="font-semibold text-amber-600 dark:text-amber-400">Unknown</span> rather than false Deliverable.
                </div>
                <div className="p-3 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)]">
                  <strong className="text-[var(--text-primary)] block font-semibold mb-1">Greylisting Defenses</strong>
                  Strict security gateways return temporary 450 deferrals on first contact. We record this transparently as
                  Unknown rather than guessing.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="max-w-3xl mx-auto px-4 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
          Ready to verify your email list with protocol accuracy?
        </h2>
        <p className="mt-3 text-sm text-[var(--text-secondary)]">
          Free, open-source deliverability inspection with zero telemetry and zero stored contacts.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/app">
            <Button size="lg">
              Open Workspace Now
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};
