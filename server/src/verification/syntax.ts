export interface SyntaxCheckResult {
  valid: boolean;
  normalizedEmail: string;
  localPart: string;
  domain: string;
  reason: string;
}

export interface NormalizationResult {
  uniqueEmails: string[];
  duplicatesRemoved: number;
  originalCount: number;
}

/**
 * Normalizes an array of input email strings:
 * - Trims whitespace
 * - Drops empty lines
 * - Case-insensitively deduplicates while preserving the original casing of the first occurrence
 */
export function normalizeAndDeduplicate(rawEmails: string[]): NormalizationResult {
  const seen = new Set<string>();
  const uniqueEmails: string[] = [];
  let duplicatesRemoved = 0;

  for (const raw of rawEmails) {
    if (!raw || typeof raw !== 'string') continue;
    const trimmed = raw.trim();
    if (!trimmed) continue;

    // Check case-insensitive key
    const lowerKey = trimmed.toLowerCase();
    if (seen.has(lowerKey)) {
      duplicatesRemoved++;
    } else {
      seen.add(lowerKey);
      uniqueEmails.push(trimmed);
    }
  }

  return {
    uniqueEmails,
    duplicatesRemoved,
    originalCount: rawEmails.length,
  };
}

/**
 * Validates email syntax using practical standards (RFC 5321/5322 subset).
 * Note: Practical check does not allow quoted local parts, comments, or IP literals.
 */
export function validateEmailSyntax(email: string): SyntaxCheckResult {
  const trimmed = email.trim();

  if (!trimmed) {
    return {
      valid: false,
      normalizedEmail: email,
      localPart: '',
      domain: '',
      reason: 'Email address cannot be empty',
    };
  }

  if (trimmed.length > 254) {
    return {
      valid: false,
      normalizedEmail: trimmed,
      localPart: '',
      domain: '',
      reason: `Email length (${trimmed.length}) exceeds the maximum 254 characters`,
    };
  }

  const atIndex = trimmed.lastIndexOf('@');
  if (atIndex === -1) {
    return {
      valid: false,
      normalizedEmail: trimmed,
      localPart: trimmed,
      domain: '',
      reason: 'Missing @ symbol in email address',
    };
  }

  if (atIndex === 0) {
    return {
      valid: false,
      normalizedEmail: trimmed,
      localPart: '',
      domain: trimmed.slice(1),
      reason: 'Local part cannot be empty',
    };
  }

  if (atIndex === trimmed.length - 1) {
    return {
      valid: false,
      normalizedEmail: trimmed,
      localPart: trimmed.slice(0, atIndex),
      domain: '',
      reason: 'Domain part cannot be empty',
    };
  }

  // Ensure there is only one @ symbol
  if (trimmed.indexOf('@') !== atIndex) {
    return {
      valid: false,
      normalizedEmail: trimmed,
      localPart: trimmed.slice(0, atIndex),
      domain: trimmed.slice(atIndex + 1),
      reason: 'Email contains multiple @ symbols',
    };
  }

  const localPart = trimmed.slice(0, atIndex);
  let domainPart = trimmed.slice(atIndex + 1);

  // Strip trailing dot if present on domain
  if (domainPart.endsWith('.')) {
    domainPart = domainPart.slice(0, -1);
  }
  domainPart = domainPart.toLowerCase();

  const normalized = `${localPart}@${domainPart}`;

  if (localPart.length > 64) {
    return {
      valid: false,
      normalizedEmail: normalized,
      localPart,
      domain: domainPart,
      reason: `Local part length (${localPart.length}) exceeds maximum 64 characters`,
    };
  }

  if (localPart.startsWith('.') || localPart.endsWith('.')) {
    return {
      valid: false,
      normalizedEmail: normalized,
      localPart,
      domain: domainPart,
      reason: 'Local part cannot start or end with a dot',
    };
  }

  if (localPart.includes('..')) {
    return {
      valid: false,
      normalizedEmail: normalized,
      localPart,
      domain: domainPart,
      reason: 'Local part contains consecutive dots',
    };
  }

  // Valid local characters: a-zA-Z0-9 and !#$%&'*+-/=?^_`{|}~.
  const localPartRegex = /^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~.-]+$/;
  if (!localPartRegex.test(localPart)) {
    return {
      valid: false,
      normalizedEmail: normalized,
      localPart,
      domain: domainPart,
      reason: 'Local part contains invalid characters',
    };
  }

  // Domain validation
  if (!domainPart || domainPart.length > 253) {
    return {
      valid: false,
      normalizedEmail: normalized,
      localPart,
      domain: domainPart,
      reason: 'Domain is empty or exceeds maximum 253 characters',
    };
  }

  const labels = domainPart.split('.');
  if (labels.length < 2) {
    return {
      valid: false,
      normalizedEmail: normalized,
      localPart,
      domain: domainPart,
      reason: 'Domain must contain at least one dot separating name and TLD',
    };
  }

  for (let i = 0; i < labels.length; i++) {
    const label = labels[i];
    if (label.length === 0) {
      return {
        valid: false,
        normalizedEmail: normalized,
        localPart,
        domain: domainPart,
        reason: 'Domain contains consecutive dots or empty segment',
      };
    }
    if (label.length > 63) {
      return {
        valid: false,
        normalizedEmail: normalized,
        localPart,
        domain: domainPart,
        reason: `Domain segment "${label}" exceeds maximum 63 characters`,
      };
    }
    if (label.startsWith('-') || label.endsWith('-')) {
      return {
        valid: false,
        normalizedEmail: normalized,
        localPart,
        domain: domainPart,
        reason: `Domain segment "${label}" cannot start or end with a hyphen`,
      };
    }
    // Alphanumeric + hyphen only
    if (!/^[a-zA-Z0-9-]+$/.test(label)) {
      return {
        valid: false,
        normalizedEmail: normalized,
        localPart,
        domain: domainPart,
        reason: `Domain segment "${label}" contains invalid characters`,
      };
    }
  }

  const tld = labels[labels.length - 1];
  // TLD must not be all-numeric and must be at least 2 chars
  if (/^[0-9]+$/.test(tld)) {
    return {
      valid: false,
      normalizedEmail: normalized,
      localPart,
      domain: domainPart,
      reason: `Top-level domain "${tld}" cannot be purely numeric`,
    };
  }

  if (tld.length < 2) {
    return {
      valid: false,
      normalizedEmail: normalized,
      localPart,
      domain: domainPart,
      reason: `Top-level domain "${tld}" is too short`,
    };
  }

  return {
    valid: true,
    normalizedEmail: normalized,
    localPart,
    domain: domainPart,
    reason: 'Passes practical syntax checks',
  };
}
