import test from 'node:test';
import assert from 'node:assert/strict';
import { validateEmailSyntax, normalizeAndDeduplicate } from '../src/verification/syntax.ts';
import { isNullMx } from '../src/verification/dns.ts';
import { mapSmtpResponse, isPolicyBlocked } from '../src/verification/smtp.ts';
import { classifyResult } from '../src/verification/classify.ts';
import { VerificationService } from '../src/verification/service.ts';
import { MxLookupResult, SmtpProbeResult } from '../src/verification/types.ts';

test('Email Syntax & Normalization', async (t) => {
  await t.test('accepts standard valid email addresses', () => {
    const valid = [
      'user@example.com',
      'first.last@sub.domain.co.uk',
      'user+tag@domain.org',
      'dev.ops-test@corp.net',
    ];
    for (const em of valid) {
      const res = validateEmailSyntax(em);
      assert.equal(res.valid, true, `Expected ${em} to be valid`);
      assert.ok(res.domain.length > 0);
    }
  });

  await t.test('rejects malformed syntax with specific descriptive reasons', () => {
    assert.equal(validateEmailSyntax('').valid, false);
    assert.equal(validateEmailSyntax('notanemail').valid, false);
    assert.equal(validateEmailSyntax('@domain.com').valid, false);
    assert.equal(validateEmailSyntax('user@').valid, false);
    assert.equal(validateEmailSyntax('user@@domain.com').valid, false);
    assert.equal(validateEmailSyntax('.user@domain.com').valid, false);
    assert.equal(validateEmailSyntax('user.@domain.com').valid, false);
    assert.equal(validateEmailSyntax('user..name@domain.com').valid, false);
    assert.equal(validateEmailSyntax('user@domain..com').valid, false);
    assert.equal(validateEmailSyntax('user@-domain.com').valid, false);
    assert.equal(validateEmailSyntax('user@domain.123').valid, false); // numeric TLD
    assert.equal(validateEmailSyntax('user@nodotdomain').valid, false);

    // Length limit checks
    const longLocal = 'a'.repeat(65) + '@example.com';
    assert.equal(validateEmailSyntax(longLocal).valid, false);
    assert.match(validateEmailSyntax(longLocal).reason, /exceeds maximum 64 characters/);

    const longTotal = 'a'.repeat(60) + '@' + 'b'.repeat(190) + '.com';
    assert.equal(validateEmailSyntax(longTotal).valid, false);
    assert.match(validateEmailSyntax(longTotal).reason, /exceeds the maximum 254 characters/);
  });

  await t.test('deduplicates case-insensitively and preserves first spelling', () => {
    const input = [
      'Alice@Example.com',
      'bob@example.com',
      'ALICE@example.COM',
      '  ',
      'charlie@domain.org',
      'BOB@EXAMPLE.COM',
    ];
    const { uniqueEmails, duplicatesRemoved } = normalizeAndDeduplicate(input);
    assert.equal(uniqueEmails.length, 3);
    assert.equal(uniqueEmails[0], 'Alice@Example.com');
    assert.equal(uniqueEmails[1], 'bob@example.com');
    assert.equal(uniqueEmails[2], 'charlie@domain.org');
    assert.equal(duplicatesRemoved, 2);
  });
});

test('DNS / MX Logic', async (t) => {
  await t.test('detects RFC 7505 Null MX', () => {
    assert.equal(isNullMx([{ exchange: '.', priority: 0 }]), true);
    assert.equal(isNullMx([{ exchange: '', priority: 0 }]), true);
    assert.equal(isNullMx([{ exchange: 'mail.example.com', priority: 10 }]), false);
    assert.equal(
      isNullMx([
        { exchange: '.', priority: 0 },
        { exchange: 'backup.example.com', priority: 20 },
      ]),
      false
    );
  });
});

