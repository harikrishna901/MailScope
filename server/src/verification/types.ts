import { TypoSuggestion } from './typo.ts';
import { DomainAuthResult } from './domainAuth.ts';

export type MxStatus = 'found' | 'implicit_a' | 'none' | 'lookup_failed';

export type SmtpStatus =
  | 'accepted'
  | 'rejected_permanent'
  | 'temporary_failure'
  | 'unreachable'
  | 'policy_blocked'
  | 'catch_all'
  | 'skipped';

export type Classification = 'likely_deliverable' | 'likely_bounce' | 'unknown';

export interface EmailResult {
  email: string;
  syntaxValid: boolean;
  domain: string | null;
  mxStatus: MxStatus | 'not_checked';
  smtpStatus: SmtpStatus;
  classification: Classification;
  reason: string;
  checkedAt: string; // ISO 8601

  // Phase 2 Optional Informational Signals (never change classification)
  suggestion?: TypoSuggestion;
  isRoleAddress?: boolean;
  isDisposableDomain?: boolean;
  isFreeProvider?: boolean;
  domainAuth?: DomainAuthResult;
}

export interface VerificationConfig {
  smtpEnabled: boolean;
  smtpTimeoutMs: number;
  smtpHeloHost: string;
  smtpMailFrom: string;
  maxBatch: number;
  domainAuthEnabled?: boolean;
}

export interface VerificationOptions {
  domainAuth?: boolean;
}

export interface MxLookupResult {
  status: MxStatus;
  hosts: string[];
  reason: string;
}

export interface SmtpProbeResult {
  status: SmtpStatus;
  code?: number;
  message?: string;
  reason: string;
}

export type MxResolver = (domain: string) => Promise<MxLookupResult>;
export type SmtpProber = (email: string, mxHost: string, config: VerificationConfig) => Promise<SmtpProbeResult>;
