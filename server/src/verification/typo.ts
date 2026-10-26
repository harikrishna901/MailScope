/**
 * Mailscope Typo Suggestion Engine
 * Detects domain and TLD typos using Damerau-Levenshtein distance against popular email domains.
 */

export const POPULAR_DOMAINS: readonly string[] = [
  'gmail.com',
  'yahoo.com',
  'outlook.com',
  'hotmail.com',
  'icloud.com',
  'proton.me',
  'protonmail.com',
  'live.com',
  'aol.com',
  'msn.com',
  'yahoo.co.in',
  'rediffmail.com',
];

export const COMMON_TLD_TYPOS: Record<string, string> = {
  '.con': '.com',
  '.cmo': '.com',
  '.comm': '.com',
  '.ocm': '.com',
  '.vom': '.com',
  '.cpm': '.com',
  '.og': '.org',
  '.coom': '.com',
};

/**
 * Calculates the Damerau-Levenshtein distance between two strings,
 * accounting for insertions, deletions, substitutions, and adjacent transpositions.
 */
export function damerauLevenshtein(a: string, b: string): number {
  const al = a.length;
  const bl = b.length;
  if (al === 0) return bl;
  if (bl === 0) return al;

  // Initialize (al + 1) x (bl + 1) matrix
  const d: number[][] = Array.from({ length: al + 1 }, () => Array(bl + 1).fill(0));
  for (let i = 0; i <= al; i++) d[i][0] = i;
  for (let j = 0; j <= bl; j++) d[0][j] = j;

  for (let i = 1; i <= al; i++) {
    for (let j = 1; j <= bl; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1, // deletion
        d[i][j - 1] + 1, // insertion
        d[i - 1][j - 1] + cost // substitution
      );

      // Transposition
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }

  return d[al][bl];
}

export const damerauLevenshteinDistance = damerauLevenshtein;

export interface TypoSuggestion {
  corrected: string;
  reason: string;
}

/**
 * Checks an email address for potential domain or TLD typos.
 * Only suggests when the typed domain is not itself in the popular list.
 * Never suggests more than one candidate.
 */
export function suggestTypoFix(
  email: string,
  popularDomains: readonly string[] = POPULAR_DOMAINS
): TypoSuggestion | undefined {
  const atIdx = email.lastIndexOf('@');
  if (atIdx === -1 || atIdx === 0 || atIdx === email.length - 1) {
    return undefined;
  }

  const localPart = email.slice(0, atIdx);
  const domain = email.slice(atIdx + 1).toLowerCase().trim();

  // If the domain is already an exact match in the popular list, no suggestion needed
  if (popularDomains.includes(domain)) {
    return undefined;
  }

  // 1. Check for common TLD typos (.con, .cmo, .comm, .ocm, .vom)
  for (const [typoTld, correctTld] of Object.entries(COMMON_TLD_TYPOS)) {
    if (domain.endsWith(typoTld)) {
      const fixedDomain = domain.slice(0, -typoTld.length) + correctTld;
      return {
        corrected: `${localPart}@${fixedDomain}`,
        reason: `Possible typo in top-level domain (${typoTld} -> ${correctTld})`,
      };
    }
  }

  // 2. Check Damerau-Levenshtein distance against popular domains
  // Max distance 1 for domains up to 10 characters, 2 for longer domains
  const maxAllowedDistance = domain.length <= 10 ? 1 : 2;

  let bestMatch: string | null = null;
  let lowestDistance = Infinity;
  let matchesAtLowest = 0;

  for (const targetDomain of popularDomains) {
    const dist = damerauLevenshtein(domain, targetDomain);
    if (dist <= maxAllowedDistance) {
      if (dist < lowestDistance) {
        lowestDistance = dist;
        bestMatch = targetDomain;
        matchesAtLowest = 1;
      } else if (dist === lowestDistance) {
        matchesAtLowest++;
      }
    }
  }

  // Only suggest if there is an unambiguous single best candidate
  if (bestMatch && matchesAtLowest === 1) {
    return {
      corrected: `${localPart}@${bestMatch}`,
      reason: `Possible typo for ${bestMatch}`,
    };
  }

  return undefined;
}

/**
 * Checks a domain name or email for typos and returns suggestions formatted for domain checks.
 */
export function suggestDomainTypo(
  domainOrEmail: string,
  popularDomains: readonly string[] = POPULAR_DOMAINS
): TypoSuggestion | undefined {
  const isEmail = domainOrEmail.includes('@');
  const dummyEmail = isEmail ? domainOrEmail : `user@${domainOrEmail}`;
  const res = suggestTypoFix(dummyEmail, popularDomains);
  if (!res) return undefined;

  if (!isEmail) {
    const at = res.corrected.lastIndexOf('@');
    const correctedDomain = res.corrected.slice(at + 1);
    const reason = res.reason.includes('top-level domain')
      ? `Likely typo for ${correctedDomain.slice(correctedDomain.lastIndexOf('.'))}`
      : `Likely typo for ${correctedDomain}`;
    return {
      corrected: correctedDomain,
      reason,
    };
  }

  return res;
}
