

import type {
  EmailResult,
  MxLookupResult,
  MxResolver,
  SmtpProbeResult,
  SmtpProber,
  SmtpStatus,
  VerificationConfig,
  VerificationOptions,
} from './types.ts';

import {
  normalizeAndDeduplicate,
  validateEmailSyntax,
} from './syntax.ts';

import { defaultMxResolver } from './dns.ts';
import { defaultSmtpProber } from './smtp.ts';
import { classifyResult } from './classify.ts';
import { suggestTypoFix } from './typo.ts';
import { isRoleAddress } from './role.ts';
import { isDisposableDomain, isFreeProvider } from './disposable.ts';

import {
  lookupDomainAuth,
  type DomainAuthResult,
  type TxtResolver,
} from './domainAuth.ts';

export interface VerificationServiceDependencies {
  lookupMx?: MxResolver;
  probeRcpt?: SmtpProber;
  txtResolver?: TxtResolver;
  config?: Partial<VerificationConfig>;
}

export interface VerificationBatchOutput {
  results: EmailResult[];
  duplicatesRemoved: number;
  originalCount: number;
  smtpEnabled: boolean;
}

export class VerificationService {
  private lookupMx: MxResolver;
  private probeRcpt: SmtpProber;
  private txtResolver?: TxtResolver;
  private config: VerificationConfig;

  constructor(deps: VerificationServiceDependencies = {}) {
    this.lookupMx = deps.lookupMx ?? defaultMxResolver;
    this.probeRcpt = deps.probeRcpt ?? defaultSmtpProber;
    this.txtResolver = deps.txtResolver;

    this.config = {
      smtpEnabled: deps.config?.smtpEnabled ?? false,
      smtpTimeoutMs: deps.config?.smtpTimeoutMs ?? 8000,
      smtpHeloHost: deps.config?.smtpHeloHost ?? 'mailscope.app',
      smtpMailFrom: deps.config?.smtpMailFrom ?? 'probe@mailscope.app',
      maxBatch: deps.config?.maxBatch ?? 100,
      domainAuthEnabled: deps.config?.domainAuthEnabled ?? true,
    };
  }

  public getConfig(): VerificationConfig {
    return { ...this.config };
  }

  /**
   * Verifies a batch of raw email strings with optional domain authentication.
   * An unexpected failure for one email must not abort the remaining batch.
   */
  public async verifyBatch(
    rawEmails: string[],
    options: VerificationOptions = {}
  ): Promise<VerificationBatchOutput> {
    const {
      uniqueEmails,
      duplicatesRemoved,
      originalCount,
    } = normalizeAndDeduplicate(rawEmails);

    const dnsCache = new Map<string, MxLookupResult>();
    const catchAllCache = new Map<string, boolean>();
    const domainAuthCache = new Map<string, DomainAuthResult>();

    const results: EmailResult[] = [];
    const concurrency = 5;

    for (let i = 0; i < uniqueEmails.length; i += concurrency) {
      const slice = uniqueEmails.slice(i, i + concurrency);

      const sliceResults = await Promise.all(
        slice.map(async (email): Promise<EmailResult> => {
          try {
            return await this.verifySingle(
              email,
              dnsCache,
              catchAllCache,
              domainAuthCache,
              options
            );
          } catch (error: unknown) {
            // Keep internal details in server logs, not in the API response.
            console.error(
              '[Mailscope] Email verification failed:',
              this.errorMessage(error)
            );

            return this.createFailureResult(email);
          }
        })
      );

      results.push(...sliceResults);
    }

    return {
      results,
      duplicatesRemoved,
      originalCount,
      smtpEnabled: this.config.smtpEnabled,
    };
  }

