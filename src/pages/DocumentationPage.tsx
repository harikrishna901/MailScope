import React from 'react';
import {
  BookOpen,
  Terminal,
  Globe,
  Server,
  Lock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ShieldAlert,
  Sparkles,
  ShieldCheck,
  UserCheck,
  RefreshCw,
} from 'lucide-react';

export const DocumentationPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 pb-20">
      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-500/30 text-cyan-800 dark:text-cyan-300 text-xs font-semibold">
          <BookOpen className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
          <span>Technical Whitepaper & Protocol Reference</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          How Mailscope Evaluates Deliverability
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Mailscope is built on the premise of honest uncertainty. Unlike commercial tools that fabricate high "deliverability scores" through black-box guesses, Mailscope relies strictly on auditable protocol evidence, transparent fallback rules, and non-destructive DNS queries.
        </p>
      </div>

      {/* The 7 Decision Rules Matrix */}
      <section className="p-6 rounded-2xl bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span>The 7-Rule Classification Hierarchy</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Evaluated strictly in order. The <strong className="text-slate-900 dark:text-white">first matching rule wins</strong>. All additional signals (typo suggestions, role mailboxes, disposable domains, and SPF/DMARC checks) are purely advisory flags and never change this classification.
        </p>

        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-mono text-[11px] border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3">Priority</th>
                <th className="p-3">Condition Trigger</th>
                <th className="p-3">Classification</th>
                <th className="p-3">Rationale & Evidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              <tr>
                <td className="p-3 font-mono font-bold text-cyan-600 dark:text-cyan-400">Rule 1</td>
                <td className="p-3 font-mono text-rose-600 dark:text-rose-300">Syntax Invalid</td>
                <td className="p-3">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                    <XCircle className="w-3 h-3" /> Likely to Bounce
                  </span>
                </td>
                <td className="p-3 text-slate-500 dark:text-slate-400">
                  Address violates length limits, dot positioning, or contains forbidden characters.
                </td>
              </tr>
              <tr>
                <td className="p-3 font-mono font-bold text-cyan-600 dark:text-cyan-400">Rule 2</td>
                <td className="p-3 font-mono text-rose-600 dark:text-rose-300">MX Status is 'none'</td>
                <td className="p-3">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                    <XCircle className="w-3 h-3" /> Likely to Bounce
                  </span>
                </td>
                <td className="p-3 text-slate-500 dark:text-slate-400">
                  Domain has no MX records, no A/AAAA fallback, or publishes an RFC 7505 Null MX.
                </td>
              </tr>
              <tr>
                <td className="p-3 font-mono font-bold text-cyan-600 dark:text-cyan-400">Rule 3</td>
                <td className="p-3 font-mono text-amber-600 dark:text-amber-300">MX 'lookup_failed' or 'not_checked'</td>
                <td className="p-3">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="w-3 h-3" /> Unknown
                  </span>
                </td>
                <td className="p-3 text-slate-500 dark:text-slate-400">
                  DNS resolver encountered a SERVFAIL, timeout, or network glitch. Not proof of a bounce.
                </td>
              </tr>
              <tr>
                <td className="p-3 font-mono font-bold text-cyan-600 dark:text-cyan-400">Rule 4</td>
                <td className="p-3 font-mono text-rose-600 dark:text-rose-300">SMTP 'rejected_permanent'</td>
                <td className="p-3">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                    <XCircle className="w-3 h-3" /> Likely to Bounce
                  </span>
                </td>
                <td className="p-3 text-slate-500 dark:text-slate-400">
                  Host explicitly issued 550 / 5.1.1 rejecting the recipient mailbox.
                </td>
              </tr>
              <tr>
                <td className="p-3 font-mono font-bold text-cyan-600 dark:text-cyan-400">Rule 5</td>
                <td className="p-3 font-mono text-amber-600 dark:text-amber-300">SMTP 'catch_all'</td>
                <td className="p-3">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="w-3 h-3" /> Unknown
                  </span>
                </td>
                <td className="p-3 text-slate-500 dark:text-slate-400">
                  Mail server accepts any probe. Individual recipient existence cannot be verified.
                </td>
              </tr>
              <tr>
                <td className="p-3 font-mono font-bold text-cyan-600 dark:text-cyan-400">Rule 6</td>
                <td className="p-3 font-mono text-emerald-600 dark:text-emerald-300">SMTP 'accepted'</td>
                <td className="p-3">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle className="w-3 h-3" /> Likely Deliverable
                  </span>
                </td>
                <td className="p-3 text-slate-500 dark:text-slate-400">
                  Server accepted recipient check (positive evidence; does not guarantee final inbox arrival).
                </td>
              </tr>
              <tr>
                <td className="p-3 font-mono font-bold text-cyan-600 dark:text-cyan-400">Rule 7</td>
                <td className="p-3 font-mono text-slate-500 dark:text-slate-400">All other states ('skipped', 'temporary_failure', 'unreachable', 'policy_blocked')</td>
                <td className="p-3">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="w-3 h-3" /> Unknown
                  </span>
                </td>
                <td className="p-3 text-slate-500 dark:text-slate-400">
                  Temporary failure or skipped SMTP cannot guarantee delivery. Honest uncertainty is maintained.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Part C: Informational Signals & Hygiene Details */}
      <div className="space-y-6">
        {/* Section: Typo Suggestions */}
        <section className="p-6 rounded-2xl bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Typo Suggestions (Damerau-Levenshtein Metric)
            </h2>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
            Mailscope automatically screens email domains against a catalog of the internet's most prevalent consumer and business mail providers (e.g. <code>gmail.com</code>, <code>outlook.com</code>, <code>yahoo.com</code>, <code>icloud.com</code>, <code>proton.me</code>).
          </p>
          <ul className="list-disc list-inside text-xs text-slate-600 dark:text-slate-300 space-y-1.5 pl-2 font-sans">
            <li>
              <strong>Edit Distance Thresholds:</strong> Uses the true Damerau-Levenshtein distance algorithm (counting insertions, deletions, substitutions, and adjacent character transpositions). Domains up to 10 characters allow distance 1; domains over 10 characters allow distance 2.
            </li>
            <li>
              <strong>Common TLD Typo Corrections:</strong> Flags mistyped top-level domains such as <code>.con</code>, <code>.cmo</code>, <code>.ocm</code>, <code>.cpm</code>, <code>.og</code>, <code>.coom</code>, and proposes the intended extension (e.g. <code>.com</code> or <code>.org</code>).
            </li>
            <li>
              <strong>Why Typos Do Not Alter Classification:</strong> Even if an address is typed as <code>user@gmial.com</code>, <code>gmial.com</code> might be an active, parked, or catch-all domain with published MX records. Mailscope reports the objective protocol verdict for what was actually queried, and provides the typo correction as an actionable suggestion with a 1-click "Apply fix" action.
            </li>
          </ul>
        </section>

        {/* Section: Role and Disposable Mailboxes */}
        <section className="p-6 rounded-2xl bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
              <UserCheck className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Role Addresses & Disposable Mailboxes
            </h2>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
            Understanding who receives your message is as critical as verifying technical reachability:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600 dark:text-slate-300 pt-1 font-sans">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 space-y-1.5">
              <strong className="text-slate-900 dark:text-white block font-semibold">
                Role / Departmental Addresses
              </strong>
              <p>
                Identified when the local part matches functional aliases such as <code>admin</code>, <code>support</code>, <code>info</code>, <code>billing</code>, <code>sales</code>, <code>compliance</code>, or <code>webmaster</code>.
              </p>
              <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                Role mailboxes are frequently deliverable, but carry elevated risks of spam complaints and lower personal engagement.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 space-y-1.5">
              <strong className="text-slate-900 dark:text-white block font-semibold">
                Disposable & Ephemeral Domains
              </strong>
              <p>
                Evaluated against bundled lists of temporary and throwaway email services (e.g. Mailinator, Guerrilla Mail, Temp-Mail, 10MinuteMail).
              </p>
              <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                While technically accepting messages today, disposable mailboxes self-destruct rapidly and damage sender reputation.
              </p>
            </div>
          </div>
        </section>

        {/* Section: SPF and DMARC */}
        <section className="p-6 rounded-2xl bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              SPF & DMARC Domain Authentication (Informational)
            </h2>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
            Users can optionally include lightweight DNS lookups for domain-level email authentication records (SPF via <code>v=spf1</code> and DMARC via <code>_dmarc.&lt;domain&gt;</code> TXT records).
          </p>
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs space-y-1">
            <strong>Why SPF & DMARC Never Change Deliverability Classification:</strong>
            <p className="text-[11px] leading-relaxed">
              SPF and DMARC govern how a domain <em>sends</em> mail to prevent impersonation; they do not dictate whether a recipient mailbox exists to <em>receive</em> incoming mail. A domain with no DMARC record can still accept mail flawlessly, while a domain with strict <code>p=reject</code> may bounce an unknown user. Mailscope preserves this boundary of engineering truth.
            </p>
          </div>
        </section>

        {/* Section: Re-checking Unknown Results */}
        <section className="p-6 rounded-2xl bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <RefreshCw className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Re-Checking "Unknown" Inconclusive Results
            </h2>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
            When mail servers employ greylisting anti-spam protection, they intentionally return temporary <code>451</code> or <code>450</code> SMTP deferral codes upon initial contact from an unrecognized host. The RFC specification instructs legitimate senders to retry after a short delay (typically 1 to 5 minutes).
          </p>
          <ul className="list-disc list-inside text-xs text-slate-600 dark:text-slate-300 space-y-1 pl-2 font-sans text-xs">
            <li>
              The <strong>Re-check Unknown</strong> button isolates only inconclusive entries and issues an updated check.
            </li>
            <li>
              Results are merged in place by email address, updating statistics without altering the rest of your list.
            </li>
            <li>
              To prevent abusive looping against defensive mail exchangers, re-checks are limited to 3 rounds per session.
            </li>
          </ul>
        </section>

        {/* Step 1 */}
        <section className="p-6 rounded-2xl bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400">
              <Terminal className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Step 1: Syntax Validation & Normalization</h2>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
            Mailscope implements a practical subset of RFC 5321 and RFC 5322. Local parts are checked for a maximum length of 64 octets, and the entire email cannot exceed 254 octets. Consecutive dots (<code>..</code>) and leading/trailing dots are prohibited. The domain part must contain at least two labels, and top-level domains (TLDs) cannot be purely numeric.
          </p>
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 text-[11px] font-mono text-slate-600 dark:text-slate-400">
            Note: In accordance with standard production email practices, quoted local parts (e.g. <code>"john doe"@domain.com</code>), IP literal domains, and embedded RFC comments are considered non-deliverable by practical mail transfer agents and are flagged accordingly.
          </div>
        </section>

        {/* Step 2 */}
        <section className="p-6 rounded-2xl bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400">
              <Globe className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Step 2: DNS & Mail Exchange (MX) Resolution</h2>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
            DNS lookups query the domain's Mail Exchange records and sort them by ascending numerical priority.
          </p>
          <ul className="list-disc list-inside text-xs text-slate-600 dark:text-slate-300 space-y-1.5 pl-2 font-sans">
            <li>
              <strong className="text-slate-900 dark:text-white">RFC 7505 Null MX:</strong> If a domain publishes a single MX record with priority 0 and host <code>.</code> (or empty string), it explicitly signals that the domain accepts no email whatsoever. Mailscope flags this as an immediate bounce.
            </li>
            <li>
              <strong className="text-slate-900 dark:text-white">Implicit A / AAAA Fallback:</strong> If no MX records are published, RFC 5321 Section 5.1 specifies falling back to the domain's A or AAAA address. If found, status is <code>implicit_a</code>.
            </li>
            <li>
              <strong className="text-slate-900 dark:text-white">Resolver Errors vs Domain Bounces:</strong> Network timeouts or SERVFAIL responses are marked as <code>lookup_failed</code> and result in an <code>Unknown</code> classification. A resolver glitch is never treated as a bounce.
            </li>
          </ul>
        </section>

        {/* Step 3 */}
        <section className="p-6 rounded-2xl bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <Server className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Step 3: SMTP Recipient Probe (Zero Email Sent)</h2>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
            When SMTP verification is enabled, Mailscope initiates an outbound TCP socket to port 25 of the highest-priority mail exchange server:
          </p>
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/80 font-mono text-[11px] text-slate-700 dark:text-slate-300 space-y-1">
            <div className="text-slate-400">&lt;-- 220 mail.recipient.com ESMTP Postfix</div>
            <div className="text-cyan-600 dark:text-cyan-400">--&gt; EHLO mailscope.internal</div>
            <div className="text-slate-400">&lt;-- 250-mail.recipient.com / 250 OK</div>
            <div className="text-cyan-600 dark:text-cyan-400">--&gt; MAIL FROM:&lt;probe@mailscope.internal&gt;</div>
            <div className="text-slate-400">&lt;-- 250 2.1.0 Ok</div>
            <div className="text-cyan-600 dark:text-cyan-400">--&gt; RCPT TO:&lt;target@recipient.com&gt;</div>
            <div className="text-slate-400">&lt;-- 250 2.1.5 Recipient ok [OR 550 5.1.1 User unknown]</div>
            <div className="text-cyan-600 dark:text-cyan-400">--&gt; QUIT</div>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
            <strong className="text-slate-900 dark:text-white">Critical Safety Invariant:</strong> Mailscope never transmits the SMTP <code>DATA</code> command. No message body is ever transferred, no mail queue is populated, and no user inbox is notified.
          </p>
        </section>

        {/* Step 4 */}
        <section className="p-6 rounded-2xl bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Step 4: Catch-All Domain Detection</h2>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
            A catch-all mail server is configured to accept any email address addressed to its domain, regardless of whether a mailbox exists. When a target address returns <code>250 OK</code>, Mailscope generates a pseudo-random address at the same domain (e.g. <code>mailscope_probe_k8f9a2@domain.com</code>). If the server also accepts this fake address, the domain is confirmed as a catch-all server and the address is classified as <strong className="text-amber-600 dark:text-amber-400">Unknown</strong> to prevent false confidence.
          </p>
        </section>

        {/* Step 5: Cloud Hosting Reality */}
        <section className="p-6 rounded-2xl bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Hosting Environments & Outbound Port 25</h2>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
            To combat worldwide spam and botnets, virtually all modern cloud providers (Render, AWS EC2, Google Cloud, DigitalOcean, Heroku) block outbound traffic on TCP port 25 by default. Consequently:
          </p>
          <ul className="list-disc list-inside text-xs text-slate-600 dark:text-slate-300 space-y-1.5 pl-2 font-sans">
            <li>
              In standard cloud deployments, <code className="text-cyan-700 dark:text-cyan-300 font-mono">SMTP_ENABLED=false</code> is the default and safest configuration.
            </li>
            <li>
              When SMTP is skipped, valid syntax + valid MX records result in an honest <strong className="text-amber-600 dark:text-amber-400">Unknown</strong> classification, because existence cannot be guaranteed without live server dialogue.
            </li>
            <li>
              Syntax errors and missing domains continue to be accurately identified as <strong className="text-rose-600 dark:text-rose-400">Likely to Bounce</strong>.
            </li>
          </ul>
        </section>

        {/* Privacy & In-Memory Invariants */}
        <section className="p-6 rounded-2xl bg-white dark:bg-[#0e1628] border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400">
              <Lock className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Data Privacy & Security Safeguards</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600 dark:text-slate-300 pt-1 font-sans">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80">
              <strong className="text-slate-900 dark:text-white block mb-1">Zero Database Persistence</strong>
              Addresses exist only in volatile server memory during the request lifecycle and are immediately garbage collected.
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80">
              <strong className="text-slate-900 dark:text-white block mb-1">No Address Logs</strong>
              Application logs never output user email lists or recipient addresses to console or log streams.
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80">
              <strong className="text-slate-900 dark:text-white block mb-1">Formula Injection Protection</strong>
              CSV exports automatically sanitize cells starting with <code>=</code>, <code>+</code>, <code>-</code>, or <code>@</code> to protect against spreadsheet DDE exploits.
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80">
              <strong className="text-slate-900 dark:text-white block mb-1">No Third-Party Reselling</strong>
              Addresses are never submitted to third-party commercial verification APIs or marketing databases.
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
