export type GrafanaConnectionStatus = 'reachable' | 'unreachable';

export interface ProbeOptions {
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

/**
 * Checks whether the target Grafana server is reachable by probing /api/health.
 * Uses mode: 'no-cors' so cross-origin requests resolve successfully without CORS blocks.
 */
export async function probeGrafana(
  origin: string,
  options: ProbeOptions = {}
): Promise<GrafanaConnectionStatus> {
  const { timeoutMs = 5000, fetchImpl = fetch } = options;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const healthUrl = `${origin.replace(/\/+$/, '')}/api/health`;
    await fetchImpl(healthUrl, {
      method: 'GET',
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
 */
export function isMixedContent(appProtocol: string, grafanaProtocol: string): boolean {
  return appProtocol === 'https:' && grafanaProtocol === 'http:';
}
