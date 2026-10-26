import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createApp } from '../src/app.ts';
import { MxLookupResult, SmtpProbeResult } from '../src/verification/types.ts';

// Helper to start ephemeral test server
function startTestServer(app: any): Promise<{ url: string; close: () => Promise<void> }> {
  return new Promise((resolve) => {
    const server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address() as { port: number };
      const url = `http://127.0.0.1:${addr.port}`;
      resolve({
        url,
        close: () => new Promise<void>((done) => server.close(() => done())),
      });
    });
  });
}

test('Express API Endpoints & Middleware', async (t) => {
  const mockMx: Record<string, MxLookupResult> = {
    'acme.com': { status: 'found', hosts: ['mx.acme.com'], reason: 'Found MX' },
    'nowhere.invalid': { status: 'none', hosts: [], reason: 'No host' },
  };

  const mockSmtp = async (email: string): Promise<SmtpProbeResult> => {
    if (email.startsWith('alice@')) {
      return { status: 'accepted', code: 250, reason: 'Recipient accepted' };
    }
    return { status: 'rejected_permanent', code: 550, reason: 'Recipient rejected' };
  };

  const { app } = createApp(
    {
      lookupMx: async (dom) => mockMx[dom] || { status: 'none', hosts: [], reason: 'Unknown' },
      probeRcpt: mockSmtp,
      config: {
        smtpEnabled: true,
        maxBatch: 5, // Low batch limit for testing
      },
    },
    {
      enableRateLimit: true,
      rateLimitMax: 3, // Low rate limit for testing
    }
  );

  const server = await startTestServer(app);

  t.after(async () => {
    await server.close();
  });

  await t.test('GET /api/health returns healthy status', async () => {
    const res = await fetch(`${server.url}/api/health`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.ok, true);
    assert.equal(body.data.status, 'healthy');
  });

  await t.test('GET /api/config returns safe config and no secrets', async () => {
    const res = await fetch(`${server.url}/api/config`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.ok, true);
    assert.equal(body.data.maxBatch, 5);
    assert.equal(body.data.smtpEnabled, true);
    // Ensure no secrets
    assert.equal(body.data.smtpHeloHost, undefined);
    assert.equal(body.data.smtpMailFrom, undefined);
  });

  await t.test('POST /api/check validates input and processes batch', async () => {
    const res = await fetch(`${server.url}/api/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emails: ['alice@acme.com', 'ALICE@acme.com', 'bob@nowhere.invalid'],
      }),
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.ok, true);
    assert.equal(body.data.duplicatesRemoved, 1);
    assert.equal(body.data.results.length, 2);

    const alice = body.data.results.find((r: any) => r.email === 'alice@acme.com');
    assert.equal(alice?.classification, 'likely_deliverable');
    assert.equal(alice?.syntaxValid, true);

    const bob = body.data.results.find((r: any) => r.email === 'bob@nowhere.invalid');
    assert.equal(bob?.classification, 'likely_bounce');
  });

  await t.test('POST /api/check rejects malformed request with 400 INVALID_REQUEST', async () => {
    const res = await fetch(`${server.url}/api/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wrongField: [] }),
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.ok, false);
    assert.equal(body.error.code, 'INVALID_REQUEST');
    assert.equal(body.error.stack, undefined); // No stack trace leak
  });

  await t.test('POST /api/check enforces 413 BATCH_TOO_LARGE when limit exceeded', async () => {
    const res = await fetch(`${server.url}/api/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emails: ['1@a.com', '2@a.com', '3@a.com', '4@a.com', '5@a.com', '6@a.com'],
      }),
    });

    assert.equal(res.status, 413);
    const body = await res.json();
    assert.equal(body.ok, false);
    assert.equal(body.error.code, 'BATCH_TOO_LARGE');
    assert.match(body.error.message, /exceeds the maximum allowed limit of 5/);
  });

  await t.test('POST /api/check enforces 429 RATE_LIMITED after limit reached', async () => {
    // We already made 3 calls to /api/check above, next one must trigger 429
    const res = await fetch(`${server.url}/api/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emails: ['test@acme.com'] }),
    });

    assert.equal(res.status, 429);
    const body = await res.json();
    assert.equal(body.ok, false);
    assert.equal(body.error.code, 'RATE_LIMITED');
  });

  await t.test('POST /api/check validates strict options and returns new informational fields', async () => {
    // Create non-rate-limited instance to test options and informational fields
    const { app: freshApp } = createApp({
      lookupMx: async (dom) => mockMx[dom] || { status: 'found', hosts: ['mx.test'], reason: 'Found' },
      probeRcpt: mockSmtp,
      config: { smtpEnabled: false, maxBatch: 20 },
    });
    const freshServer = await startTestServer(freshApp);

    try {
      // 1. Backwards compatibility: request without options succeeds
      const resWithoutOptions = await fetch(`${freshServer.url}/api/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emails: ['admin@acme.com', 'user@gmial.com', 'test@mailinator.com', 'john@gmail.com'],
        }),
      });
      assert.equal(resWithoutOptions.status, 200);
      const dataWithoutOptions = (await resWithoutOptions.json()).data;
      const adminRow = dataWithoutOptions.results.find((r: any) => r.email === 'admin@acme.com');
      assert.equal(adminRow.isRoleAddress, true);
      assert.equal(adminRow.domainAuth, undefined); // Not requested

      const typoRow = dataWithoutOptions.results.find((r: any) => r.email === 'user@gmial.com');
      assert.ok(typoRow.suggestion);
      assert.equal(typoRow.suggestion.corrected, 'user@gmail.com');

      const dispRow = dataWithoutOptions.results.find((r: any) => r.email === 'test@mailinator.com');
      assert.equal(dispRow.isDisposableDomain, true);

      const freeRow = dataWithoutOptions.results.find((r: any) => r.email === 'john@gmail.com');
      assert.equal(freeRow.isFreeProvider, true);

      // 2. Strict rejection of unknown keys in options
      const resUnknownOption = await fetch(`${freshServer.url}/api/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emails: ['user@acme.com'],
          options: {
            domainAuth: true,
            unknownKey: 'forbidden',
          },
        }),
      });
      assert.equal(resUnknownOption.status, 400);
      const errBody = await resUnknownOption.json();
      assert.equal(errBody.error.code, 'INVALID_REQUEST');

      // 3. Valid options with domainAuth
      const resWithOptions = await fetch(`${freshServer.url}/api/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emails: ['user@acme.com'],
          options: {
            domainAuth: true,
          },
        }),
      });
      assert.equal(resWithOptions.status, 200);
      const dataWithOptions = (await resWithOptions.json()).data;
      const userRow = dataWithOptions.results[0];
      assert.ok(userRow.domainAuth);
      assert.ok(typeof userRow.domainAuth.spf === 'string');
      assert.ok(typeof userRow.domainAuth.dmarc === 'string');
    } finally {
      await freshServer.close();
    }
  });
});
