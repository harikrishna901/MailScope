import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateSuccessRate,
  getHealthRating,
  computeStatsFromResults,
  recordBatchVerification,
  recordSingleVerification,
  getInitialSessionStats,
  resetSessionStats,
} from './sessionStats.ts';
import { EmailResult } from '../types.ts';

describe('Session Stats & Success Rate Calculation', () => {
  beforeEach(() => {
    // Mock sessionStorage
    const storage: Record<string, string> = {};
    globalThis.sessionStorage = {
      getItem: (key: string) => storage[key] || null,
      setItem: (key: string, val: string) => {
        storage[key] = val;
      },
      removeItem: (key: string) => {
        delete storage[key];
      },
      clear: () => {
        for (const k in storage) delete storage[k];
      },
      length: 0,
      key: () => null,
    };
  });

  describe('calculateSuccessRate', () => {
    it('returns 0 when totalProcessed is 0 or negative', () => {
      expect(calculateSuccessRate(0, 0)).toBe(0);
      expect(calculateSuccessRate(5, 0)).toBe(0);
      expect(calculateSuccessRate(0, -5)).toBe(0);
    });

    it('returns 100 when all addresses are deliverable', () => {
      expect(calculateSuccessRate(50, 50)).toBe(100);
      expect(calculateSuccessRate(1, 1)).toBe(100);
    });

    it('returns 0 when no addresses are deliverable', () => {
      expect(calculateSuccessRate(0, 20)).toBe(0);
    });

    it('rounds to 1 decimal place accurately', () => {
      // 1 / 3 = 33.3333... -> 33.3
      expect(calculateSuccessRate(1, 3)).toBe(33.3);
      // 2 / 3 = 66.6666... -> 66.7
      expect(calculateSuccessRate(2, 3)).toBe(66.7);
      // 7 / 11 = 63.6363... -> 63.6
      expect(calculateSuccessRate(7, 11)).toBe(63.6);
      // 85 / 100 = 85
      expect(calculateSuccessRate(85, 100)).toBe(85);
    });
  });

  describe('getHealthRating', () => {
    it('returns Session Idle when totalProcessed is 0', () => {
      const rating = getHealthRating(0, 0);
      expect(rating.tone).toBe('slate');
      expect(rating.label).toBe('Session Idle');
    });

    it('returns Optimal Deliverability for >= 90%', () => {
      const rating = getHealthRating(92.5, 10);
      expect(rating.tone).toBe('emerald');
      expect(rating.label).toBe('Optimal Deliverability');
    });

    it('returns Moderate Quality for 75% to 89.9%', () => {
      const rating = getHealthRating(78.2, 50);
      expect(rating.tone).toBe('amber');
      expect(rating.label).toBe('Moderate Quality');
    });

    it('returns High Bounce Risk for < 75%', () => {
      const rating = getHealthRating(65.0, 40);
      expect(rating.tone).toBe('rose');
      expect(rating.label).toBe('High Bounce Risk');
    });
  });

  describe('computeStatsFromResults', () => {
    const mockResults: EmailResult[] = [
      {
        email: 'ok1@example.com',
        classification: 'likely_deliverable',
        domain: 'example.com',
        syntaxValid: true,
        reason: 'Accepted',
        mxStatus: 'found',
        smtpStatus: 'accepted',
        checkedAt: new Date().toISOString(),
      },
      {
        email: 'ok2@example.com',
        classification: 'likely_deliverable',
        domain: 'example.com',
        syntaxValid: true,
        reason: 'Accepted',
        mxStatus: 'found',
        smtpStatus: 'accepted',
        checkedAt: new Date().toISOString(),
      },
      {
        email: 'bounce@bad.invalid',
        classification: 'likely_bounce',
        domain: 'bad.invalid',
        syntaxValid: true,
        reason: 'No MX',
        mxStatus: 'none',
        smtpStatus: 'skipped',
        checkedAt: new Date().toISOString(),
      },
      {
        email: 'unknown@catchall.com',
        classification: 'unknown',
        domain: 'catchall.com',
        syntaxValid: true,
        reason: 'Catch-all',
        mxStatus: 'found',
        smtpStatus: 'catch_all',
        checkedAt: new Date().toISOString(),
      },
    ];

    it('derives accurate counts and success rate from results list', () => {
      const stats = computeStatsFromResults(mockResults);
      expect(stats.totalProcessed).toBe(4);
      expect(stats.deliverableCount).toBe(2);
      expect(stats.bounceCount).toBe(1);
      expect(stats.unknownCount).toBe(1);
      // 2 / 4 = 50.0%
      expect(stats.successRate).toBe(50);
      expect(stats.batchesCount).toBe(1);
    });

    it('handles empty results gracefully', () => {
      const stats = computeStatsFromResults([]);
      expect(stats.totalProcessed).toBe(0);
      expect(stats.deliverableCount).toBe(0);
      expect(stats.successRate).toBe(0);
      expect(stats.batchesCount).toBe(0);
    });
  });

  describe('recordBatchVerification & recordSingleVerification', () => {
    it('accumulates multiple batches across the session', () => {
      let session = getInitialSessionStats();
      expect(session.totalProcessed).toBe(0);

      const batch1: EmailResult[] = [
        { email: 'a@test.com', classification: 'likely_deliverable', domain: 'test.com', syntaxValid: true, reason: 'OK', mxStatus: 'found', smtpStatus: 'accepted', checkedAt: new Date().toISOString() },
        { email: 'b@test.com', classification: 'likely_deliverable', domain: 'test.com', syntaxValid: true, reason: 'OK', mxStatus: 'found', smtpStatus: 'accepted', checkedAt: new Date().toISOString() },
        { email: 'c@test.com', classification: 'likely_bounce', domain: 'test.com', syntaxValid: true, reason: 'Bounce', mxStatus: 'none', smtpStatus: 'skipped', checkedAt: new Date().toISOString() },
      ];

      session = recordBatchVerification(session, batch1);
      expect(session.totalProcessed).toBe(3);
      expect(session.deliverableCount).toBe(2);
      expect(session.bounceCount).toBe(1);
      expect(session.successRate).toBe(66.7);
      expect(session.batchesCount).toBe(1);

      // Add a single check
      const single: EmailResult = {
        email: 'd@test.com',
        classification: 'likely_deliverable',
        domain: 'test.com',
        syntaxValid: true,
        reason: 'OK',
        mxStatus: 'found',
        smtpStatus: 'accepted',
        checkedAt: new Date().toISOString(),
      };

      session = recordSingleVerification(session, single);
      expect(session.totalProcessed).toBe(4);
      expect(session.deliverableCount).toBe(3);
      // 3 / 4 = 75.0%
      expect(session.successRate).toBe(75);

      // Reset
      session = resetSessionStats();
      expect(session.totalProcessed).toBe(0);
      expect(session.successRate).toBe(0);
    });
  });
});
