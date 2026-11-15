export function nextDelay(attempt: number, randomFn = Math.random): number {
  const base = Math.min(30000, 1000 * Math.pow(2, attempt));
  // +/- 20% jitter
  const jitterFactor = 0.8 + randomFn() * 0.4;
  return Math.round(base * jitterFactor);
}

