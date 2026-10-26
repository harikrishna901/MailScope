import test from 'node:test';
import assert from 'node:assert/strict';
import { lookupDomainAuth, TxtResolver } from '../src/verification/domainAuth.ts';

test('Domain Email-Authentication (SPF & DMARC Resolution)', async (t) => {
  await t.test('detects valid SPF present and DMARC reject policy', async () => {
    const mockResolver: TxtResolver = async (hostname: string) => {
      if (hostname === 'company.com') {
        return [['v=spf1 include:_spf.google.com ~all']];
      }
      if (hostname === '_dmarc.company.com') {
        return [['v=DMARC1; p=reject; rua=mailto:dmarc@company.com']];
      }
      const err: any = new Error('Not found');
      err.code = 'ENODATA';
      throw err;
    };

    const auth = await lookupDomainAuth('company.com', { resolver: mockResolver });
    assert.equal(auth.spf, 'present');
    assert.equal(auth.dmarc, 'reject');
  });

  await t.test('detects DMARC quarantine policy and DMARC none policy', async () => {
    const mockResolver: TxtResolver = async (hostname: string) => {
      if (hostname === 'quarantine-test.org') {
        return [['v=spf1 ip4:192.0.2.1 -all']];
      }
      if (hostname === '_dmarc.quarantine-test.org') {
        return [['v=DMARC1; p=quarantine; sp=quarantine']];
      }
      if (hostname === 'monitor-test.net') {
        return [['v=spf1 a mx ~all']];
      }
      if (hostname === '_dmarc.monitor-test.net') {
        return [['v=DMARC1; p=none']];
      }
      throw new Error('ENOTFOUND');
    };

    const resQuarantine = await lookupDomainAuth('quarantine-test.org', { resolver: mockResolver });
    assert.equal(resQuarantine.spf, 'present');
    assert.equal(resQuarantine.dmarc, 'quarantine');

    const resNone = await lookupDomainAuth('monitor-test.net', { resolver: mockResolver });
    assert.equal(resNone.spf, 'present');
    assert.equal(resNone.dmarc, 'none');
  });

  await t.test('identifies absent SPF and absent DMARC when no records exist', async () => {
    const mockResolver: TxtResolver = async (_hostname: string) => {
      const err: any = new Error('No TXT records');
      err.code = 'ENODATA';
      throw err;
    };

    const auth = await lookupDomainAuth('no-auth.com', { resolver: mockResolver });
    assert.equal(auth.spf, 'absent');
    assert.equal(auth.dmarc, 'absent');
  });

  await t.test('handles other TXT records without misidentifying SPF', async () => {
    const mockResolver: TxtResolver = async (hostname: string) => {
      if (hostname === 'other-txt.com') {
        return [['google-site-verification=abc123xyz'], ['stripe-verification=987654']];
      }
      const err: any = new Error('ENOTFOUND');
      err.code = 'ENOTFOUND';
      throw err;
    };

    const auth = await lookupDomainAuth('other-txt.com', { resolver: mockResolver });
    assert.equal(auth.spf, 'absent');
    assert.equal(auth.dmarc, 'absent');
  });

  await t.test('maps resolver timeouts or SERVFAIL to lookup_failed', async () => {
    const mockResolver: TxtResolver = async () => {
      const err: any = new Error('SERVFAIL');
      err.code = 'ESERVFAIL';
      throw err;
    };

    const auth = await lookupDomainAuth('broken-dns.invalid', { resolver: mockResolver });
    assert.equal(auth.spf, 'lookup_failed');
    assert.equal(auth.dmarc, 'lookup_failed');
  });
});
