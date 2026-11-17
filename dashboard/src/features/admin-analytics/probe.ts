export type GrafanaConnectionStatus = 'reachable' | 'unreachable';

export interface ProbeOptions {
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

/**
 * Checks whether the target Grafana server is reachable by probing /api/health.
 * An opaque response (from no-cors) resolves successfully; network errors or timeouts return 'unreachable'.
 */
export async function probeGrafana(
  origin: string,
  options: ProbeOptions = {}
): Promise<GrafanaConnectionStatus> {
  const { timeoutMs = 5000, fetchImpl = fetch } = options;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = `${origin.replace(/\/+$/, '')}/api/health`;
    await fetchImpl(url, {
      mode: 'no-cors',
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timer);
    return 'reachable';
  } catch {
    clearTimeout(timer);
    return 'unreachable';
  }
}

/**
 * Detects whether embedding Grafana would trigger browser mixed-content blocking
 * (i.e. serving the application over HTTPS while requesting Grafana over plain HTTP).
 */
export function isMixedContent(pageProtocol: string, targetProtocol: string): boolean {
  const isPageHttps = pageProtocol === 'https:' || pageProtocol === 'https';
  const isTargetHttp = targetProtocol === 'http:' || targetProtocol === 'http';
  return isPageHttps && isTargetHttp;
}
