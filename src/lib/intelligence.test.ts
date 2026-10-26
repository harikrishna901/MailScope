import { describe, it, expect } from 'vitest';
import { detectMailProvider, isDisposableDomain, calculateListHealth } from './intelligence.ts';
import { EmailResult } from '../types.ts';

describe('Intelligence & Provider Detection', () => {
  it('detects Google Workspace MX records', () => {
    const res = detectMailProvider('aspmx.l.google.com priority 5', 'company.com');
    expect(res.type).toBe('google');
    expect(res.name).toBe('Google Workspace');
  });

  it('detects Microsoft 365 MX records', () => {
    const res = detectMailProvider('protection.outlook.com', 'microsoft.com');
    expect(res.type).toBe('microsoft');
    expect(res.name).toBe('Microsoft 365');
  });

  it('identifies disposable burner domains', () => {
    expect(isDisposableDomain('mailinator.com')).toBe(true);
    expect(isDisposableDomain('10minutemail.com')).toBe(true);
    expect(isDisposableDomain('stripe.com')).toBe(false);
  });

  it('calculates list health audit and grades accurately', () => {
    const mockList: EmailResult[] = [
      {
        email: 'good@company.com',
        syntaxValid: true,
        domain: 'company.com',
        mxStatus: 'found',
        smtpStatus: 'accepted',
        classification: 'likely_deliverable',
        reason: 'Passes practical syntax checks',
        checkedAt: '2026-10-26T00:00:00.000Z',
      },
      {
        email: 'bad..syntax@nowhere',
        syntaxValid: false,
        domain: 'nowhere',
        mxStatus: 'not_checked',
        smtpStatus: 'skipped',
        classification: 'likely_bounce',
        reason: 'Local part contains consecutive dots',
        checkedAt: '2026-10-26T00:00:00.000Z',
      },
    ];

    const audit = calculateListHealth(mockList);
    expect(audit.bounceCount).toBe(1);
    expect(audit.deliverableCount).toBe(1);
    expect(audit.score).toBeLessThan(100);
    expect(audit.recommendations.length).toBeGreaterThan(0);
  });
});
