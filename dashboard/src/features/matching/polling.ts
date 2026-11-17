export const MAX_POLLS = 15;

export function nextPollDelay(attempt: number): number {
  if (attempt <= 0) return 800;
  if (attempt === 1) return 1000;
  if (attempt === 2) return 1500;
  return 2000;
}
