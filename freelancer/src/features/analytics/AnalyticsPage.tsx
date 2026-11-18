import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { RefreshCw, ExternalLink, BarChart3, UserCheck } from 'lucide-react';
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
import type { User } from '../../session/session';

function getDocTheme(): AppTheme {
  if (typeof document === 'undefined') return 'dark';
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

export interface AnalyticsPageProps {
  showHeader?: boolean;
  hideToolbar?: boolean;
  realtime?: boolean;
  user?: User | null;
  ownerId?: string;
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({
  showHeader = true,
  hideToolbar = false,
  realtime = true,
  user,
  ownerId,
}) => {
  // Resolve effective owner ID for Grafana queries:
  // - If an explicit ownerId prop is passed, use it.
  // - If the logged-in user exists and has an id, use their unique user id.
  // - If unauthenticated or admin, default to 'All'.
  const effectiveOwnerId = useMemo(() => {
    if (ownerId !== undefined && ownerId !== null) {
      return ownerId.trim() || 'All';
    }
    if (user && user.id && user.id !== 'anonymous') {
      const role = (user.role || '').toLowerCase();
      if (role === 'admin') {
        return 'All';
      }
      return user.id;
    }
    return 'All';
  }, [ownerId, user]);

  const [prefs, setPrefs] = useState(() => loadAnalyticsPrefs());
  const [theme, setTheme] = useState<AppTheme>(getDocTheme);
  const [iframeKey, setIframeKey] = useState(0);
  const [isProbing, setIsProbing] = useState(true);
  const [probeStatus, setProbeStatus] = useState<GrafanaConnectionStatus | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  // Set document title if standalone
  useEffect(() => {
    if (showHeader) {
      document.title = 'Analytics - CodeBridge';
    }
  }, [showHeader]);

  // Listen to data-theme attribute mutations on <html>
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

  // Validate & parse configured Grafana URL
  const parsed = useMemo(() => {
    return parseGrafanaUrl(env.grafanaUrl);
  }, []);

  const mixedBlocked = useMemo(() => {
    if (!parsed.ok || typeof window === 'undefined') return false;
    return isMixedContent(window.location.protocol, new URL(parsed.url).protocol);
  }, [parsed]);

  // Connection Probing
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

  useEffect(() => {
    runProbe();
  }, [runProbe]);

  // User Actions
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

  // Derived URLs - use real-time refresh (5s) when in real-time mode
  const activeRefresh = realtime ? '5s' : prefs.refresh;
  const embedUrl = useMemo(() => {
    if (!parsed.ok) return null;
    return buildEmbedUrl(parsed, {
      range: prefs.range,
      refresh: activeRefresh,
      theme,
      ownerId: effectiveOwnerId,
    });
  }, [parsed, prefs.range, activeRefresh, theme, effectiveOwnerId]);

  const openUrl = useMemo(() => {
    if (!parsed.ok) return null;
    return buildOpenUrl(parsed, {
      range: prefs.range,
      ownerId: effectiveOwnerId,
    });
  }, [parsed, prefs.range, effectiveOwnerId]);

  const host = parsed.ok ? parsed.host : null;

  // Determine Card State & Status Line State
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
    if (probeStatus === 'unreachable') return 'unreachable';
    return 'reachable';
  }, [parsed.ok, mixedBlocked, isProbing, probeStatus]);

  return (
    <div className="space-y-4">
      {hideToolbar ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" aria-hidden="true" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted">
              Live Grafana Analytics
            </h2>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-success-bg text-success border border-success-border uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-ping" />
              Real-Time Live (5s)
            </span>
            {openUrl && (
              <a
                href={openUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open in Grafana (opens in a new tab)"
                className="inline-flex items-center justify-center font-medium transition-colors rounded-lg px-2.5 py-1 text-xs gap-1.5 bg-raised text-ink border border-line hover:bg-canvas"
              >
                <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">Open in Grafana</span>
              </a>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* 1. Header */}
          {showHeader ? (
            <div className="border-b border-line pb-4 space-y-1">
              <nav aria-label="Breadcrumb" className="text-xs text-muted">
                Overview / Analytics
              </nav>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-ink flex items-center gap-2">
                    <BarChart3 className="w-6 h-6 text-primary" aria-hidden="true" />
                    <span>Developer Analytics</span>
                  </h1>
                  <p className="text-xs text-muted mt-1">
                    Real-time telemetry and project counters from Grafana.
                  </p>
                </div>
                {effectiveOwnerId !== 'All' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-canvas border border-line text-ink">
                    <UserCheck className="w-3.5 h-3.5 text-success" aria-hidden="true" />
                    <span>Personalized: {user?.displayName || effectiveOwnerId}</span>
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="border-b border-line pb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-ink tracking-tight flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" aria-hidden="true" />
                  <span>Platform & Personal Analytics</span>
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  Live engineering metrics and test telemetry from Grafana.
                </p>
              </div>
              {effectiveOwnerId !== 'All' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-canvas border border-line text-ink">
                  <UserCheck className="w-3 h-3 text-success" aria-hidden="true" />
                  <span>Personal View</span>
                </span>
              )}
            </div>
          )}

          {/* 2. Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-3 rounded-xl border border-line bg-surface shadow-sm">
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
                aria-label="Refresh analytics data"
                className="text-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isProbing ? 'animate-spin' : ''}`} aria-hidden="true" />
                <span>Refresh</span>
              </Button>

              {openUrl ? (
                <a
                  href={openUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Open in Grafana (opens in a new tab)"
                  className="inline-flex items-center justify-center font-medium transition-colors rounded-lg px-2.5 py-1 text-xs gap-1.5 bg-raised text-ink border border-line hover:bg-canvas"
                >
                  <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Open in Grafana</span>
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  aria-label="Open in Grafana"
                  className="inline-flex items-center justify-center font-medium rounded-lg opacity-50 pointer-events-none px-2.5 py-1 text-xs gap-1.5 bg-raised text-ink border border-line"
                >
                  <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Open in Grafana</span>
                </button>
              )}
            </div>
          </div>

          {/* 3. Status Line */}
          <StatusLine
            status={statusLineState}
            host={host}
            lastChecked={lastChecked}
          />
        </>
      )}

      {/* 4. Embed Card */}
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
