export interface CallLogEntry {
  method: string;
  path: string;
  status: number;
  ms: number;
  correlationId: string;
  at: string;
}

const MAX_LOG_ENTRIES = 20;
const ringBuffer: CallLogEntry[] = [];
let cachedLogs: CallLogEntry[] = [];
const listeners = new Set<(logs: CallLogEntry[]) => void>();

export function appendCallLog(entry: CallLogEntry): void {
  ringBuffer.unshift(entry);
  if (ringBuffer.length > MAX_LOG_ENTRIES) {
    ringBuffer.pop();
  }
  cachedLogs = [...ringBuffer];
  listeners.forEach((listener) => listener(cachedLogs));
}

export function getCallLogs(): CallLogEntry[] {
  return cachedLogs;
}

export function clearCallLogs(): void {
  ringBuffer.length = 0;
  cachedLogs = [];
  listeners.forEach((listener) => listener(cachedLogs));
}

export function subscribeCallLog(listener: (logs: CallLogEntry[]) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

