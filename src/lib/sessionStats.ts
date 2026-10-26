import { EmailResult } from '../types.ts';

export interface SessionStats {
  totalProcessed: number;
  deliverableCount: number;
  bounceCount: number;
  unknownCount: number;
  successRate: number; // 0 to 100 percentage, e.g. 85.5
  batchesCount: number;
  lastUpdated: string;
}

export const OLD_SESSION_STORAGE_KEY = 'mailcheck_session_verification_stats';
export const SESSION_STORAGE_KEY = 'mailscope_session_verification_stats';

/**
 * Calculates overall success rate percentage rounded to 1 decimal place.
 * Returns 0 if totalProcessed <= 0.
 */
export function calculateSuccessRate(deliverableCount: number, totalProcessed: number): number {
  if (totalProcessed <= 0) return 0;
  const rate = (deliverableCount / totalProcessed) * 100;
  return Math.round(rate * 10) / 10;
}

export interface HealthRating {
  label: string;
  tone: 'emerald' | 'amber' | 'rose' | 'slate';
  badgeClass: string;
  description: string;
}

/**
 * Evaluates success rate against standard email industry deliverability benchmarks.
 */
export function getHealthRating(successRate: number, totalProcessed: number): HealthRating {
  if (totalProcessed === 0) {
    return {
      label: 'Session Idle',
      tone: 'slate',
      badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700',
      description: 'Run your first single verification or batch to compute live session deliverability.',
    };
  }

  if (successRate >= 90) {
    return {
      label: 'Optimal Deliverability',
      tone: 'emerald',
      badgeClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
      description: 'Exceptional inbox placement confidence (≥90%). Safe for primary domain dispatch.',
    };
  }

  if (successRate >= 75) {
    return {
      label: 'Moderate Quality',
      tone: 'amber',
      badgeClass: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30',
      description: 'Acceptable deliverability (75%–89%). Review unknown or catch-all addresses before broadcast.',
    };
  }

  return {
    label: 'High Bounce Risk',
    tone: 'rose',
    badgeClass: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30',
    description: 'Elevated bounce risk (<75%). Sending now may harm sender reputation and cause blacklisting.',
  };
}

/**
 * Creates initial zeroed session stats
 */
export function getInitialSessionStats(): SessionStats {
  return {
    totalProcessed: 0,
    deliverableCount: 0,
    bounceCount: 0,
    unknownCount: 0,
    successRate: 0,
    batchesCount: 0,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Derives session stats from an array of EmailResult objects
 */
export function computeStatsFromResults(results: EmailResult[], batchesCount = 1): SessionStats {
  const total = results.length;
  let deliverable = 0;
  let bounce = 0;
  let unknown = 0;

  for (const r of results) {
    if (r.classification === 'likely_deliverable') {
      deliverable++;
    } else if (r.classification === 'likely_bounce') {
      bounce++;
    } else {
      unknown++;
    }
  }

  return {
    totalProcessed: total,
    deliverableCount: deliverable,
    bounceCount: bounce,
    unknownCount: unknown,
    successRate: calculateSuccessRate(deliverable, total),
    batchesCount: total > 0 ? Math.max(1, batchesCount) : 0,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Loads session stats from sessionStorage, with graceful migration and fallback
 */
export function loadSessionStats(fallbackResults?: EmailResult[]): SessionStats {
  try {
    let raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) {
      raw = sessionStorage.getItem(OLD_SESSION_STORAGE_KEY);
      if (raw) {
        sessionStorage.setItem(SESSION_STORAGE_KEY, raw);
        sessionStorage.removeItem(OLD_SESSION_STORAGE_KEY);
      }
    }

    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed?.totalProcessed === 'number') {
        return parsed as SessionStats;
      }
    }
  } catch {
    // ignore
  }

  if (fallbackResults && fallbackResults.length > 0) {
    const derived = computeStatsFromResults(fallbackResults, 1);
    saveSessionStats(derived);
    return derived;
  }

  return getInitialSessionStats();
}

/**
 * Saves session stats to sessionStorage
 */
export function saveSessionStats(stats: SessionStats): void {
  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(stats));
  } catch {
    // ignore
  }
}

/**
 * Updates session stats when a new batch of email verification results completes
 */
export function recordBatchVerification(
  current: SessionStats,
  newResults: EmailResult[]
): SessionStats {
  if (newResults.length === 0) return current;

  let newDeliverable = 0;
  let newBounce = 0;
  let newUnknown = 0;

  for (const r of newResults) {
    if (r.classification === 'likely_deliverable') {
      newDeliverable++;
    } else if (r.classification === 'likely_bounce') {
      newBounce++;
    } else {
      newUnknown++;
    }
  }

  const totalProcessed = current.totalProcessed + newResults.length;
  const deliverableCount = current.deliverableCount + newDeliverable;
  const bounceCount = current.bounceCount + newBounce;
  const unknownCount = current.unknownCount + newUnknown;

  const updated: SessionStats = {
    totalProcessed,
    deliverableCount,
    bounceCount,
    unknownCount,
    successRate: calculateSuccessRate(deliverableCount, totalProcessed),
    batchesCount: current.batchesCount + 1,
    lastUpdated: new Date().toISOString(),
  };

  saveSessionStats(updated);
  return updated;
}

/**
 * Updates session stats when a single email verification completes
 */
export function recordSingleVerification(
  current: SessionStats,
  singleResult: EmailResult
): SessionStats {
  const isDeliverable = singleResult.classification === 'likely_deliverable';
  const isBounce = singleResult.classification === 'likely_bounce';
  const isUnknown = !isDeliverable && !isBounce;

  const totalProcessed = current.totalProcessed + 1;
  const deliverableCount = current.deliverableCount + (isDeliverable ? 1 : 0);
  const bounceCount = current.bounceCount + (isBounce ? 1 : 0);
  const unknownCount = current.unknownCount + (isUnknown ? 1 : 0);

  const updated: SessionStats = {
    totalProcessed,
    deliverableCount,
    bounceCount,
    unknownCount,
    successRate: calculateSuccessRate(deliverableCount, totalProcessed),
    batchesCount: current.batchesCount === 0 ? 1 : current.batchesCount,
    lastUpdated: new Date().toISOString(),
  };

  saveSessionStats(updated);
  return updated;
}

/**
 * Clears session stats from sessionStorage and resets
 */
export function resetSessionStats(): SessionStats {
  try {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    sessionStorage.removeItem(OLD_SESSION_STORAGE_KEY);
  } catch {
    // ignore
  }
  return getInitialSessionStats();
}
