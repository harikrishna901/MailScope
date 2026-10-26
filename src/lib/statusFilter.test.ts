import { describe, it, expect } from 'vitest';
import {
  calculateStatusCounts,
  filterResultsByStatus,
  getStatusFilterDisplayName,
  isValidStatusFilter,
} from './statusFilter.ts';
import { EmailResult } from '../types.ts';

const sampleResults: EmailResult[] = [
  {
    email: 'valid1@stripe.com',
    classification: 'likely_deliverable',
    domain: 'stripe.com',
    syntaxValid: true,
    reason: 'Accepted by MX server',
    mxStatus: 'found',
    smtpStatus: 'accepted',
    checkedAt: '2026-10-26T00:00:00Z',
  },
  {
    email: 'valid2@github.com',
    classification: 'likely_deliverable',
    domain: 'github.com',
    syntaxValid: true,
    reason: 'Accepted by MX server',
    mxStatus: 'found',
    smtpStatus: 'accepted',
    checkedAt: '2026-10-26T00:00:00Z',
  },
  {
    email: 'bad1@nonexistent.invalid',
    classification: 'likely_bounce',
    domain: 'nonexistent.invalid',
    syntaxValid: true,
    reason: 'Domain has no DNS MX records',
    mxStatus: 'none',
    smtpStatus: 'skipped',
    checkedAt: '2026-10-26T00:00:00Z',
  },
  {
    email: 'bad2@rejected.com',
    classification: 'likely_bounce',
    domain: 'rejected.com',
    syntaxValid: true,
    reason: 'Mailbox not found (550)',
    mxStatus: 'found',
    smtpStatus: 'rejected_permanent',
    checkedAt: '2026-10-26T00:00:00Z',
  },
  {
    email: 'catchall@corporate.com',
    classification: 'unknown',
    domain: 'corporate.com',
    syntaxValid: true,
    reason: 'Catch-all domain configuration',
    mxStatus: 'found',
    smtpStatus: 'accepted',
    checkedAt: '2026-10-26T00:00:00Z',
  },
];

describe('Status Filtering Logic', () => {
  describe('calculateStatusCounts', () => {
    it('accurately counts each classification status', () => {
      const counts = calculateStatusCounts(sampleResults);
      expect(counts.all).toBe(5);
      expect(counts.deliverable).toBe(2);
      expect(counts.bounce).toBe(2);
      expect(counts.unknown).toBe(1);
    });

    it('returns zero for empty array', () => {
      const counts = calculateStatusCounts([]);
      expect(counts.all).toBe(0);
      expect(counts.deliverable).toBe(0);
      expect(counts.bounce).toBe(0);
      expect(counts.unknown).toBe(0);
    });
  });

  describe('filterResultsByStatus', () => {
    it('returns all results when filter is "all" or empty', () => {
      expect(filterResultsByStatus(sampleResults, 'all')).toHaveLength(5);
      expect(filterResultsByStatus(sampleResults, '')).toHaveLength(5);
    });

    it('filters strictly by deliverable status', () => {
      const filtered = filterResultsByStatus(sampleResults, 'likely_deliverable');
      expect(filtered).toHaveLength(2);
      expect(filtered.every((r) => r.classification === 'likely_deliverable')).toBe(true);
      expect(filtered.map((r) => r.email)).toEqual(['valid1@stripe.com', 'valid2@github.com']);
    });

    it('filters strictly by bounce status', () => {
      const filtered = filterResultsByStatus(sampleResults, 'likely_bounce');
      expect(filtered).toHaveLength(2);
      expect(filtered.every((r) => r.classification === 'likely_bounce')).toBe(true);
      expect(filtered.map((r) => r.email)).toEqual(['bad1@nonexistent.invalid', 'bad2@rejected.com']);
    });

    it('filters strictly by unknown status', () => {
      const filtered = filterResultsByStatus(sampleResults, 'unknown');
      expect(filtered).toHaveLength(1);
      expect(filtered[0].email).toBe('catchall@corporate.com');
      expect(filtered[0].classification).toBe('unknown');
    });

    it('returns empty array if no results match status', () => {
      const onlyDeliverable = sampleResults.filter((r) => r.classification === 'likely_deliverable');
      const filtered = filterResultsByStatus(onlyDeliverable, 'likely_bounce');
      expect(filtered).toHaveLength(0);
    });
  });

  describe('getStatusFilterDisplayName', () => {
    it('maps classifications to user-friendly titles', () => {
      expect(getStatusFilterDisplayName('likely_deliverable')).toBe('Deliverable');
      expect(getStatusFilterDisplayName('likely_bounce')).toBe('Bounce');
      expect(getStatusFilterDisplayName('unknown')).toBe('Unknown');
      expect(getStatusFilterDisplayName('all')).toBe('All Statuses');
    });
  });

  describe('isValidStatusFilter', () => {
    it('validates supported filter values', () => {
      expect(isValidStatusFilter('all')).toBe(true);
      expect(isValidStatusFilter('likely_deliverable')).toBe(true);
      expect(isValidStatusFilter('likely_bounce')).toBe(true);
      expect(isValidStatusFilter('unknown')).toBe(true);
      expect(isValidStatusFilter('invalid_status')).toBe(false);
    });
  });
});
