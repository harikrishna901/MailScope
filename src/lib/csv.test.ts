import { describe, it, expect } from 'vitest';
import { sanitizeCsvCell, generateCsv, extractEmailsFromText } from './csv.ts';
import { EmailResult } from '../types.ts';

describe('CSV Security & Sanitization', () => {
  it('neutralizes formula injection characters (=, +, -, @, tab, cr)', () => {
    expect(sanitizeCsvCell('=1+1')).toBe(`"'=1+1"`);
    expect(sanitizeCsvCell('+cmd|/c calc')).toBe(`"'+cmd|/c calc"`);
    expect(sanitizeCsvCell('-5+2')).toBe(`"'-5+2"`);
    expect(sanitizeCsvCell('@SUM(A1:A10)')).toBe(`"'@SUM(A1:A10)"`);
  });

  it('escapes quotes and handles commas', () => {
    expect(sanitizeCsvCell('Hello, World')).toBe('"Hello, World"');
    expect(sanitizeCsvCell('Say "Hello"')).toBe('"Say ""Hello"""');
  });

  it('generates compliant CSV table with confidence scores and provider intelligence', () => {
    const mockResults: EmailResult[] = [
      {
        email: 'user@example.com',
        syntaxValid: true,
        domain: 'example.com',
        mxStatus: 'found',
        smtpStatus: 'accepted',
        classification: 'likely_deliverable',
        reason: 'Passes practical syntax checks',
        checkedAt: '2026-10-26T00:00:00.000Z',
      },
    ];
    const csv = generateCsv(mockResults);
    expect(csv).toContain('"Email","Classification","Confidence Score","Provider"');
    expect(csv).toContain('"user@example.com"');
    expect(csv).toContain('"likely_deliverable"');
    expect(csv).toContain('"98%"');
  });

  it('extracts emails from raw text lines and csv parts', () => {
    const text = 'test@example.com\n"First","Last",contact@company.org\nskip line';
    const extracted = extractEmailsFromText(text);
    expect(extracted).toEqual(['test@example.com', 'contact@company.org']);
  });
});
