export type GrafanaConnectionStatus = 'reachable' | 'unreachable';

interface ProbeOptions {
  timeoutMs?: number;
}

/**
 * Checks whether the target Grafana server is reachable by probing /api/health.
 */
export async function probeGrafana(
  origin: string,
  options: ProbeOptions = {}
): Promise<GrafanaConnectionStatus> {
  const { timeoutMs = 3000 } = options;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const healthUrl = `${origin.replace(/\/+$/, '')}/api/health`;
    const res = await fetch(healthUrl, {
      method: 'GET',
      mode: 'cors',
      signal: controller.signal,
    });

    clearTimeout(timer);
    return res.ok || res.status === 401 ? 'reachable' : 'unreachable';
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