  /**
   * Verifies one email address.
   * Informational flags never change the deliverability classification.
   */
  public async verifySingle(
    email: string,
    dnsCache: Map<string, MxLookupResult> = new Map(),
    catchAllCache: Map<string, boolean> = new Map(),
    domainAuthCache: Map<string, DomainAuthResult> = new Map(),
    options: VerificationOptions = {}
  ): Promise<EmailResult> {
    const checkedAt = new Date().toISOString();

    const suggestion = suggestTypoFix(email);
    const roleFlag = isRoleAddress(email);
    const syntax = validateEmailSyntax(email);

    if (!syntax.valid) {
      const decision = classifyResult(false, 'not_checked', 'skipped');
      const domain = syntax.domain || null;

      return {
        email,
        syntaxValid: false,
        domain,
        mxStatus: 'not_checked',
        smtpStatus: 'skipped',
        classification: decision.classification,
        reason: syntax.reason,
        checkedAt,
        suggestion,
        isRoleAddress: roleFlag,
        isDisposableDomain: domain ? isDisposableDomain(domain) : false,
        isFreeProvider: domain ? isFreeProvider(domain) : false,
      };
    }

    const normalizedEmail = syntax.normalizedEmail;
    const domain = syntax.domain;

    const disposableFlag = isDisposableDomain(domain);
    const freeFlag = isFreeProvider(domain);

    // Optional SPF/DMARC checks must not prevent core verification.
    let domainAuth: DomainAuthResult | undefined;

    if (options.domainAuth && this.config.domainAuthEnabled !== false) {
      if (domainAuthCache.has(domain)) {
        domainAuth = domainAuthCache.get(domain);
      } else {
        try {
          domainAuth = await lookupDomainAuth(domain, {
            resolver: this.txtResolver,
            timeoutMs: 4000,
          });
        } catch (error: unknown) {
          console.error(
            '[Mailscope] Domain authentication lookup failed:',
            this.errorMessage(error)
          );

          domainAuth = {
            spf: 'lookup_failed',
            dmarc: 'lookup_failed',
          };
        }

        domainAuthCache.set(domain, domainAuth);
      }
    }

    // MX lookup with batch-level caching.
    let mxResult: MxLookupResult;

    if (dnsCache.has(domain)) {
      mxResult = dnsCache.get(domain)!;
    } else {
      try {
        mxResult = await this.lookupMx(domain);

        if (
          !mxResult ||
          !['found', 'implicit_a', 'none', 'lookup_failed'].includes(
            mxResult.status
          )
        ) {
          throw new Error('MX resolver returned an invalid result');
        }
      } catch (error: unknown) {
        console.error(
          '[Mailscope] MX lookup failed:',
          this.errorMessage(error)
        );

        mxResult = {
          status: 'lookup_failed',
          hosts: [],
          reason: 'DNS MX lookup failed; the domain could not be verified',
        };
      }

      dnsCache.set(domain, mxResult);
    }

    if (
      mxResult.status !== 'found' &&
      mxResult.status !== 'implicit_a'
    ) {
      const decision = classifyResult(true, mxResult.status, 'skipped');

      return {
        email: normalizedEmail,
        syntaxValid: true,
        domain,
        mxStatus: mxResult.status,
        smtpStatus: 'skipped',
        classification: decision.classification,
        reason: `${mxResult.reason}. ${decision.ruleDescription}`,
        checkedAt,
        suggestion,
        isRoleAddress: roleFlag,
        isDisposableDomain: disposableFlag,
        isFreeProvider: freeFlag,
        domainAuth,
      };
    }

    // SMTP recipient probe, if enabled.
    let smtpStatus: SmtpStatus = 'skipped';
    let smtpReason = 'SMTP recipient verification skipped';

    if (!this.config.smtpEnabled) {
      smtpReason = 'SMTP verification disabled in configuration';
    } else {
      const targetHost = mxResult.hosts[0] || domain;

      if (catchAllCache.get(domain) === true) {
        smtpStatus = 'catch_all';
        smtpReason =
          'Domain is known catch-all; individual mailboxes cannot be verified';
      } else {
        let probeRes: SmtpProbeResult;

        try {
          probeRes = await this.probeRcpt(
            normalizedEmail,
            targetHost,
            this.config
          );
        } catch (error: unknown) {
          smtpStatus = 'unreachable';
          smtpReason = 'SMTP probe failed due to a network or internal error';

          console.error(
            '[Mailscope] SMTP probe failed:',
            this.errorMessage(error)
          );

          return this.createResult({
            email: normalizedEmail,
            domain,
            mxStatus: mxResult.status,
            smtpStatus,
            reason: smtpReason,
            checkedAt,
            suggestion,
            roleFlag,
            disposableFlag,
            freeFlag,
            domainAuth,
          });
        }

        smtpStatus = probeRes.status;
        smtpReason = probeRes.reason;

        if (smtpStatus === 'accepted') {
          if (!catchAllCache.has(domain)) {
            const randomLocal =
              `mailscope_probe_${Math.random().toString(36).slice(2, 10)}`;
            const randomEmail = `${randomLocal}@${domain}`;

            try {
              const catchAllProbe = await this.probeRcpt(
                randomEmail,
                targetHost,
                this.config
              );

              if (catchAllProbe.status === 'accepted') {
                catchAllCache.set(domain, true);
                smtpStatus = 'catch_all';
                smtpReason =
                  'Domain mail server accepted a probe for a generated address, indicating possible catch-all behavior';
              } else {
                catchAllCache.set(domain, false);
              }
            } catch (error: unknown) {
              // A failed catch-all probe is inconclusive, not proof
              // that the real recipient is unreachable or deliverable.
              console.error(
                '[Mailscope] Catch-all detection failed:',
                this.errorMessage(error)
              );

              smtpStatus = 'unreachable';
              smtpReason =
                'Catch-all detection failed; recipient verification is inconclusive';
            }
          } else if (catchAllCache.get(domain) === true) {
            smtpStatus = 'catch_all';
            smtpReason = 'Domain mail server operates in catch-all mode';
          }
        }
      }
    }

    const decision = classifyResult(true, mxResult.status, smtpStatus);

    const finalReason =
      smtpStatus !== 'skipped'
        ? `${smtpReason} (${decision.ruleDescription})`
        : `${mxResult.reason}. ${decision.ruleDescription}`;

    return {
      email: normalizedEmail,
      syntaxValid: true,
      domain,
      mxStatus: mxResult.status,
      smtpStatus,
      classification: decision.classification,
      reason: finalReason,
      checkedAt,
      suggestion,
      isRoleAddress: roleFlag,
      isDisposableDomain: disposableFlag,
      isFreeProvider: freeFlag,
      domainAuth,
    };
  }

