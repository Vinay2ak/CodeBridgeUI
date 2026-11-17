import type { TimeRange, RefreshInterval } from './grafanaUrl';

export const VALID_TIME_RANGES: readonly TimeRange[] = ['1h', '6h', '24h', '7d', '30d'];
export const VALID_REFRESH_INTERVALS: readonly RefreshInterval[] = ['off', '30s', '1m', '5m'];

export interface AnalyticsPrefs {
  range: TimeRange;
  refresh: RefreshInterval;
}

export const PREFS_STORAGE_KEY = 'cb-analytics-prefs-v1';

export const DEFAULT_PREFS: AnalyticsPrefs = {
  range: '24h',
  refresh: '1m',
};

/**
 * Loads analytics user preferences from storage with graceful fallback to defaults.
 */
export function loadAnalyticsPrefs(storage: Storage = sessionStorage): AnalyticsPrefs {
  try {
    const raw = storage.getItem(PREFS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    const parsed = JSON.parse(raw);
    const range: TimeRange = VALID_TIME_RANGES.includes(parsed?.range)
      ? parsed.range
      : DEFAULT_PREFS.range;
    const refresh: RefreshInterval = VALID_REFRESH_INTERVALS.includes(parsed?.refresh)
      ? parsed.refresh
      : DEFAULT_PREFS.refresh;
    return { range, refresh };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

/**
 * Persists analytics user preferences to storage.
 */
export function saveAnalyticsPrefs(
  prefs: AnalyticsPrefs,
  storage: Storage = sessionStorage
): void {
  try {
    storage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore storage quota / security exceptions
  }
}
