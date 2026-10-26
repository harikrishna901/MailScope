import { describe, it, expect } from 'vitest';
import { generateCsv } from './csv.ts';
import { EmailResult } from '../types.ts';

describe('Frontend Features & Logic (Part D Vitest)', () => {
  describe('Typo Fix Replacement Logic', () => {
    it('correctly replaces misspelled email in input text without affecting other content', () => {
      const applyTypoFix = (input: string, oldEmail: string, newEmail: string) => {
        const regex = new RegExp(`(^|\\s|,|;)${oldEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|\\s|,|;)`, 'gi');
        return input.replace(regex, `$1${newEmail}$2`);
      };

      const originalText = 'alex.typo@gmial.com\nsarah@github.com\nother@domain.com';
      const fixed = applyTypoFix(originalText, 'alex.typo@gmial.com', 'alex.typo@gmail.com');
      expect(fixed).toBe('alex.typo@gmail.com\nsarah@github.com\nother@domain.com');

      // Does not replace partial substring match in different email
      const trickyText = 'alex.typo@gmial.com, notalex.typo@gmial.com';
      const fixedTricky = applyTypoFix(trickyText, 'alex.typo@gmial.com', 'alex.typo@gmail.com');
      expect(fixedTricky).toBe('alex.typo@gmail.com, notalex.typo@gmial.com');
    });
  });

  describe('Retry Unknown Merge Logic', () => {
    it('merges retried results back in place by email, preserving order and counting resolutions', () => {
      const initialResults: EmailResult[] = [
        {
          email: 'first@domain.com',
          syntaxValid: true,
          domain: 'domain.com',
          mxStatus: 'found',
          smtpStatus: 'accepted',
          classification: 'likely_deliverable',
          reason: 'Accepted',
          checkedAt: '2026-10-26T00:00:00Z',
        },
        {
          email: 'unknown1@retry.com',
          syntaxValid: true,
          domain: 'retry.com',
          mxStatus: 'found',
          smtpStatus: 'temporary_failure',
          classification: 'unknown',
          reason: 'Greylisted',
          checkedAt: '2026-10-26T00:00:00Z',
        },
        {
          email: 'unknown2@stillunknown.com',
          syntaxValid: true,
          domain: 'stillunknown.com',
          mxStatus: 'found',
          smtpStatus: 'temporary_failure',
          classification: 'unknown',
          reason: 'Timeout',
          checkedAt: '2026-10-26T00:00:00Z',
        },
        {
          email: 'last@domain.com',
          syntaxValid: true,
          domain: 'domain.com',
          mxStatus: 'none',
          smtpStatus: 'skipped',
          classification: 'likely_bounce',
          reason: 'No MX',
          checkedAt: '2026-10-26T00:00:00Z',
        },
      ];

      const retriedResults: EmailResult[] = [
        {
          email: 'unknown1@retry.com',
          syntaxValid: true,
          domain: 'retry.com',
          mxStatus: 'found',
          smtpStatus: 'accepted',
          classification: 'likely_deliverable',
          reason: 'Accepted on retry',
          checkedAt: '2026-10-26T00:05:00Z',
        },
        {
          email: 'unknown2@stillunknown.com',
          syntaxValid: true,
          domain: 'stillunknown.com',
          mxStatus: 'found',
          smtpStatus: 'temporary_failure',
          classification: 'unknown',
          reason: 'Still timed out',
          checkedAt: '2026-10-26T00:05:00Z',
        },
      ];

      const newMap = new Map(retriedResults.map((r) => [r.email.toLowerCase(), r]));
      let resolvedCount = 0;

      const merged = initialResults.map((original) => {
        const lower = original.email.toLowerCase();
        if (newMap.has(lower)) {
          const updated = newMap.get(lower)!;
          if (original.classification === 'unknown' && updated.classification !== 'unknown') {
            resolvedCount++;
          }
          return updated;
        }
        return original;
      });

      expect(resolvedCount).toBe(1);
      expect(merged.length).toBe(4);
      expect(merged[0].email).toBe('first@domain.com');
      expect(merged[1].classification).toBe('likely_deliverable');
      expect(merged[1].reason).toBe('Accepted on retry');
      expect(merged[2].classification).toBe('unknown');
      expect(merged[3].email).toBe('last@domain.com');
    });
  });

  describe('CSV Export With Phase 2 Columns', () => {
    it('includes Typo Suggestion, Role, Disposable, Free Provider, SPF, and DMARC columns', () => {
      const records: EmailResult[] = [
        {
          email: 'admin@gmial.com',
          syntaxValid: true,
          domain: 'gmial.com',
          mxStatus: 'found',
          smtpStatus: 'skipped',
          classification: 'unknown',
          reason: 'Skipped SMTP',
          checkedAt: '2026-10-26T00:00:00Z',
          suggestion: { corrected: 'admin@gmail.com', reason: 'Likely typo for gmail.com' },
          isRoleAddress: true,
          isDisposableDomain: false,
          isFreeProvider: true,
          domainAuth: {
            spf: 'present',
            dmarc: 'reject',
          },
        },
        {
          email: '=1+cmd|/c calc@evil.org',
          syntaxValid: true,
          domain: 'evil.org',
          mxStatus: 'none',
          smtpStatus: 'skipped',
          classification: 'likely_bounce',
          reason: 'Formula exploit test',
          checkedAt: '2026-10-26T00:00:00Z',
        },
      ];

      const csv = generateCsv(records);
      const headerLine = csv.split('\n')[0];

      expect(headerLine).toContain('"Typo Suggestion"');
      expect(headerLine).toContain('"Role Address"');
      expect(headerLine).toContain('"Disposable Domain"');
      expect(headerLine).toContain('"Free Provider"');
      expect(headerLine).toContain('"SPF"');
      expect(headerLine).toContain('"DMARC"');

      // Check first record data
      expect(csv).toContain('"admin@gmail.com"');
      expect(csv).toContain('"Yes"'); // Role Address
      expect(csv).toContain('"present"');
      expect(csv).toContain('"reject"');

      // Check formula injection neutralization on evil cell
      expect(csv).toContain(`"'=1+cmd|/c calc@evil.org"`);
    });
  });
});
