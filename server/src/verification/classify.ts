import { Classification, MxStatus, SmtpStatus } from './types.ts';

export interface DecisionResult {
  classification: Classification;
  ruleIndex: number;
  ruleDescription: string;
}

/**
 * MailCheck Pro 7-Rule Classification Engine (First matching rule wins):
 *
 * 1. Syntax invalid -> likely_bounce
 * 2. MX 'none' -> likely_bounce
 * 3. MX 'lookup_failed' or 'not_checked' -> unknown
 * 4. SMTP 'rejected_permanent' -> likely_bounce
 * 5. SMTP 'catch_all' -> unknown
 * 6. SMTP 'accepted' -> likely_deliverable
 * 7. Everything else ('temporary_failure', 'policy_blocked', 'unreachable', 'skipped') -> unknown
 */
export function classifyResult(
  syntaxValid: boolean,
  mxStatus: MxStatus | 'not_checked',
  smtpStatus: SmtpStatus
): DecisionResult {
  // Rule 1: Syntax invalid
  if (!syntaxValid) {
    return {
      classification: 'likely_bounce',
      ruleIndex: 1,
      ruleDescription: 'Email address failed RFC syntax validation checks',
    };
  }

  // Rule 2: Domain has no mail routing (no MX and no fallback A/AAAA, or Null MX)
  if (mxStatus === 'none') {
    return {
      classification: 'likely_bounce',
      ruleIndex: 2,
      ruleDescription: 'Domain publishes no mail routing records (MX/A) or publishes a Null MX',
    };
  }

  // Rule 3: MX lookup encountered a resolver/network error or was not checked
  if (mxStatus === 'lookup_failed' || mxStatus === 'not_checked') {
    return {
      classification: 'unknown',
      ruleIndex: 3,
      ruleDescription: 'DNS resolution was inconclusive or encountered resolver errors',
    };
  }

  // Rule 4: SMTP recipient check explicitly and permanently rejected
  if (smtpStatus === 'rejected_permanent') {
    return {
      classification: 'likely_bounce',
      ruleIndex: 4,
      ruleDescription: 'Mail server explicitly and permanently rejected the recipient mailbox',
    };
  }

  // Rule 5: SMTP server is a catch-all (accepts everything)
  if (smtpStatus === 'catch_all') {
    return {
      classification: 'unknown',
      ruleIndex: 5,
      ruleDescription: 'Mail server operates in catch-all mode; recipient existence cannot be verified',
    };
  }

  // Rule 6: SMTP server accepted recipient probe (positive evidence, never a guarantee)
  if (smtpStatus === 'accepted') {
    return {
      classification: 'likely_deliverable',
      ruleIndex: 6,
      ruleDescription: 'Mail server accepted the recipient probe (positive evidence; delivery is not guaranteed)',
    };
  }

  // Rule 7: Everything else (temporary_failure, policy_blocked, unreachable, skipped)
  return {
    classification: 'unknown',
    ruleIndex: 7,
    ruleDescription:
      smtpStatus === 'skipped'
        ? 'Domain routing exists, but SMTP recipient verification was skipped; deliverability requires live server response'
        : `SMTP probe was inconclusive (${smtpStatus}); temporary or network condition prevents definitive classification`,
  };
}
