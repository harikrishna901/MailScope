import React from 'react';
import { EmailResult } from '../../types.ts';
import { isDisposableDomain } from '../../lib/intelligence.ts';

interface PrintableReportProps {
  results: EmailResult[];
  includeFullList: boolean;
}

export const PrintableReport: React.FC<PrintableReportProps> = ({ results, includeFullList }) => {
  const total = results.length;
  const deliverable = results.filter((r) => r.classification === 'likely_deliverable').length;
  const bounce = results.filter((r) => r.classification === 'likely_bounce').length;
  const unknown = results.filter((r) => r.classification === 'unknown').length;

  const deliverablePct = total > 0 ? ((deliverable / total) * 100).toFixed(1) : '0.0';
  const bouncePct = total > 0 ? ((bounce / total) * 100).toFixed(1) : '0.0';
  const unknownPct = total > 0 ? ((unknown / total) * 100).toFixed(1) : '0.0';

  const roleCount = results.filter((r) => r.isRoleAddress).length;
  const disposableCount = results.filter((r) => r.isDisposableDomain ?? isDisposableDomain(r.domain)).length;
  const typoCount = results.filter((r) => Boolean(r.suggestion)).length;
  const domainAuthCheckedCount = results.filter((r) => Boolean(r.domainAuth)).length;
  const spfPresentCount = results.filter((r) => r.domainAuth?.spf === 'present').length;
  const dmarcEnforcedCount = results.filter(
    (r) => r.domainAuth?.dmarc === 'reject' || r.domainAuth?.dmarc === 'quarantine'
  ).length;

  const generatedDate = new Date().toLocaleString('en-US', {
    dateStyle: 'full',
    timeStyle: 'medium',
  });

  return (
    <div className="print-only text-slate-900 bg-white p-6 max-w-4xl mx-auto font-sans leading-normal">
      {/* Executive Report Header */}
      <div className="border-b-2 border-slate-900 pb-4 mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Mailscope Verification Report</h1>
          <p className="text-xs text-slate-600 mt-1">
            Generated: {generatedDate} · Total Records Evaluated: <strong>{total}</strong>
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs font-mono uppercase tracking-widest px-2 py-1 border border-slate-400 font-bold">
            CONFIDENTIAL / AUDIT
          </span>
        </div>
      </div>

      {/* Deliverability Verdict KPI Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6 page-break-avoid">
        <div className="border border-slate-300 p-4 rounded-md">
          <div className="text-xs uppercase tracking-wider text-slate-600 font-semibold">Likely Deliverable</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {deliverable} <span className="text-sm font-normal text-slate-600">({deliverablePct}%)</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Passed syntax, valid MX & responsive server probe</div>
        </div>

        <div className="border border-slate-300 p-4 rounded-md">
          <div className="text-xs uppercase tracking-wider text-slate-600 font-semibold">Likely to Bounce</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {bounce} <span className="text-sm font-normal text-slate-600">({bouncePct}%)</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Definite mailbox rejection, null MX, or invalid syntax</div>
        </div>

        <div className="border border-slate-300 p-4 rounded-md">
          <div className="text-xs uppercase tracking-wider text-slate-600 font-semibold">Unknown / Inconclusive</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {unknown} <span className="text-sm font-normal text-slate-600">({unknownPct}%)</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Greylisting defense, connection timeout, or catch-all</div>
        </div>
      </div>

      {/* High-Level Findings & Signals Breakdown */}
      <div className="border border-slate-300 rounded-md p-4 mb-6 page-break-avoid">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-2 mb-3">
          Signal & Hygiene Breakdown (Advisory Flags)
        </h2>
        <table className="w-full text-xs">
          <tbody>
            <tr className="border-b border-slate-100">
              <td className="py-1.5 font-semibold text-slate-700">Typo Suggestions:</td>
              <td className="py-1.5 text-right font-mono font-bold">{typoCount}</td>
              <td className="py-1.5 text-slate-500 pl-4">Addresses with recognized syntax/TLD typos</td>
            </tr>
            <tr className="border-b border-slate-100">
              <td className="py-1.5 font-semibold text-slate-700">Role / Shared Mailboxes:</td>
              <td className="py-1.5 text-right font-mono font-bold">{roleCount}</td>
              <td className="py-1.5 text-slate-500 pl-4">Functional aliases (admin@, support@, info@)</td>
            </tr>
            <tr className="border-b border-slate-100">
              <td className="py-1.5 font-semibold text-slate-700">Disposable Domains:</td>
              <td className="py-1.5 text-right font-mono font-bold">{disposableCount}</td>
              <td className="py-1.5 text-slate-500 pl-4">Temporary throwaway inbox providers</td>
            </tr>
            {domainAuthCheckedCount > 0 && (
              <>
                <tr className="border-b border-slate-100">
                  <td className="py-1.5 font-semibold text-slate-700">SPF Record Present:</td>
                  <td className="py-1.5 text-right font-mono font-bold">
                    {spfPresentCount} / {domainAuthCheckedCount}
                  </td>
                  <td className="py-1.5 text-slate-500 pl-4">Domain authorizes outbound mail via SPF (RFC 7208)</td>
                </tr>
                <tr>
                  <td className="py-1.5 font-semibold text-slate-700">DMARC Policy Enforced:</td>
                  <td className="py-1.5 text-right font-mono font-bold">
                    {dmarcEnforcedCount} / {domainAuthCheckedCount}
                  </td>
                  <td className="py-1.5 text-slate-500 pl-4">Quarantine or Reject policy enforced (RFC 7489)</td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* Full Address List (Optional) */}
      {includeFullList && results.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-2">
            Detailed Address Register ({results.length} rows)
          </h2>
          <table className="w-full text-[10px] border border-slate-300">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 text-left font-mono uppercase text-slate-700">
                <th className="py-1.5 px-2">#</th>
                <th className="py-1.5 px-2">Email Address</th>
                <th className="py-1.5 px-2">Verdict</th>
                <th className="py-1.5 px-2">Signals</th>
                <th className="py-1.5 px-2">Diagnostic Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono">
              {results.map((r, i) => {
                const signals: string[] = [];
                if (r.suggestion) signals.push(`Typo → ${r.suggestion.corrected}`);
                if (r.isRoleAddress) signals.push('Role');
                if (r.isDisposableDomain ?? isDisposableDomain(r.domain)) signals.push('Disposable');
                if (r.isFreeProvider) signals.push('Free');
                if (r.domainAuth) {
                  signals.push(`SPF:${r.domainAuth.spf}`);
                  signals.push(`DMARC:${r.domainAuth.dmarc}`);
                }

                return (
                  <tr key={r.email} className="page-break-avoid">
                    <td className="py-1 px-2 text-slate-400">{i + 1}</td>
                    <td className="py-1 px-2 font-semibold text-slate-900">{r.email}</td>
                    <td className="py-1 px-2 uppercase font-bold">
                      {r.classification === 'likely_deliverable' && (
                        <span className="text-emerald-700">Deliverable</span>
                      )}
                      {r.classification === 'likely_bounce' && (
                        <span className="text-rose-700">Bounce</span>
                      )}
                      {r.classification === 'unknown' && (
                        <span className="text-amber-700">Unknown</span>
                      )}
                    </td>
                    <td className="py-1 px-2 text-slate-600 font-sans">{signals.join(', ') || '—'}</td>
                    <td className="py-1 px-2 text-slate-600 font-sans truncate max-w-xs">{r.reason}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Standard Required Disclaimer */}
      <div className="mt-8 pt-4 border-t border-slate-300 text-[10px] text-slate-500 leading-relaxed page-break-avoid">
        <p className="font-semibold text-slate-700 mb-0.5">Disclaimer:</p>
        <p>
          This report reflects email deliverability indicators at time of testing. Mailscope does not guarantee delivery.
          No emails were sent during this check. All checks comply strictly with RFC standards without issuing SMTP DATA commands.
        </p>
      </div>
    </div>
  );
};