  private createFailureResult(email: string): EmailResult {
    const syntax = validateEmailSyntax(email);
    const domain = syntax.domain || null;

    return {
      email: syntax.normalizedEmail || email,
      syntaxValid: syntax.valid,
      domain,
      mxStatus: syntax.valid ? 'lookup_failed' : 'not_checked',
      smtpStatus: 'unreachable',
      classification: 'unknown',
      reason:
        'Verification could not be completed because of an unexpected error',
      checkedAt: new Date().toISOString(),
      suggestion: suggestTypoFix(email),
      isRoleAddress: isRoleAddress(email),
      isDisposableDomain: domain ? isDisposableDomain(domain) : false,
      isFreeProvider: domain ? isFreeProvider(domain) : false,
    };
  }

  private createResult(input: {
    email: string;
    domain: string;
    mxStatus: MxLookupResult['status'];
    smtpStatus: SmtpStatus;
    reason: string;
    checkedAt: string;
    suggestion: ReturnType<typeof suggestTypoFix>;
    roleFlag: boolean;
    disposableFlag: boolean;
    freeFlag: boolean;
    domainAuth?: DomainAuthResult;
  }): EmailResult {
    const decision = classifyResult(
      true,
      input.mxStatus,
      input.smtpStatus
    );

    return {
      email: input.email,
      syntaxValid: true,
      domain: input.domain,
      mxStatus: input.mxStatus,
      smtpStatus: input.smtpStatus,
      classification: decision.classification,
      reason: `${input.reason} (${decision.ruleDescription})`,
      checkedAt: input.checkedAt,
      suggestion: input.suggestion,
      isRoleAddress: input.roleFlag,
      isDisposableDomain: input.disposableFlag,
      isFreeProvider: input.freeFlag,
      domainAuth: input.domainAuth,
    };
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown error';
  }
}
