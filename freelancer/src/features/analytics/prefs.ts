import type { TimeRange, RefreshInterval } from './grafanaUrl';

export interface AnalyticsPrefs {
  range: TimeRange;
  refresh: RefreshInterval;
}

const STORAGE_KEY = 'cb-freelancer-analytics-prefs-v1';

const DEFAULT_PREFS: AnalyticsPrefs = {
  range: '24h',
  refresh: 'off',
};

export function loadAnalyticsPrefs(): AnalyticsPrefs {
  if (typeof window === 'undefined') {
    return DEFAULT_PREFS;
  }

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw);
    return {
      range: parsed.range || DEFAULT_PREFS.range,
      refresh: parsed.refresh || DEFAULT_PREFS.refresh,
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function saveAnalyticsPrefs(prefs: AnalyticsPrefs): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore storage quota errors
  }
}
