import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadAnalyticsPrefs,
  saveAnalyticsPrefs,
  DEFAULT_PREFS,
  PREFS_STORAGE_KEY,
} from './prefs';

describe('prefs module', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('1. returns default values when storage is empty', () => {
    const prefs = loadAnalyticsPrefs();
    expect(prefs).toEqual(DEFAULT_PREFS);
    expect(prefs.range).toBe('24h');
    expect(prefs.refresh).toBe('1m');
  });

  it('2. ignores invalid stored values and falls back to defaults', () => {
    sessionStorage.setItem(
      PREFS_STORAGE_KEY,
      JSON.stringify({ range: 'invalid_range', refresh: '999s' })
    );

    const prefs = loadAnalyticsPrefs();
    expect(prefs.range).toBe(DEFAULT_PREFS.range);
    expect(prefs.refresh).toBe(DEFAULT_PREFS.refresh);

    // Also handles malformed JSON gracefully
    sessionStorage.setItem(PREFS_STORAGE_KEY, '{malformed json');
    expect(loadAnalyticsPrefs()).toEqual(DEFAULT_PREFS);
  });

  it('3. supports full round-trip saving and loading', () => {
    saveAnalyticsPrefs({ range: '7d', refresh: '30s' });
    const loaded = loadAnalyticsPrefs();
    expect(loaded).toEqual({ range: '7d', refresh: '30s' });
  });
});
