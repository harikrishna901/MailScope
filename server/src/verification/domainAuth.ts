
import dns from 'node:dns/promises';

export type SpfStatus = 'present' | 'absent' | 'lookup_failed';
export type DmarcPolicy =
  | 'none'
  | 'quarantine'
  | 'reject'
  | 'absent'
  | 'lookup_failed';

export interface DomainAuthResult {
  spf: SpfStatus;
  dmarc: DmarcPolicy;
}

export type TxtResolver = (hostname: string) => Promise<string[][]>;

/**
 * Default Node.js DNS TXT record resolver.
 */
export const defaultTxtResolver: TxtResolver = async (
  hostname: string
): Promise<string[][]> => {
  return dns.resolveTxt(hostname);
};

interface ResolveTxtOptions {
  resolver?: TxtResolver;
  timeoutMs?: number;
}

type TxtQueryResult =
  | { success: true; records: string[] }
  | {
      success: false;
      errorType: 'not_found' | 'failed';
    };

function getErrorCode(error: unknown): string | undefined {
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

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Unknown DNS resolver error';
}

/**
 * Execute a TXT query with a bounded wait and consistent error mapping.
 *
 * Note: Promise.race does not cancel the underlying DNS query when the
 * timeout expires; it only stops this function from waiting for it.
 */
async function queryTxtSafe(
  hostname: string,
  resolver: TxtResolver,
  timeoutMs: number
): Promise<TxtQueryResult> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    const rawRecords = await Promise.race([
      resolver(hostname),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          const error = new Error('DNS TXT query timed out');
          reject(error);
        }, timeoutMs);
      }),
    ]);

    return {
      success: true,
      records: rawRecords.map((chunks) => chunks.join('')),
    };
  } catch (error: unknown) {
    const code = getErrorCode(error);

    if (
      code === 'ENOTFOUND' ||
      code === 'ENODATA' ||
      code === 'NODATA' ||
      code === 'NXDOMAIN'
    ) {
      return {
        success: false,
        errorType: 'not_found',
      };
    }

    // Includes timeouts, SERVFAIL, ECONNREFUSED and other resolver errors.
    return {
      success: false,
      errorType: 'failed',
    };
  } finally {
    if (timer !== undefined) {
      clearTimeout(timer);
    }
  }
}

/**
 * Looks up SPF and DMARC records.
 *
 * These are informational signals and must not independently change
 * mailbox deliverability classification.
 */
export async function lookupDomainAuth(
  domain: string,
  options: ResolveTxtOptions = {}
): Promise<DomainAuthResult> {
  const resolver = options.resolver ?? defaultTxtResolver;
  const requestedTimeout = options.timeoutMs ?? 4000;
  const timeoutMs =
    Number.isFinite(requestedTimeout) && requestedTimeout > 0
      ? requestedTimeout
      : 4000;

  if (!domain || !domain.includes('.')) {
    return {
      spf: 'absent',
      dmarc: 'absent',
    };
  }

  // 1. SPF lookup on the root domain.
  const spfResult = await queryTxtSafe(domain, resolver, timeoutMs);

  let spf: SpfStatus;

  if (!spfResult.success) {
    spf = spfResult.errorType === 'not_found'
      ? 'absent'
      : 'lookup_failed';
  } else {
    const hasSpf = spfResult.records.some((record) =>
      /^v=spf1(?:\s|$)/i.test(record.trim())
    );

    spf = hasSpf ? 'present' : 'absent';
  }

  // 2. DMARC lookup on _dmarc.<domain>.
  const dmarcResult = await queryTxtSafe(
    `_dmarc.${domain}`,
    resolver,
    timeoutMs
  );

  let dmarc: DmarcPolicy;

  if (!dmarcResult.success) {
    dmarc = dmarcResult.errorType === 'not_found'
      ? 'absent'
      : 'lookup_failed';
  } else {
    const dmarcRecords = dmarcResult.records.filter((record) =>
      /^v=DMARC1\s*;/i.test(record.trim())
    );

    if (dmarcRecords.length === 0) {
      dmarc = 'absent';
    } else {
      const record = dmarcRecords[0].trim();

      // DMARC requires a valid policy tag. Do not report p=none
      // merely because the policy tag is missing or malformed.
      const policyMatch = record.match(
        /(?:^|;)\s*p\s*=\s*(none|quarantine|reject)\s*(?=;|$)/i
      );

      if (!policyMatch) {
        // The current public type has no "invalid" state. Use
        // lookup_failed to avoid falsely reporting a valid policy.
        dmarc = 'lookup_failed';
      } else {
        const policy = policyMatch[1].toLowerCase();

        if (policy === 'reject') {
          dmarc = 'reject';
        } else if (policy === 'quarantine') {
          dmarc = 'quarantine';
        } else {
          dmarc = 'none';
        }
      }
    }
  }

  return { spf, dmarc };
}
