import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const DISPOSABLE_LIST: string[] = require('../data/disposable-domains.json');

const DISPOSABLE_SET: Set<string> = new Set(
  DISPOSABLE_LIST.map((d) => d.toLowerCase().trim())
);

export const FREE_PROVIDER_DOMAINS: ReadonlySet<string> = new Set([
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'yahoo.co.in',
  'yahoo.co.uk',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'msn.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'proton.me',
  'protonmail.com',
  'aol.com',
  'zoho.com',
  'mail.com',
  'gmx.com',
  'yandex.com',
  'rediffmail.com',
]);

/**
 * Checks if a domain is on the disposable starter list.
 */
export function isDisposableDomain(domain: string | null | undefined): boolean {
  if (!domain) return false;
  let clean = domain.toLowerCase().trim();
  if (clean.includes('@')) {
    clean = clean.slice(clean.lastIndexOf('@') + 1);
  }
  if (DISPOSABLE_SET.has(clean)) return true;

  // Check parent domains (e.g. sub.mailinator.com -> mailinator.com)
  const parts = clean.split('.');
  while (parts.length > 2) {
    parts.shift();
    if (DISPOSABLE_SET.has(parts.join('.'))) {
      return true;
    }
  }

  return false;
}

/**
 * Checks if a domain is a known major consumer free email provider.
 */
export function isFreeProvider(domain: string | null | undefined): boolean {
  if (!domain) return false;
  let clean = domain.toLowerCase().trim();
  if (clean.includes('@')) {
    clean = clean.slice(clean.lastIndexOf('@') + 1);
  }
  if (FREE_PROVIDER_DOMAINS.has(clean)) return true;

  const parts = clean.split('.');
  while (parts.length > 2) {
    parts.shift();
    if (FREE_PROVIDER_DOMAINS.has(parts.join('.'))) {
      return true;
    }
  }

  return false;
}
