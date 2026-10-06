import { QueryPriority } from '../types';

/**
 * Calculates deadline proximity priority:
 * - HIGH: Deadline is within 24 hours (or past due / urgent same-day)
 * - MEDIUM: Deadline is within 24 to 72 hours (1 to 3 days)
 * - LOW: Deadline is beyond 72 hours (> 3 days)
 */
export function getQueryPriority(query: {
  priority?: QueryPriority;
  deadlineTimestamp?: number;
  deadline?: string;
  sourceEmailDate?: string;
}): QueryPriority {
  if (query.priority) return query.priority;

  let deadlineTs = query.deadlineTimestamp;
  if (!deadlineTs && query.deadline) {
    const parsed = Date.parse(query.deadline);
    if (!isNaN(parsed)) deadlineTs = parsed;
  }

  if (!deadlineTs) return 'MEDIUM';

  const now = Date.now();
  let diffMs = deadlineTs - now;

  // In sample digest / historical email context where dates are in the past relative to system clock,
  // evaluate proximity relative to when the digest was received.
  if (diffMs < 0 && query.sourceEmailDate) {
    const sourceTs = Date.parse(query.sourceEmailDate);
    if (!isNaN(sourceTs)) {
      diffMs = deadlineTs - sourceTs;
    }
  }

  // If past deadline, mark High priority so user can review immediately
  if (diffMs <= 0) return 'HIGH';

  const hoursRemaining = diffMs / (1000 * 60 * 60);

  if (hoursRemaining <= 24) {
    return 'HIGH';
  }
  if (hoursRemaining <= 72) {
    return 'MEDIUM';
  }
  return 'LOW';
}

/**
 * Formats approximate time remaining until the deadline
 */
export function getDeadlineTimeRemaining(query: {
  deadlineTimestamp?: number;
  deadline?: string;
  sourceEmailDate?: string;
}): string {
  let deadlineTs = query.deadlineTimestamp;
  if (!deadlineTs && query.deadline) {
    const parsed = Date.parse(query.deadline);
    if (!isNaN(parsed)) deadlineTs = parsed;
  }
  if (!deadlineTs) return '';

  const now = Date.now();
  let diffMs = deadlineTs - now;

  if (diffMs < 0 && query.sourceEmailDate) {
    const sourceTs = Date.parse(query.sourceEmailDate);
    if (!isNaN(sourceTs)) {
      diffMs = deadlineTs - sourceTs;
    }
  }

  if (diffMs <= 0) return 'Due today';

  const hours = Math.round(diffMs / (1000 * 60 * 60));
  if (hours < 24) {
    return `${hours}h left`;
  }
  const days = Math.round(hours / 24);
  return `${days}d left`;
}
