import test from 'node:test';
import assert from 'node:assert/strict';
import { suggestDomainTypo, damerauLevenshteinDistance } from '../src/verification/typo.ts';

test('Typo Detection & Damerau-Levenshtein Metric', async (t) => {
  await t.test('calculates correct Damerau-Levenshtein distances including transpositions', () => {
    assert.equal(damerauLevenshteinDistance('gmail.com', 'gmial.com'), 1); // adjacent transposition
    assert.equal(damerauLevenshteinDistance('gmail.com', 'gmai.com'), 1); // deletion
    assert.equal(damerauLevenshteinDistance('gmail.com', 'gmails.com'), 1); // insertion
    assert.equal(damerauLevenshteinDistance('yahoo.com', 'yaho.com'), 1); // deletion
    assert.equal(damerauLevenshteinDistance('hotmail.com', 'hotmial.com'), 1); // transposition
    assert.equal(damerauLevenshteinDistance('gmail.com', 'gmail.com'), 0); // identical
  });

  await t.test('detects standard popular provider typos', () => {
    assert.deepEqual(suggestDomainTypo('gmial.com'), {
      corrected: 'gmail.com',
      reason: 'Likely typo for gmail.com',
    });

    assert.deepEqual(suggestDomainTypo('gmai.com'), {
      corrected: 'gmail.com',
      reason: 'Likely typo for gmail.com',
    });

    assert.deepEqual(suggestDomainTypo('yaho.com'), {
      corrected: 'yahoo.com',
      reason: 'Likely typo for yahoo.com',
    });

    assert.deepEqual(suggestDomainTypo('hotmial.com'), {
      corrected: 'hotmail.com',
      reason: 'Likely typo for hotmail.com',
    });
  });

  await t.test('detects common TLD typos (.con, .cmo, etc.)', () => {
    assert.deepEqual(suggestDomainTypo('example.con'), {
      corrected: 'example.com',
      reason: 'Likely typo for .com',
    });

    assert.deepEqual(suggestDomainTypo('company.cmo'), {
      corrected: 'company.com',
      reason: 'Likely typo for .com',
    });

    assert.deepEqual(suggestDomainTypo('orgsite.og'), {
      corrected: 'orgsite.org',
      reason: 'Likely typo for .org',
    });
  });

  await t.test('returns undefined for correct domains and unrelated domains', () => {
    // Already correct domains
    assert.equal(suggestDomainTypo('gmail.com'), undefined);
    assert.equal(suggestDomainTypo('yahoo.com'), undefined);
    assert.equal(suggestDomainTypo('example.com'), undefined);
    assert.equal(suggestDomainTypo('stripe.com'), undefined);

    // Completely unrelated / unusual domains
    assert.equal(suggestDomainTypo('very-unusual-domain-12345.org'), undefined);
    assert.equal(suggestDomainTypo('xyz-random-domain-77.net'), undefined);
  });

  await t.test('strictly respects length-dependent distance thresholds (1 for <=10 chars, 2 for >10 chars)', () => {
    // 'yahoo.com' is 9 characters <= 10. Distance must be <= 1.
    // 'yahaa.com' has 2 substitutions from 'yahoo.com' -> distance 2 -> must return undefined.
    assert.equal(suggestDomainTypo('yahaa.com'), undefined);

    // 'protonmail.com' is 14 characters > 10. Distance allows up to 2.
    // 'protonmial.con' has transposition (1) + tld typo (.con -> .com)
    assert.ok(suggestDomainTypo('protonmial.com'));
  });
});
