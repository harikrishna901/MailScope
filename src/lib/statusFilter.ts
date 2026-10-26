import { EmailResult } from '../types.ts';

export type StatusFilterValue = 'all' | 'likely_deliverable' | 'likely_bounce' | 'unknown';

export interface StatusCounts {
  all: number;
  deliverable: number;
  bounce: number;
  unknown: number;
}

/**
 * Calculates counts for each deliverability classification status.
 */
export function calculateStatusCounts(results: EmailResult[]): StatusCounts {
  let deliverable = 0;
  let bounce = 0;
  let unknown = 0;

  for (const item of results) {
    if (item.classification === 'likely_deliverable') {
      deliverable++;
    } else if (item.classification === 'likely_bounce') {
      bounce++;
    } else if (item.classification === 'unknown') {
      unknown++;
    }
  }

  return {
    all: results.length,
    deliverable,
    bounce,
    unknown,
  };
}

/**
 * Filters email verification results by the given status classification.
 */
export function filterResultsByStatus(
  results: EmailResult[],
  filter: StatusFilterValue | string
): EmailResult[] {
  if (!filter || filter === 'all') {
    return results;
  }
  return results.filter((item) => item.classification === filter);
}

/**
 * Returns human-friendly display label for a status filter option.
 */
export function getStatusFilterDisplayName(filter: StatusFilterValue | string): string {
  switch (filter) {
    case 'likely_deliverable':
      return 'Deliverable';
    case 'likely_bounce':
      return 'Bounce';
    case 'unknown':
      return 'Unknown';
    case 'all':
    default:
      return 'All Statuses';
  }
}

/**
 * Checks whether the given string is a valid status filter value.
 */
export function isValidStatusFilter(val: string): val is StatusFilterValue {
  return ['all', 'likely_deliverable', 'likely_bounce', 'unknown'].includes(val);
}
