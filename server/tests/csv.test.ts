import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeCsvCell, generateCsv, extractEmailsFromText } from '../../src/lib/csv.ts';
import { EmailResult } from '../../server/src/verification/types.ts';

test('CSV Security & Formatting', async (t) => {
  await t.test('neutralizes formula injection characters (=, +, -, @)', () => {
    assert.equal(sanitizeCsvCell('=1+1'), `"'=1+1"`);
    assert.equal(sanitizeCsvCell('+cmd|/c calc'), ` "'+cmd|/c calc"`.trim());
    assert.equal(sanitizeCsvCell('-5+2'), ` "'-5+2"`.trim());
    assert.equal(sanitizeCsvCell('@SUM(A1:A10)'), ` "'@SUM(A1:A10)"`.trim());
  });

  await t.test('properly escapes quotes and commas in CSV cells', () => {
    assert.equal(sanitizeCsvCell('Hello, World'), `"Hello, World"`);
    assert.equal(sanitizeCsvCell('Say "Hello"'), `"Say ""Hello"""`);
    assert.equal(sanitizeCsvCell('Line1\nLine2'), `"Line1\nLine2"`);
  });

  await t.test('generates valid full CSV table', () => {
    const mockResults: EmailResult[] = [
      {
        email: 'user@example.com',
        syntaxValid: true,
        domain: 'example.com',
        mxStatus: 'found',
        smtpStatus: 'accepted',
        classification: 'likely_deliverable',
        reason: 'Recipient accepted',
        checkedAt: '2026-10-25T12:00:00.000Z',
      },
    ];

    const csv = generateCsv(mockResults);
    assert.match(csv, /"Email","Classification"/);
    assert.match(csv, /"user@example.com"/);
    assert.match(csv, /"likely_deliverable"/);
  });

  await t.test('extracts email addresses from multi-line text and CSV lines', () => {
    const raw = `
      user1@domain.com
      "Name",user2@domain.org,"Other"
      invalid line without at
      user3@corp.net; user4@test.io
    `;
    const extracted = extractEmailsFromText(raw);
    assert.equal(extracted.length, 4);
    assert.ok(extracted.includes('user1@domain.com'));
    assert.ok(extracted.includes('user2@domain.org'));
    assert.ok(extracted.includes('user3@corp.net'));
    assert.ok(extracted.includes('user4@test.io'));
  });
});
