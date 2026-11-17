import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { RefreshCw, ExternalLink, BarChart3 } from 'lucide-react';
import { env } from '../../lib/env';
import { Button } from '../../components/ui/Button';
import {
  parseGrafanaUrl,
  buildEmbedUrl,
  buildOpenUrl,
  type TimeRange,
  type RefreshInterval,
  type AppTheme,
} from './grafanaUrl';
import { probeGrafana, isMixedContent, type GrafanaConnectionStatus } from './probe';
import { loadAnalyticsPrefs, saveAnalyticsPrefs } from './prefs';
import { TimeRangeControl } from './TimeRangeControl';
import { AutoRefreshControl } from './AutoRefreshControl';
import { StatusLine, type StatusLineState } from './StatusLine';
import { AnalyticsEmbedCard, type CardState } from './AnalyticsEmbedCard';

function getDocTheme(): AppTheme {
  if (typeof document === 'undefined') return 'dark';
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

export interface AnalyticsPageProps {
  showHeader?: boolean;
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ showHeader = true }) => {
  // 1. Initial State & Preferences
  const [prefs, setPrefs] = useState(() => loadAnalyticsPrefs());
  const [theme, setTheme] = useState<AppTheme>(getDocTheme);
  const [iframeKey, setIframeKey] = useState(0);
  const [isProbing, setIsProbing] = useState(true);
  const [probeStatus, setProbeStatus] = useState<GrafanaConnectionStatus | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  // 2. Set document title (only when standalone page)
  useEffect(() => {
    if (showHeader) {
      document.title = 'Analytics - CodeBridge';
    }
  }, [showHeader]);

  // 3. Listen to data-theme attribute mutations on <html>
  useEffect(() => {
    const handleMutation = () => {
      const next = getDocTheme();
      setTheme((prev) => (prev !== next ? next : prev));
    };

    const observer = new MutationObserver(handleMutation);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => observer.disconnect();
  }, []);

  // 4. Validate & Parse configured Grafana URL
  const parsed = useMemo(() => {
    return parseGrafanaUrl(env.VITE_GRAFANA_URL);
  }, []);

  const mixedBlocked = useMemo(() => {
    if (!parsed.ok || typeof window === 'undefined') return false;
    return isMixedContent(window.location.protocol, new URL(parsed.url).protocol);
  }, [parsed]);

  // 5. Connection Probing
  const runProbe = useCallback(async () => {
    if (!parsed.ok) {
      setIsProbing(false);
      setProbeStatus(null);
      setLastChecked(new Date());
      return;
    }

    if (mixedBlocked) {
      setIsProbing(false);
      setProbeStatus('unreachable');
      setLastChecked(new Date());
      return;
    }

    setIsProbing(true);
    const status = await probeGrafana(parsed.origin);
    setProbeStatus(status);
    setIsProbing(false);
    setLastChecked(new Date());
  }, [parsed, mixedBlocked]);

  // Initial probe on mount
  useEffect(() => {
    runProbe();
  }, [runProbe]);

  // 6. User Actions
  const handleRangeChange = (nextRange: TimeRange) => {
    const nextPrefs = { ...prefs, range: nextRange };
    setPrefs(nextPrefs);
    saveAnalyticsPrefs(nextPrefs);
    setIframeKey((k) => k + 1);
  };

  const handleRefreshIntervalChange = (nextRefresh: RefreshInterval) => {
    const nextPrefs = { ...prefs, refresh: nextRefresh };
    setPrefs(nextPrefs);
    saveAnalyticsPrefs(nextPrefs);
    setIframeKey((k) => k + 1);
  };

  const handleManualRefresh = () => {
    runProbe();
    setIframeKey((k) => k + 1);
  };

  // 7. Derived URLs
  const embedUrl = useMemo(() => {
    if (!parsed.ok) return null;
    return buildEmbedUrl(parsed, {
      range: prefs.range,
      refresh: prefs.refresh,
      theme,
    });
  }, [parsed, prefs.range, prefs.refresh, theme]);

  const openUrl = useMemo(() => {
    if (!parsed.ok) return null;
    return buildOpenUrl(parsed, { range: prefs.range });
  }, [parsed, prefs.range]);

  // 8. Determine Card State & Status Line State
  const cardState: CardState = useMemo(() => {
    if (!parsed.ok) return 'not-configured';
    if (mixedBlocked) return 'mixed-content';
    if (isProbing) return 'checking';
    if (probeStatus === 'unreachable') return 'unreachable';
    return 'ready';
  }, [parsed.ok, mixedBlocked, isProbing, probeStatus]);

  const statusLineState: StatusLineState = useMemo(() => {
    if (!parsed.ok) return 'not-configured';
    if (mixedBlocked) return 'mixed-content';
    if (isProbing) return 'checking';
    return probeStatus || 'checking';
  }, [parsed.ok, mixedBlocked, isProbing, probeStatus]);

  const host = parsed.ok ? parsed.host : null;

  return (
    <div className="flex flex-col gap-6 pb-12 w-full max-w-7xl mx-auto">
      {/* 1. Header (when standalone) or Section Title (when embedded in Overview) */}
      {showHeader ? (
        <div className="border-b border-border pb-4 space-y-1">
          <nav aria-label="Breadcrumb" className="text-xs text-text-muted">
            Admin / Analytics
          </nav>
          <h1 className="text-2xl font-bold tracking-tight text-text">Analytics</h1>
          <p className="text-xs text-text-muted">Platform metrics from Grafana.</p>
        </div>
      ) : (
        <div className="border-b border-border pb-3 flex items-center justify-between">
          <div>
            <h3 id="platform-analytics-title" className="text-base font-bold text-text tracking-tight flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" strokeWidth={1.5} />
              Platform Analytics
            </h3>
            <p className="text-xs text-text-muted mt-0.5">Platform metrics from Grafana.</p>
          </div>
        </div>
      )}

      {/* 2. Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-3 rounded-lg border border-border bg-surface shadow-xs">
        <div className="flex flex-wrap items-center gap-4">
          <TimeRangeControl
            value={prefs.range}
            onChange={handleRangeChange}
            disabled={!parsed.ok}
          />
          <AutoRefreshControl
            value={prefs.refresh}
            onChange={handleRefreshIntervalChange}
            disabled={!parsed.ok}
          />
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleManualRefresh}
            disabled={!parsed.ok || isProbing}
            aria-label="Refresh"
            className="text-xs"
          >
            <RefreshCw className={`w-4 h-4 stroke-[1.5] ${isProbing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          {openUrl ? (
            <a
              href={openUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open in Grafana (opens in a new tab)"
              className="inline-flex items-center justify-center font-medium transition-colors duration-100 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary cursor-pointer px-2.5 py-1 text-xs gap-1.5 bg-surface-raised text-text border border-border hover:bg-border/40"
            >
              <ExternalLink className="w-4 h-4 stroke-[1.5]" />
              Open in Grafana
            </a>
          ) : (
            <button
              type="button"
              disabled
              aria-label="Open in Grafana"
              className="inline-flex items-center justify-center font-medium rounded-md opacity-50 pointer-events-none px-2.5 py-1 text-xs gap-1.5 bg-surface-raised text-text border border-border"
            >
              <ExternalLink className="w-4 h-4 stroke-[1.5]" />
              Open in Grafana
            </button>
          )}
        </div>
      </div>

      {/* 3. Status line */}
      <StatusLine
        status={statusLineState}
        host={host}
        lastChecked={lastChecked}
      />

      {/* 4. Embed card */}
      <AnalyticsEmbedCard
        state={cardState}
        host={host}
        embedUrl={embedUrl}
        openUrl={openUrl}
        iframeKey={iframeKey}
        onRetry={handleManualRefresh}
      />
    </div>
  );
};

export default AnalyticsPage;
