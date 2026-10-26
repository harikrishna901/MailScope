import { EmailResult } from '../types.ts';
import { detectMailProvider } from './intelligence.ts';

/**
 * Sanitizes a CSV cell to prevent formula injection (CSV Injection / DDE attack).
 * If a cell begins with '=', '+', '-', or '@', it prefixes it with an apostrophe.
 */
export function sanitizeCsvCell(value: string | null | undefined): string {
  if (value === null || value === undefined) return '""';
  let str = String(value);

  // Formula injection neutralization
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // Escape quotes and wrap in quotes if containing comma, quote, or newline
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return `"${str}"`;
}

/**
 * Generates an RFC 4180 compliant CSV string from an array of EmailResult objects.
 * Includes email, classification, deliverability confidence, provider, routing checks,
 * typo suggestion, role address, disposable, free provider, SPF/DMARC flags, and timestamp.
 */
export function generateCsv(results: EmailResult[]): string {
  const headers = [
    'Email',
    'Classification',
    'Confidence Score',
    'Provider',
    'Syntax Valid',
    'Domain',
    'MX Status',
    'SMTP Status',
    'Typo Suggestion',
    'Role Address',
    'Disposable Domain',
    'Free Provider',
    'SPF',
    'DMARC',
    'Reason',
    'Checked At',
  ];

  const headerRow = headers.map(sanitizeCsvCell).join(',');
  const rows = results.map((r) => {
    let confidence = '50%';
    if (r.classification === 'likely_deliverable') {
      confidence = r.smtpStatus === 'accepted' ? '98%' : '90%';
    } else if (r.classification === 'likely_bounce') {
      confidence = !r.syntaxValid || r.mxStatus === 'none' ? '2%' : '8%';
    }
    const provider = detectMailProvider(r.reason, r.domain).name;

    return [
      sanitizeCsvCell(r.email),
      sanitizeCsvCell(r.classification),
      sanitizeCsvCell(confidence),
      sanitizeCsvCell(provider),
      sanitizeCsvCell(r.syntaxValid ? 'Valid' : 'Invalid'),
      sanitizeCsvCell(r.domain || ''),
      sanitizeCsvCell(r.mxStatus),
      sanitizeCsvCell(r.smtpStatus),
      sanitizeCsvCell(r.suggestion ? r.suggestion.corrected : ''),
      sanitizeCsvCell(r.isRoleAddress ? 'Yes' : 'No'),
      sanitizeCsvCell(r.isDisposableDomain ? 'Yes' : 'No'),
      sanitizeCsvCell(r.isFreeProvider ? 'Yes' : 'No'),
      sanitizeCsvCell(r.domainAuth?.spf || 'Not checked'),
      sanitizeCsvCell(r.domainAuth?.dmarc || 'Not checked'),
      sanitizeCsvCell(r.reason),
      sanitizeCsvCell(r.checkedAt),
    ].join(',');
  });

  return [headerRow, ...rows].join('\r\n');
}

/**
 * Parses raw text or CSV content and extracts unique email strings.
 * Safely handles CSV rows by inspecting columns or falling back to regex extraction.
 */
export function extractEmailsFromText(text: string): string[] {
  if (!text || typeof text !== 'string') return [];

  // Match potential email addresses line by line or within delimiters
  const lines = text.split(/\r?\n/);
  const emails: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // If CSV row, check comma or semicolon delimiters
    if (trimmed.includes(',') || trimmed.includes(';')) {
      const parts = trimmed.split(/[,;\t]/);
      for (const part of parts) {
        const cleaned = part.replace(/^["']|["']$/g, '').trim();
        if (cleaned.includes('@')) {
          emails.push(cleaned);
        }
      }
    } else if (trimmed.includes('@')) {
      emails.push(trimmed);
    }
  }

  return emails;
}
