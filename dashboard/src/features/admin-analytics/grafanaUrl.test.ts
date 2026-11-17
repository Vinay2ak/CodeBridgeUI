import { describe, it, expect } from 'vitest';
import {
  parseGrafanaUrl,
  buildEmbedUrl,
  buildOpenUrl,
  type ParsedGrafanaUrl,
} from './grafanaUrl';

describe('grafanaUrl module', () => {
  it('1. returns missing when input is empty, null, or undefined', () => {
    expect(parseGrafanaUrl('')).toEqual({ ok: false, reason: 'missing' });
    expect(parseGrafanaUrl('   ')).toEqual({ ok: false, reason: 'missing' });
    expect(parseGrafanaUrl(null)).toEqual({ ok: false, reason: 'missing' });
    expect(parseGrafanaUrl(undefined)).toEqual({ ok: false, reason: 'missing' });
  });

  it('2. returns invalid when input is not a parseable URL', () => {
    expect(parseGrafanaUrl('not-a-valid-url')).toEqual({ ok: false, reason: 'invalid' });
    expect(parseGrafanaUrl('://missing-protocol')).toEqual({ ok: false, reason: 'invalid' });
  });

  it('3. rejects non-http/https protocols such as ftp', () => {
    expect(parseGrafanaUrl('ftp://grafana.internal:3001/d/123')).toEqual({
      ok: false,
      reason: 'invalid',
    });
    expect(parseGrafanaUrl('file:///etc/hosts')).toEqual({
      ok: false,
      reason: 'invalid',
    });
  });

  it('4. preserves kiosk and orgId from the input URL in buildEmbedUrl', () => {
    const raw = 'http://monitoring.local:3001/d/analytics/dashboard?orgId=1&kiosk';
    const parsed = parseGrafanaUrl(raw) as ParsedGrafanaUrl;
    expect(parsed.ok).toBe(true);

    const embedUrl = buildEmbedUrl(parsed, { range: '24h', refresh: '1m', theme: 'dark' });
    const urlObj = new URL(embedUrl);

    expect(urlObj.searchParams.get('orgId')).toBe('1');
    expect(urlObj.searchParams.has('kiosk')).toBe(true);
  });

  it('5. overrides from and to parameters with range selection', () => {
    const raw = 'http://monitoring.local:3001/d/analytics/dashboard?from=now-1y&to=now-1d';
    const parsed = parseGrafanaUrl(raw) as ParsedGrafanaUrl;

    const embedUrl = buildEmbedUrl(parsed, { range: '7d', refresh: '30s', theme: 'dark' });
    const urlObj = new URL(embedUrl);

    expect(urlObj.searchParams.get('from')).toBe('now-7d');
    expect(urlObj.searchParams.get('to')).toBe('now');
  });

  it('6. omits refresh parameter when refresh is off', () => {
    const raw = 'http://monitoring.local:3001/d/analytics/dashboard?refresh=5s';
    const parsed = parseGrafanaUrl(raw) as ParsedGrafanaUrl;

    const embedUrl = buildEmbedUrl(parsed, { range: '6h', refresh: 'off', theme: 'light' });
    const urlObj = new URL(embedUrl);

    expect(urlObj.searchParams.has('refresh')).toBe(false);
  });

  it('7. sets theme correctly for both dark and light modes', () => {
    const raw = 'http://monitoring.local:3001/d/analytics/dashboard';
    const parsed = parseGrafanaUrl(raw) as ParsedGrafanaUrl;

    const darkUrl = buildEmbedUrl(parsed, { range: '1h', refresh: '5m', theme: 'dark' });
    expect(new URL(darkUrl).searchParams.get('theme')).toBe('dark');

    const lightUrl = buildEmbedUrl(parsed, { range: '1h', refresh: '5m', theme: 'light' });
    expect(new URL(lightUrl).searchParams.get('theme')).toBe('light');
  });

  it('8. ensures open URL has no kiosk, refresh or theme parameter', () => {
    const raw = 'http://monitoring.local:3001/d/analytics/dashboard?orgId=2&kiosk&refresh=1m&theme=dark';
    const parsed = parseGrafanaUrl(raw) as ParsedGrafanaUrl;

    const openUrl = buildOpenUrl(parsed, { range: '30d' });
    const urlObj = new URL(openUrl);

    expect(urlObj.searchParams.has('kiosk')).toBe(false);
    expect(urlObj.searchParams.has('refresh')).toBe(false);
    expect(urlObj.searchParams.has('theme')).toBe(false);
    expect(urlObj.searchParams.get('from')).toBe('now-30d');
    expect(urlObj.searchParams.get('to')).toBe('now');
    expect(urlObj.searchParams.get('orgId')).toBe('2');
  });

  it('9. preserves unrelated query parameters and custom filters', () => {
    const raw = 'https://grafana.internal/d/codebridge?var-service=api&var-cluster=prod&orgId=1';
    const parsed = parseGrafanaUrl(raw) as ParsedGrafanaUrl;

    const embedUrl = buildEmbedUrl(parsed, { range: '24h', refresh: '1m', theme: 'dark' });
    const urlObj = new URL(embedUrl);

    expect(urlObj.searchParams.get('var-service')).toBe('api');
    expect(urlObj.searchParams.get('var-cluster')).toBe('prod');
    expect(urlObj.searchParams.get('orgId')).toBe('1');
  });

  it('10. appends var-owner_id with specific ownerId or defaults to All', () => {
    const raw = 'http://monitoring.local:3001/d/analytics/dashboard?orgId=1&kiosk';
    const parsed = parseGrafanaUrl(raw) as ParsedGrafanaUrl;

    // Test with specific owner ID
    const ownerEmbed = buildEmbedUrl(parsed, {
      range: '24h',
      refresh: '1m',
      theme: 'dark',
      ownerId: '2477b19f-d4fb-42ea-925b-16364c269d49',
    });
    expect(new URL(ownerEmbed).searchParams.get('var-owner_id')).toBe('2477b19f-d4fb-42ea-925b-16364c269d49');

    // Test default when ownerId is undefined / null
    const defaultEmbed = buildEmbedUrl(parsed, {
      range: '24h',
      refresh: '1m',
      theme: 'dark',
    });
    expect(new URL(defaultEmbed).searchParams.get('var-owner_id')).toBe('All');

    // Test openUrl with owner ID
    const ownerOpen = buildOpenUrl(parsed, {
      range: '7d',
      ownerId: 'usr-project-owner-1',
    });
    expect(new URL(ownerOpen).searchParams.get('var-owner_id')).toBe('usr-project-owner-1');

    // Test openUrl default to All
    const defaultOpen = buildOpenUrl(parsed, {
      range: '7d',
    });
    expect(new URL(defaultOpen).searchParams.get('var-owner_id')).toBe('All');
  });
});
