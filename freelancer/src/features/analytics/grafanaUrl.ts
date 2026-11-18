export type TimeRange = '1h' | '6h' | '24h' | '7d' | '30d';
export type RefreshInterval = 'off' | '5s' | '10s' | '30s' | '1m' | '5m';
export type AppTheme = 'dark' | 'light';

export interface ParsedGrafanaUrl {
  ok: true;
  url: string;
  origin: string;
  host: string;
}

export interface ParseGrafanaUrlFailure {
  ok: false;
  reason: 'missing' | 'invalid';
}

export type ParseGrafanaUrlResult = ParsedGrafanaUrl | ParseGrafanaUrlFailure;

/**
 * Validates and parses the raw Grafana dashboard URL.
 * Only HTTP and HTTPS protocols are accepted.
 */
export function parseGrafanaUrl(raw?: string | null): ParseGrafanaUrlResult {
  if (!raw || typeof raw !== 'string' || !raw.trim()) {
    return { ok: false, reason: 'missing' };
  }

  const trimmed = raw.trim();
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { ok: false, reason: 'invalid' };
    }

    // Default to CodeBridge analytics dashboard path if missing
    if (parsed.pathname === '/' || parsed.pathname === '') {
      parsed.pathname = '/d/codebridge-analytics/codebridge-platform-analytics';
      if (!parsed.searchParams.has('orgId')) {
        parsed.searchParams.set('orgId', '1');
      }
    }

    return {
      ok: true,
      url: parsed.toString(),
      origin: parsed.origin,
      host: parsed.host,
    };
  } catch {
    return { ok: false, reason: 'invalid' };
  }
}

/**
 * Builds the iframe embedding URL with the requested time range,
 * auto-refresh, app theme, kiosk=tv mode, and user filter.
 */
export function buildEmbedUrl(
  parsed: ParsedGrafanaUrl,
  options: {
    range: TimeRange;
    refresh: RefreshInterval;
    theme: AppTheme;
    ownerId?: string | null;
  }
): string {
  const url = new URL(parsed.url);
  url.searchParams.set('from', `now-${options.range}`);
  url.searchParams.set('to', 'now');

  if (options.refresh && options.refresh !== 'off') {
    url.searchParams.set('refresh', options.refresh);
  } else {
    url.searchParams.delete('refresh');
  }

  url.searchParams.set('theme', options.theme);

  // Set kiosk=tv to hide top search bar, breadcrumb navigation, and sidebars completely
  const existingKiosk = url.searchParams.get('kiosk');
  if (!existingKiosk || existingKiosk === '' || existingKiosk === '1') {
    url.searchParams.set('kiosk', 'tv');
  }

  const ownerIdValue =
    options.ownerId && options.ownerId.trim() ? options.ownerId.trim() : 'All';
  url.searchParams.set('var-owner_id', ownerIdValue);

  return url.toString();
}

/**
 * Builds the URL for opening Grafana in a new browser tab.
 * Strips kiosk, refresh, and theme, but preserves time range and user filter.
 */
export function buildOpenUrl(
  parsed: ParsedGrafanaUrl,
  options: { range: TimeRange; ownerId?: string | null }
): string {
  const url = new URL(parsed.url);
  url.searchParams.set('from', `now-${options.range}`);
  url.searchParams.set('to', 'now');
  url.searchParams.delete('kiosk');
  url.searchParams.delete('refresh');
  url.searchParams.delete('theme');

  const ownerIdValue =
    options.ownerId && options.ownerId.trim() ? options.ownerId.trim() : 'All';
  url.searchParams.set('var-owner_id', ownerIdValue);

  return url.toString();
}
