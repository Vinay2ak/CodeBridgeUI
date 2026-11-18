import React, { useState, useEffect } from 'react';
import { ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export type CardState =
  | 'not-configured'
  | 'mixed-content'
  | 'checking'
  | 'unreachable'
  | 'ready';

interface AnalyticsEmbedCardProps {
  state: CardState;
  host: string | null;
  embedUrl: string | null;
  openUrl: string | null;
  iframeKey: number;
  onRetry: () => void;
}

export const AnalyticsEmbedCard: React.FC<AnalyticsEmbedCardProps> = ({
  state,
  host,
  embedUrl,
  openUrl,
  iframeKey,
  onRetry,
}) => {
  const [isIframeLoaded, setIsIframeLoaded] = useState(false);
  const [isSlowLoading, setIsSlowLoading] = useState(false);

  // Reset iframe loading state when key or embedUrl changes
  useEffect(() => {
    setIsIframeLoaded(false);
    setIsSlowLoading(false);
  }, [iframeKey, embedUrl]);

  // 15 second timer for slow loading detection
  useEffect(() => {
    if (state !== 'ready' || isIframeLoaded) return;

    const timer = setTimeout(() => {
      setIsSlowLoading(true);
    }, 15000);

    return () => clearTimeout(timer);
  }, [state, isIframeLoaded, iframeKey]);

  return (
    <div
      className="relative w-full max-w-full rounded-2xl border border-line bg-surface overflow-hidden shadow-sm flex flex-col"
      style={{ height: 'clamp(460px, calc(100vh - 12rem), 920px)' }}
    >
      {/* 1. Not Configured State */}
      {state === 'not-configured' && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-lg mx-auto">
          <div className="w-10 h-10 rounded-full bg-raised border border-line flex items-center justify-center text-muted mb-4">
            <AlertCircle className="w-5 h-5" aria-hidden="true" />
          </div>
          <h2 className="text-base font-bold text-ink mb-2">
            Analytics is not configured
          </h2>
          <p className="text-sm text-muted leading-relaxed">
            Set <code className="font-mono text-xs px-1.5 py-0.5 rounded bg-raised border border-line text-ink">VITE_GRAFANA_URL</code> in this app's <code className="font-mono text-xs px-1.5 py-0.5 rounded bg-raised border border-line text-ink">.env</code> file to the Grafana dashboard URL from the backend team.
          </p>
        </div>
      )}

      {/* 2. Mixed Content State */}
      {state === 'mixed-content' && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-lg mx-auto">
          <div className="w-10 h-10 rounded-full bg-danger-bg border border-danger-border flex items-center justify-center text-danger mb-4">
            <AlertCircle className="w-5 h-5" aria-hidden="true" />
          </div>
          <h2 className="text-base font-bold text-ink mb-2">
            The browser blocks this embed
          </h2>
          <p className="text-sm text-muted leading-relaxed">
            This app is served over HTTPS but Grafana uses HTTP. Use an HTTPS Grafana URL, or open the app over HTTP while testing.
          </p>
        </div>
      )}

      {/* 3. Checking State */}
      {state === 'checking' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-6 w-full">
          <p className="text-sm font-medium text-muted animate-pulse">
            Checking Grafana…
          </p>
          <div className="w-full max-w-4xl space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-24 rounded-xl bg-raised border border-line/60 p-4 flex flex-col justify-between animate-pulse"
                >
                  <div className="h-3 w-20 rounded bg-line/40" />
                  <div className="h-6 w-12 rounded bg-line/60" />
                </div>
              ))}
            </div>
            <div className="h-44 rounded-xl bg-raised border border-line/60 p-4 animate-pulse flex flex-col justify-between">
              <div className="h-3 w-36 rounded bg-line/40" />
              <div className="h-28 w-full rounded-lg bg-line/30" />
            </div>
          </div>
        </div>
      )}

      {/* 4. Unreachable State */}
      {state === 'unreachable' && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-lg mx-auto">
          <div className="w-10 h-10 rounded-full bg-danger-bg border border-danger-border flex items-center justify-center text-danger mb-4">
            <AlertCircle className="w-5 h-5" aria-hidden="true" />
          </div>
          <h2 className="text-base font-bold text-ink mb-2">
            Can't reach Grafana
          </h2>
          <p className="text-sm text-muted leading-relaxed mb-6">
            This device can't connect to {host ? <span className="font-mono text-ink">{host}</span> : 'Grafana'}. Check that Grafana is running on the backend machine and that you are on the same network.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={onRetry}
            >
              <RefreshCw className="w-4 h-4 mr-1.5" aria-hidden="true" />
              Try again
            </Button>
            {openUrl && (
              <a
                href={openUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open in Grafana (opens in a new tab)"
                className="inline-flex items-center justify-center font-medium transition-colors rounded-lg px-3 py-1.5 text-xs gap-1.5 bg-raised text-ink border border-line hover:bg-canvas"
              >
                <ExternalLink className="w-4 h-4" aria-hidden="true" />
                <span>Open in Grafana</span>
              </a>
            )}
          </div>
        </div>
      )}

      {/* 5. Ready State with Iframe & Loading Skeleton Overlay */}
      {state === 'ready' && embedUrl && (
        <div className="relative flex-1 w-full h-full">
          {!isIframeLoaded && (
            <div className="absolute inset-0 bg-surface z-10 flex flex-col items-center justify-center p-6 space-y-6">
              {isSlowLoading && (
                <div className="flex items-center gap-3 p-3 rounded-lg border border-line bg-raised text-xs text-ink shadow-sm">
                  <span>Still loading. Grafana is taking longer than usual.</span>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={onRetry}
                    className="text-xs"
                  >
                    Try again
                  </Button>
                </div>
              )}
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary animate-pulse">
                <span>Connecting live telemetry stream…</span>
              </div>
              <div className="w-full max-w-4xl space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-24 rounded-xl bg-raised border border-line/60 p-4 flex flex-col justify-between animate-pulse"
                    >
                      <div className="h-3 w-20 rounded bg-line/40" />
                      <div className="h-6 w-12 rounded bg-line/60" />
                    </div>
                  ))}
                </div>
                <div className="h-44 rounded-xl bg-raised border border-line/60 p-4 animate-pulse flex flex-col justify-between">
                  <div className="h-3 w-36 rounded bg-line/40" />
                  <div className="h-28 w-full rounded-lg bg-line/30" />
                </div>
              </div>
            </div>
          )}

          <iframe
            key={iframeKey}
            src={embedUrl}
            title="CodeBridge platform analytics (Grafana)"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            referrerPolicy="no-referrer"
            className={`w-full h-full border-0 transition-opacity duration-500 ${
              isIframeLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setIsIframeLoaded(true)}
          />
        </div>
      )}
    </div>
  );
};
