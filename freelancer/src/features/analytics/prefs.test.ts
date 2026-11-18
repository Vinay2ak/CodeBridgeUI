import { describe, it, expect, beforeEach } from 'vitest';
import { loadAnalyticsPrefs, saveAnalyticsPrefs } from './prefs';

describe('prefs module', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('1. loads default preferences when storage is empty', () => {
    const prefs = loadAnalyticsPrefs();
    expect(prefs.range).toBe('24h');
  });

  it('2. saves and reloads preferences correctly', () => {
    saveAnalyticsPrefs({ range: '7d', refresh: '1m' });
    const loaded = loadAnalyticsPrefs();
    expect(loaded.range).toBe('7d');
  });
});
