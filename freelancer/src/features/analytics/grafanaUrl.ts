export type AppTheme = 'light' | 'dark';
export type TimeRange = '24h' | '7d' | '30d' | '1h' | '6h';
export type RefreshInterval = 'off' | '5s' | '10s' | '30s' | '1m' | '5m';

export interface ParsedGrafanaUrl {
  ok: true;
  url: string;
  origin: string;
  host: string;
  uid: string;
  slug: string;
  orgId: string;
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

    const match = parsed.pathname.match(/^\/(?:d|d-solo)\/([^/]+)(?:\/([^/]+))?/);
    const uid = match ? match[1] : 'codebridge-analytics';
    const slug = match && match[2] ? match[2] : 'codebridge-platform-analytics';
    const orgId = parsed.searchParams.get('orgId') || '1';

    return {
      ok: true,
      url: parsed.toString(),
      origin: parsed.origin,
      host: parsed.host,
      uid,
      slug,
      orgId,
    };
  } catch {
    return { ok: false, reason: 'invalid' };
  }
}

export interface BuildPanelUrlOptions {
  panelId: number | null;
  range?: TimeRange;
  refresh?: RefreshInterval;
  theme?: AppTheme;
  ownerId?: string | null;
  vars?: Record<string, string>;
}

/**
 * Builds an individual d-solo panel iframe embed URL.
 * Never hard-codes host, port, or protocol.
 */
export function buildPanelUrl(
  parsed: ParsedGrafanaUrl,
  {
    panelId,
    range = '24h',
    refresh = '1m',
    theme = 'dark',
    ownerId,
    vars = {},
  }: BuildPanelUrlOptions
): string {
  const url = new URL(`${parsed.origin}/d-solo/${parsed.uid}/${parsed.slug}`);
  url.searchParams.set('orgId', parsed.orgId);
  if (panelId !== null && panelId !== undefined) {
    url.searchParams.set('panelId', String(panelId));
  }
  url.searchParams.set('from', `now-${range}`);
  url.searchParams.set('to', 'now');
  url.searchParams.set('theme', theme);

  if (refresh && refresh !== 'off') {
    url.searchParams.set('refresh', refresh);
  }

  const ownerValue = ownerId && ownerId.trim() ? ownerId.trim() : 'All';
  url.searchParams.set('var-owner_id', ownerValue);

  for (const [varName, varValue] of Object.entries(vars)) {
    if (varValue !== undefined && varValue !== null && varValue !== '' && varName !== 'owner_id') {
      url.searchParams.set(`var-${varName}`, varValue);
    }
  }

  return url.toString();
}

export interface BuildOpenUrlOptions {
  range?: TimeRange;
  ownerId?: string | null;
  vars?: Record<string, string>;
}

/**
 * Builds the URL for opening the Grafana dashboard in a new browser tab.
 */
export function buildOpenUrl(
  parsed: ParsedGrafanaUrl,
  options?: BuildOpenUrlOptions | { range: TimeRange; ownerId?: string | null }
): string {
  const range = options?.range || '24h';
  const ownerId = options && 'ownerId' in options ? options.ownerId : undefined;
  const vars = (options && 'vars' in options && options.vars) || {};

  const url = new URL(`${parsed.origin}/d/${parsed.uid}/${parsed.slug}`);
  url.searchParams.set('orgId', parsed.orgId);
  url.searchParams.set('from', `now-${range}`);
  url.searchParams.set('to', 'now');
  url.searchParams.delete('kiosk');
  url.searchParams.delete('refresh');
  url.searchParams.delete('theme');

  const ownerIdValue = ownerId && ownerId.trim() ? ownerId.trim() : 'All';
  url.searchParams.set('var-owner_id', ownerIdValue);

  for (const [varName, varValue] of Object.entries(vars)) {
    if (varValue !== undefined && varValue !== null && varValue !== '' && varName !== 'owner_id') {
      url.searchParams.set(`var-${varName}`, varValue);
    }
  }

  return url.toString();
}

/**
 * Builds the iframe embedding URL for the full dashboard.
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

  const existingKiosk = url.searchParams.get('kiosk');
  if (!existingKiosk || existingKiosk === '' || existingKiosk === '1') {
    url.searchParams.set('kiosk', 'tv');
  }

  const ownerIdValue =
    options.ownerId && options.ownerId.trim() ? options.ownerId.trim() : 'All';
  url.searchParams.set('var-owner_id', ownerIdValue);

  return url.toString();
}
