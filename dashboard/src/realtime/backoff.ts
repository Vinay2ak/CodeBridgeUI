/**
 * Calculates exponential backoff delay with +-20% jitter, capped at 30,000 ms.
 * base = min(30000, 1000 * 2^attempt)
 * jitter = +-20% (multiplier in range [0.8, 1.2])
 */
export function nextDelay(attempt: number): number {
  const safeAttempt = Math.max(0, Math.min(attempt, 20));
  const base = Math.min(30000, 1000 * Math.pow(2, safeAttempt));
  // +-20% jitter
  const jitterMultiplier = 0.8 + Math.random() * 0.4;
  return Math.round(base * jitterMultiplier);
}

