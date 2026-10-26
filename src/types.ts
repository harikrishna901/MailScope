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

export interface TypoSuggestion {
  corrected: string;
  reason: string;
}

export interface DomainAuthResult {
  spf: 'present' | 'absent' | 'lookup_failed';
  dmarc: 'none' | 'quarantine' | 'reject' | 'absent' | 'lookup_failed';
}

export interface EmailResult {
  email: string;
  syntaxValid: boolean;
  domain: string | null;
  mxStatus: MxStatus | 'not_checked';
  smtpStatus: SmtpStatus;
  classification: Classification;
  reason: string;
  checkedAt: string; // ISO 8601

  // Informational flags
  suggestion?: TypoSuggestion;
  isRoleAddress?: boolean;
  isDisposableDomain?: boolean;
  isFreeProvider?: boolean;
  domainAuth?: DomainAuthResult;
}

export interface AppConfig {
  maxBatch: number;
  smtpEnabled: boolean;
  domainAuthEnabled?: boolean;
}

export interface VerificationOptions {
  domainAuth?: boolean;
}

export interface VerificationBatchResponse {
  results: EmailResult[];
  duplicatesRemoved: number;
  originalCount: number;
  smtpEnabled: boolean;
}

export interface AnalysisSummary {
  total: number;
  deliverable: number;
  bounce: number;
  unknown: number;
  duplicatesRemoved: number;
  checkedAt: string;
}

export interface HistoryRecord {
  id: string;
  timestamp: string;
  total: number;
  deliverable: number;
  bounce: number;
  unknown: number;
  duplicatesRemoved: number;
}