test('SMTP Response Parsing', async (t) => {
  await t.test('maps 2xx codes to accepted', () => {
    const res = mapSmtpResponse(250, '2.1.5 Recipient OK');
    assert.equal(res.status, 'accepted');
  });

  await t.test('maps 4xx codes to temporary_failure', () => {
    const res = mapSmtpResponse(451, '4.3.0 Try again later');
    assert.equal(res.status, 'temporary_failure');
  });

  await t.test('maps 550 permanent recipient rejection', () => {
    const res = mapSmtpResponse(550, '5.1.1 User unknown');
    assert.equal(res.status, 'rejected_permanent');
  });

  await t.test('identifies policy blocks and reputation rejections', () => {
    assert.equal(isPolicyBlocked(554, '5.7.1 Service unavailable; Client host blocked using Spamhaus'), true);
    assert.equal(isPolicyBlocked(550, 'Blocked by SPF/DKIM policy'), true);
    assert.equal(isPolicyBlocked(550, '5.1.1 Recipient mailbox does not exist'), false);

    const mapped = mapSmtpResponse(554, '5.7.1 Blocked by blacklist');
    assert.equal(mapped.status, 'policy_blocked');
  });
});

test('7-Rule Deliverability Classification Table', async (_t) => {
  // Rule 1: Syntax invalid -> likely_bounce
  assert.equal(classifyResult(false, 'found', 'accepted').classification, 'likely_bounce');
  assert.equal(classifyResult(false, 'none', 'skipped').classification, 'likely_bounce');

  // Rule 2: MX none -> likely_bounce
  assert.equal(classifyResult(true, 'none', 'skipped').classification, 'likely_bounce');

  // Rule 3: MX lookup_failed or not_checked -> unknown
  assert.equal(classifyResult(true, 'lookup_failed', 'skipped').classification, 'unknown');
  assert.equal(classifyResult(true, 'not_checked', 'skipped').classification, 'unknown');

  // Rule 4: SMTP rejected_permanent -> likely_bounce
  assert.equal(classifyResult(true, 'found', 'rejected_permanent').classification, 'likely_bounce');

  // Rule 5: SMTP catch_all -> unknown
  assert.equal(classifyResult(true, 'found', 'catch_all').classification, 'unknown');

  // Rule 6: SMTP accepted -> likely_deliverable
  assert.equal(classifyResult(true, 'found', 'accepted').classification, 'likely_deliverable');
  assert.equal(classifyResult(true, 'implicit_a', 'accepted').classification, 'likely_deliverable');

  // Rule 7: Everything else -> unknown (Crucial: skipped SMTP does NOT equal deliverable!)
  assert.equal(classifyResult(true, 'found', 'skipped').classification, 'unknown');
  assert.equal(classifyResult(true, 'found', 'temporary_failure').classification, 'unknown');
  assert.equal(classifyResult(true, 'found', 'policy_blocked').classification, 'unknown');
  assert.equal(classifyResult(true, 'found', 'unreachable').classification, 'unknown');
});

