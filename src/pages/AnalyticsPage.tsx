import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Layers,
  ArrowRight,
  ShieldCheck,
  Server,
} from 'lucide-react';
import { EmailResult } from '../types.ts';
import { detectMailProvider } from '../lib/intelligence.ts';
import { Link } from 'react-router-dom';
import { CountUp } from '../components/ui/CountUp.tsx';

interface AnalyticsPageProps {
  results: EmailResult[];
  onGoToWorkspace?: () => void;
}

// Chart color definitions using semantic CSS token variables
const CHART_COLORS = {
  likely_deliverable: 'var(--ok, #059669)',
  likely_bounce: 'var(--bad, #E11D48)',
  unknown: 'var(--unknown, #B45309)',
  bar: 'var(--accent, #0891B2)',
};

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ results }) => {
  const stats = useMemo(() => {
    if (results.length === 0) return null;

    const total = results.length;
    const deliverable = results.filter((r) => r.classification === 'likely_deliverable').length;
    const bounce = results.filter((r) => r.classification === 'likely_bounce').length;
    const unknown = results.filter((r) => r.classification === 'unknown').length;

    const deliverablePct = Math.round((deliverable / total) * 100);
    const bouncePct = Math.round((bounce / total) * 100);
    const unknownPct = Math.round((unknown / total) * 100);

    // Distribution for Pie Chart
    const pieData = [
      { name: 'Likely Deliverable', value: deliverable, color: CHART_COLORS.likely_deliverable },
      { name: 'Likely to Bounce', value: bounce, color: CHART_COLORS.likely_bounce },
      { name: 'Unknown / Inconclusive', value: unknown, color: CHART_COLORS.unknown },
    ].filter((d) => d.value > 0);

    // Top domains aggregation
    const domainMap: Record<string, { total: number; deliverable: number; bounce: number; unknown: number }> = {};
    for (const r of results) {
      const dom = r.domain || 'no-domain';
      if (!domainMap[dom]) {
        domainMap[dom] = { total: 0, deliverable: 0, bounce: 0, unknown: 0 };
      }
      domainMap[dom].total++;
      if (r.classification === 'likely_deliverable') domainMap[dom].deliverable++;
      else if (r.classification === 'likely_bounce') domainMap[dom].bounce++;
      else domainMap[dom].unknown++;
    }

    const domainList = Object.entries(domainMap)
      .map(([domain, data]) => ({ domain, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);

    // Provider distribution
    const providerMap: Record<string, number> = {};
    for (const r of results) {
      const p = detectMailProvider(r.reason, r.domain);
      providerMap[p.name] = (providerMap[p.name] || 0) + 1;
    }
    const providerList = Object.entries(providerMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return {
      total,
      deliverable,
      bounce,
      unknown,
      deliverablePct,
      bouncePct,
      unknownPct,
      pieData,
      domainList,
      providerList,
      isSmallSample: total < 20,
    };
  }, [results]);

  if (!stats) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mx-auto">
          <Layers className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">No Analysis Data Available</h2>
          <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto">
            Run an email verification batch in the workspace to generate live deliverability intelligence and domain breakdowns.
          </p>
        </div>
        <Link
          to="/app"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-cyan-600 dark:bg-cyan-500 hover:bg-cyan-500 text-white dark:text-slate-950 transition-colors shadow-sm cursor-pointer"
        >
          <span>Go to Workspace</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight flex items-center gap-2">
            Deliverability Intelligence & Analytics
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Real-time aggregate data computed directly from the {stats.total} verified addresses in memory.
          </p>
        </div>

        <Link
          to="/app"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[var(--bg-raised)] hover:bg-[var(--bg-overlay-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)] transition-colors self-start sm:self-auto shadow-sm cursor-pointer"
        >
          <Layers className="w-3.5 h-3.5 text-[var(--accent)]" />
          <span>Back to Workspace</span>
        </Link>
      </div>

      {/* Small Sample Size Warning if n < 20 */}
      {stats.isSmallSample && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-3">
          <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold text-[var(--text-primary)]">Small Sample Size Notice (n = {stats.total}):</strong>{' '}
            Statistical distributions on lists under 20 addresses are purely descriptive and should not be used to predict global campaign deliverability.
          </div>
        </div>
      )}

      {/* Primary KPI Metric Cards with Count-up animation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Analyzed */}
        <div className="p-5 rounded-2xl bg-[var(--bg-raised)] border border-[var(--border-subtle)] shadow-sm space-y-2 transition-colors">
          <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
            <span>Analyzed Addresses</span>
            <ShieldCheck className="w-4 h-4 text-[var(--text-faint)]" />
          </div>
          <div className="text-3xl font-extrabold text-[var(--text-primary)] font-mono">
            <CountUp value={stats.total} />
          </div>
          <div className="text-[11px] text-[var(--text-faint)]">100% evaluated in memory</div>
        </div>

        {/* Likely Deliverable */}
        <div className="p-5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/30 space-y-2 transition-colors">
          <div className="flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-400">
            <span className="flex items-center gap-1 font-semibold">
              <CheckCircle className="w-3.5 h-3.5" /> Likely Deliverable
            </span>
            <span className="font-mono">{stats.deliverablePct}%</span>
          </div>
          <div className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-300 font-mono">
            <CountUp value={stats.deliverable} />
          </div>
          <div className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80">Positive protocol evidence found</div>
        </div>

        {/* Likely Bounce */}
        <div className="p-5 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-500/30 space-y-2 transition-colors">
          <div className="flex items-center justify-between text-xs text-rose-700 dark:text-rose-400">
            <span className="flex items-center gap-1 font-semibold">
              <XCircle className="w-3.5 h-3.5" /> Likely to Bounce
            </span>
            <span className="font-mono">{stats.bouncePct}%</span>
          </div>
          <div className="text-3xl font-extrabold text-rose-700 dark:text-rose-300 font-mono">
            <CountUp value={stats.bounce} />
          </div>
          <div className="text-[11px] text-rose-600/80 dark:text-rose-400/80">Syntax failure, no MX, or rejected</div>
        </div>

        {/* Unknown */}
        <div className="p-5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/30 space-y-2 transition-colors">
          <div className="flex items-center justify-between text-xs text-amber-700 dark:text-amber-400">
            <span className="flex items-center gap-1 font-semibold">
              <AlertTriangle className="w-3.5 h-3.5" /> Unknown / Inconclusive
            </span>
            <span className="font-mono">{stats.unknownPct}%</span>
          </div>
          <div className="text-3xl font-extrabold text-amber-700 dark:text-amber-300 font-mono">
            <CountUp value={stats.unknown} />
          </div>
          <div className="text-[11px] text-amber-600/80 dark:text-amber-400/80">Catch-all, greylisted, or skipped probe</div>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Breakdown */}
        <div className="p-6 rounded-2xl bg-[var(--bg-raised)] border border-[var(--border-subtle)] shadow-sm space-y-4 transition-colors">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[var(--text-primary)]">Classification Breakdown</h2>
            <span className="text-xs text-[var(--text-faint)] font-mono">Relative Ratio</span>
          </div>

          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {stats.pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-raised)',
                    borderColor: 'var(--border-strong)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: 'var(--text-primary)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-mono pt-2 border-t border-[var(--border-subtle)]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-[var(--text-secondary)]">Deliverable ({stats.deliverable})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="text-[var(--text-secondary)]">Bounce ({stats.bounce})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-[var(--text-secondary)]">Unknown ({stats.unknown})</span>
            </div>
          </div>
        </div>

        {/* Top Domains Distribution */}
        <div className="p-6 rounded-2xl bg-[var(--bg-raised)] border border-[var(--border-subtle)] shadow-sm space-y-4 transition-colors">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[var(--text-primary)]">Top Domains in Current Batch</h2>
            <span className="text-xs text-[var(--text-faint)] font-mono">Volume by Domain</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.domainList} layout="vertical" margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
                <XAxis type="number" stroke="var(--text-faint)" fontSize={11} allowDecimals={false} />
                <YAxis dataKey="domain" type="category" stroke="var(--text-faint)" fontSize={11} width={90} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-raised)',
                    borderColor: 'var(--border-strong)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: 'var(--text-primary)',
                  }}
                />
                <Bar dataKey="total" fill="var(--accent)" radius={[0, 4, 4, 0]} name="Addresses" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="text-[11px] text-[var(--text-faint)] text-center font-mono pt-2 border-t border-[var(--border-subtle)]">
            Showing top {stats.domainList.length} domains sorted by recipient volume
          </div>
        </div>
      </div>

      {/* Provider Distribution Card */}
      <div className="p-6 rounded-2xl bg-[var(--bg-raised)] border border-[var(--border-subtle)] shadow-sm space-y-3 transition-colors">
        <div className="flex items-center gap-2">
          <Server className="w-4 h-4 text-[var(--accent)]" />
          <h2 className="text-sm font-bold text-[var(--text-primary)]">Mail Server Infrastructure Distribution</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
          {stats.providerList.map((p, idx) => (
            <div key={idx} className="p-3 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)]">
              <div className="text-xs text-[var(--text-secondary)] font-mono truncate">{p.name}</div>
              <div className="text-lg font-bold text-[var(--text-primary)] font-mono mt-1">
                <CountUp value={p.count} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimers & Methodology */}
      <div className="p-5 rounded-2xl bg-[var(--bg-raised)] border border-[var(--border-subtle)] space-y-3 transition-colors">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-faint)]">
          Auditable Deliverability Methodology
        </h3>
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-sans">
          <strong>Important Industry Clarification:</strong> Mailscope provides objective evidence based on live protocol checks (syntax parsing, DNS MX routing, and SMTP recipient probe handshakes). These results reflect recipient mailbox availability at the moment of verification. They do not predict subjective spam filter placement, recipient engagement, or domain reputation algorithms at recipient mailbox providers.
        </p>
      </div>
    </div>
  );
};

export default AnalyticsPage;
