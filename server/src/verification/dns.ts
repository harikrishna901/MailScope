

import dns from 'node:dns/promises';
import type { MxRecord } from 'node:dns';
import type { MxLookupResult, MxResolver } from './types.ts';

// server.ts loads the root .env before importing this module.
const configuredServers = process.env.DNS_SERVERS
  ?.split(',')
  .map((server) => server.trim())
  .filter(Boolean);

if (configuredServers?.length) {
  try {
    dns.setServers(configuredServers);

    console.log(
      `[Mailscope] DNS resolver configured: ${configuredServers.join(', ')}`
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : 'Unknown DNS configuration error';

    console.error(
      `[Mailscope] Invalid DNS_SERVERS configuration: ${message}`
    );
  }
}

/**
 * Identifies an RFC 7505 Null MX record.
 *
 * A standard Null MX consists of exactly one MX record with
 * priority 0 and exchange ".". An empty exchange is also
 * accepted here for compatibility with existing test fixtures.
 */
export function isNullMx(records: MxRecord[]): boolean {
  if (records.length !== 1) {
    return false;
  }

  const record = records[0];
  const exchange = (record.exchange || '').trim();

  return record.priority === 0 && ['.', ''].includes(exchange);
}

function errorCode(error: unknown): string | undefined {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string'
  ) {
    return error.code;
  }

  return undefined;
}

function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Unknown DNS resolver error';
}

/**
 * Identifies missing DNS records or a nonexistent queried name.
 */
function isMissingRecordError(code: string | undefined): boolean {
  return (
    code === 'ENOTFOUND' ||
    code === 'ENODATA' ||
    code === 'NODATA'
  );
}

/**
 * Default production DNS resolver using Node.js dns/promises.
 */
export const defaultMxResolver: MxResolver = async (
  domain: string
): Promise<MxLookupResult> => {
  let mxRecords: MxRecord[];

  try {
    mxRecords = await dns.resolveMx(domain);
  } catch (error: unknown) {
    const code = errorCode(error);

    if (!isMissingRecordError(code)) {
      return {
        status: 'lookup_failed',
        hosts: [],
        reason: `DNS MX lookup failed: ${errorMessage(error)}`,
      };
    }

    // No MX record was found. Continue with the implicit MX fallback.
    mxRecords = [];
  }

  if (mxRecords.length > 0) {
    if (isNullMx(mxRecords)) {
      return {
        status: 'none',
        hosts: [],
        reason:
          'Domain publishes a null MX (RFC 7505) rejecting all incoming email',
      };
    }

    const hosts = [...mxRecords]
      .sort((a, b) => a.priority - b.priority)
      .map((record) => record.exchange.trim())
      .filter(Boolean);

    if (hosts.length > 0) {
      return {
        status: 'found',
        hosts,
        reason: `Found ${hosts.length} mail exchange record(s) with primary host ${hosts[0]}`,
      };
    }

    return {
      status: 'lookup_failed',
      hosts: [],
      reason: 'DNS MX response contained no usable mail exchange hosts',
    };
  }

  // RFC 5321 implicit MX fallback: use the domain itself only if
  // an A or AAAA record exists.
  let ipv4Found = false;

  try {
    const ipv4 = await dns.resolve4(domain);
    ipv4Found = ipv4.length > 0;
  } catch (error: unknown) {
    const code = errorCode(error);

    if (!isMissingRecordError(code)) {
      return {
        status: 'lookup_failed',
        hosts: [],
        reason: `DNS A-record fallback lookup failed: ${errorMessage(error)}`,
      };
    }
  }

  if (ipv4Found) {
    return {
      status: 'implicit_a',
      hosts: [domain],
      reason:
        'No MX records published; resolved implicit A address fallback',
    };
  }

  try {
    const ipv6 = await dns.resolve6(domain);

    if (ipv6.length > 0) {
      return {
        status: 'implicit_a',
        hosts: [domain],
        reason:
          'No MX records published; resolved implicit AAAA address fallback',
      };
    }
  } catch (error: unknown) {
    const code = errorCode(error);

    if (!isMissingRecordError(code)) {
      return {
        status: 'lookup_failed',
        hosts: [],
        reason: `DNS AAAA-record fallback lookup failed: ${errorMessage(error)}`,
      };
    }
  }

  return {
    status: 'none',
    hosts: [],
    reason: 'No MX, A, or AAAA records found for the domain',
  };
};