test('VerificationService End-to-End Orchestration (Mocked)', async (_t) => {
  const mockMx: Record<string, MxLookupResult> = {
    'good.com': { status: 'found', hosts: ['mx.good.com'], reason: 'Found MX' },
    'fallback.com': { status: 'implicit_a', hosts: ['fallback.com'], reason: 'Implicit A' },
    'nomail.com': { status: 'none', hosts: [], reason: 'RFC 7505 Null MX' },
    'dnserror.com': { status: 'lookup_failed', hosts: [], reason: 'DNS timeout' },
    'catchall.com': { status: 'found', hosts: ['mx.catchall.com'], reason: 'Found MX' },
  };

  const mockSmtp = async (email: string, _host: string): Promise<SmtpProbeResult> => {
    if (email.includes('baduser')) {
      return { status: 'rejected_permanent', code: 550, reason: 'User unknown' };
    }
    if (email.includes('catchall')) {
      // In catchall domain, even random probes return accepted
      return { status: 'accepted', code: 250, reason: 'Accepted' };
    }
    if (email.includes('mailscope_probe_') || email.includes('mailcheck_probe_')) {
      // Regular domain rejects non-existent probe mailbox
      return { status: 'rejected_permanent', code: 550, reason: '5.1.1 No such mailbox' };
    }
    if (email.includes('greylist')) {
      return { status: 'temporary_failure', code: 451, reason: 'Greylisted' };
    }
    if (email.includes('policy')) {
      return { status: 'policy_blocked', code: 554, reason: '5.7.1 Denied' };
    }
    return { status: 'accepted', code: 250, reason: '2.1.5 OK' };
  };

  const service = new VerificationService({
    lookupMx: async (domain: string) => mockMx[domain] || { status: 'none', hosts: [], reason: 'No domain' },
    probeRcpt: mockSmtp,
    config: { smtpEnabled: true },
  });

  const batch = await service.verifyBatch([
    'invalid-syntax-at-nowhere',
    'admin@nomail.com',
    'lead@dnserror.com',
    'baduser@good.com',
    'valid@good.com',
    'greylist@good.com',
    'policy@good.com',
    'user@catchall.com',
  ]);

  assert.equal(batch.results.length, 8);

  const resultsMap = new Map(batch.results.map((r) => [r.email, r]));

  // Invalid syntax -> likely_bounce
  assert.equal(resultsMap.get('invalid-syntax-at-nowhere')?.classification, 'likely_bounce');

  // Null MX -> likely_bounce
  assert.equal(resultsMap.get('admin@nomail.com')?.classification, 'likely_bounce');

  // DNS error -> unknown (not bounce!)
  assert.equal(resultsMap.get('lead@dnserror.com')?.classification, 'unknown');

  // Bad user permanently rejected -> likely_bounce
  assert.equal(resultsMap.get('baduser@good.com')?.classification, 'likely_bounce');

  // Valid user accepted on good domain -> likely_deliverable
  assert.equal(resultsMap.get('valid@good.com')?.classification, 'likely_deliverable');

  // Greylisted -> unknown
  assert.equal(resultsMap.get('greylist@good.com')?.classification, 'unknown');

  // Policy blocked -> unknown
  assert.equal(resultsMap.get('policy@good.com')?.classification, 'unknown');

  // Catch-all domain -> unknown
  assert.equal(resultsMap.get('user@catchall.com')?.classification, 'unknown');
  assert.equal(resultsMap.get('user@catchall.com')?.smtpStatus, 'catch_all');
});

test('VerificationService handles unexpected SMTP errors without failing the batch', async () => {
  const service = new VerificationService({
    lookupMx: async (): Promise<MxLookupResult> => ({
      status: 'found',
      hosts: ['mx.good.com'],
      reason: 'Found MX',
    }),
    
probeRcpt: async (email: string): Promise<SmtpProbeResult> => {
  if (email.startsWith('error@')) {
    throw new Error('Simulated SMTP connection failure');
  }

  // Simulate rejection of the random catch-all detection address.
  if (email.startsWith('mailscope_probe_')) {
    return {
      status: 'rejected_permanent',
      code: 550,
      reason: '5.1.1 No such mailbox',
    };
  }

  return {
    status: 'accepted',
    code: 250,
    reason: 'Recipient accepted',
  };
},
    config: { smtpEnabled: true },
  });

  const batch = await service.verifyBatch([
    'error@good.com',
    'valid@good.com',
  ]);

  assert.equal(batch.results.length, 2);

  const results = new Map(
    batch.results.map((result) => [result.email, result])
  );

  assert.equal(
    results.get('error@good.com')?.classification,
    'unknown'
  );

  assert.equal(
    results.get('valid@good.com')?.classification,
    'likely_deliverable'
  );
});

test('VerificationService handles catch-all SMTP probe errors without failing the batch', async () => {
  const service = new VerificationService({
    lookupMx: async (): Promise<MxLookupResult> => ({
      status: 'found',
      hosts: ['mx.good.com'],
      reason: 'Found MX',
    }),
    probeRcpt: async (email: string): Promise<SmtpProbeResult> => {
      if (email.startsWith('mailscope_probe_')) {
        throw new Error('Simulated catch-all SMTP failure');
      }

      return {
        status: 'accepted',
        code: 250,
        reason: 'Recipient accepted',
      };
    },
    config: { smtpEnabled: true },
  });

  const batch = await service.verifyBatch([
    'valid@good.com',
  ]);

  assert.equal(batch.results.length, 1);
  assert.equal(batch.results[0].email, 'valid@good.com');
  assert.equal(batch.results[0].classification, 'unknown');
});
