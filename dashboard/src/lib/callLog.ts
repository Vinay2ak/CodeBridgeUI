export interface CallLogEntry {
  id: string;
  method: string;
  path: string;
  status: number;
  ms: number;
  correlationId: string;
  at: string;
}

class CallLogStore {
  private logs: CallLogEntry[] = [];
  private listeners: Set<() => void> = new Set();

  public getLogs(): CallLogEntry[] {
    return this.logs;
  }

  public addLog(entry: Omit<CallLogEntry, 'id'>): void {
    const newEntry: CallLogEntry = {
      ...entry,
      id: Math.random().toString(36).substring(2, 9),
    };
    // Ring buffer of 20 entries
    this.logs = [newEntry, ...this.logs].slice(0, 20);
    this.listeners.forEach((listener) => listener());
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public clear(): void {
    this.logs = [];
    this.listeners.forEach((listener) => listener());
  }
}

export const callLog = new CallLogStore();

