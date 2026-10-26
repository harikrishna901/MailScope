import { EmailResult } from '../types.ts';

/**
 * Common disposable / throwaway email domain patterns
 */
export const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com',
  '10minutemail.com',
  'tempmail.com',
  'temp-mail.org',
  'guerrillamail.com',
  'guerrillamail.net',
  'guerrillamail.org',
  'yopmail.com',
  'sharklasers.com',
  'dispostable.com',
  'trashmail.com',
  'trashmail.net',
  'getairmail.com',
  'throwawaymail.com',
  'maildrop.cc',
  'fakeinbox.com',
  'generator.email',
  'tempail.com',
  'mohmal.com',
  'emailondeck.com',
]);

export interface ProviderInfo {
  name: string;
  type: 'google' | 'microsoft' | 'cloudflare' | 'proton' | 'fastmail' | 'apple' | 'generic';
  color: string;
}

/**
 * Fingerprints mail infrastructure from MX exchange hosts or domain
 */
export function detectMailProvider(mxReasonOrHost: string, domain: string | null): ProviderInfo {
  const text = (mxReasonOrHost + ' ' + (domain || '')).toLowerCase();

  if (text.includes('google') || text.includes('aspmx') || text.includes('l.google.com') || domain === 'gmail.com') {
    return { name: 'Google Workspace', type: 'google', color: '#ea4335' };
  }
  if (text.includes('outlook') || text.includes('protection.outlook.com') || text.includes('microsoft') || domain === 'outlook.com' || domain === 'hotmail.com') {
    return { name: 'Microsoft 365', type: 'microsoft', color: '#0078d4' };
  }
  if (text.includes('cloudflare') || text.includes('cf-emailsecurity.net')) {
    return { name: 'Cloudflare Area 1', type: 'cloudflare', color: '#f38020' };
  }
  if (text.includes('proton') || text.includes('protonmail')) {
    return { name: 'ProtonMail', type: 'proton', color: '#6d4aff' };
  }
  if (text.includes('fastmail') || text.includes('messagingengine.com')) {
    return { name: 'Fastmail', type: 'fastmail', color: '#0066cc' };
  }
  if (text.includes('icloud') || text.includes('apple') || domain === 'icloud.com') {
    return { name: 'Apple iCloud', type: 'apple', color: '#a2aaad' };
  }

  return { name: 'Custom / Self-Hosted', type: 'generic', color: '#64748b' };
}

/**
 * Checks if a domain is a known disposable or burner address provider
 */
export function isDisposableDomain(domain: string | null): boolean {
  if (!domain) return false;
  const lower = domain.toLowerCase().trim();
  return DISPOSABLE_DOMAINS.has(lower);
}

export interface ListHealthAudit {
  score: number; // 0 - 100
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  deliverableCount: number;
  bounceCount: number;
  unknownCount: number;
  disposableCount: number;
  syntaxErrorCount: number;
  nullMxCount: number;
  recommendations: string[];
}

/**
 * Calculates a comprehensive list health score and actionable recommendations
 */
export function calculateListHealth(results: EmailResult[]): ListHealthAudit {
  if (results.length === 0) {
    return {
      score: 100,
      grade: 'A+',
      deliverableCount: 0,
      bounceCount: 0,
      unknownCount: 0,
      disposableCount: 0,
      syntaxErrorCount: 0,
      nullMxCount: 0,
      recommendations: ['Paste or upload an email list to run deliverability analysis.'],
    };
  }

  const total = results.length;
  let deliverableCount = 0;
  let bounceCount = 0;
  let unknownCount = 0;
  let disposableCount = 0;
  let syntaxErrorCount = 0;
  let nullMxCount = 0;

  for (const r of results) {
    if (r.classification === 'likely_deliverable') deliverableCount++;
    else if (r.classification === 'likely_bounce') bounceCount++;
    else unknownCount++;

    if (!r.syntaxValid) syntaxErrorCount++;
    if (r.reason.toLowerCase().includes('null mx')) nullMxCount++;
    if (isDisposableDomain(r.domain)) disposableCount++;
  }

  // Scoring algorithm:
  // Starts at 100.
  // Deduct 25 points per 10% bounce rate
  // Deduct 5 points per 10% unknown rate
  // Deduct 10 points per disposable domain
  const bouncePct = (bounceCount / total) * 100;
  const unknownPct = (unknownCount / total) * 100;
  const disposablePenalty = Math.min(25, disposableCount * 5);

  const rawScore = 100 - bouncePct * 2.2 - unknownPct * 0.4 - disposablePenalty;
  const score = Math.max(5, Math.min(100, Math.round(rawScore)));

  let grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F' = 'A+';
  if (score >= 95) grade = 'A+';
  else if (score >= 88) grade = 'A';
  else if (score >= 75) grade = 'B';
  else if (score >= 60) grade = 'C';
  else if (score >= 45) grade = 'D';
  else grade = 'F';

  const recommendations: string[] = [];

  if (bounceCount > 0) {
    recommendations.push(
      `Remove ${bounceCount} address${bounceCount > 1 ? 'es' : ''} classified as Likely to Bounce before sending to avoid ESP reputation penalty.`
    );
  }
  if (syntaxErrorCount > 0) {
    recommendations.push(
      `Fix ${syntaxErrorCount} malformed syntax address${syntaxErrorCount > 1 ? 'es' : ''} (e.g. consecutive dots or missing @ delimiters).`
    );
  }
  if (nullMxCount > 0) {
    recommendations.push(
      `Detected ${nullMxCount} domain(s) publishing RFC 7505 Null MX rejecting all mail.`
    );
  }
  if (disposableCount > 0) {
    recommendations.push(
      `Identified ${disposableCount} disposable / burner email address${disposableCount > 1 ? 'es' : ''}. Consider gating or filtering these signups.`
    );
  }
  if (unknownCount > 0) {
    recommendations.push(
      `${unknownCount} address${unknownCount > 1 ? 'es are' : ' is'} classified as Unknown (catch-all or skipped SMTP); warm these gradually with double opt-in.`
    );
  }
  if (recommendations.length === 0) {
    recommendations.push('Excellent list hygiene! All evaluated addresses pass format and DNS routing checks.');
  }

  return {
    score,
    grade,
    deliverableCount,
    bounceCount,
    unknownCount,
    disposableCount,
    syntaxErrorCount,
    nullMxCount,
    recommendations,
  };
}
