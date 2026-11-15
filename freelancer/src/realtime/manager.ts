import { env } from "../lib/env";
import { RealtimeTransport, WebSocketTransport, MockTransport, TransportStatus } from "./transports";
import { eventStore } from "./store";
import { CbEvent } from "./types";

export interface RealtimeState {
  status: TransportStatus;
  retryInSec?: number;
}

class RealtimeManager {
  private transport: RealtimeTransport | null = null;
  private currentStatus: TransportStatus = "offline";
  private retryInSec?: number;
  private cachedState: RealtimeState = { status: "offline" };
  private listeners = new Set<(state: RealtimeState) => void>();

  private updateState(status: TransportStatus, retryInSec?: number): void {
    if (this.currentStatus === status && this.retryInSec === retryInSec) {
      return;
    }
    this.currentStatus = status;
    this.retryInSec = retryInSec;
    this.cachedState = { status, retryInSec };
    this.notify();
  }

  public start(token: string | null): void {
    if (this.transport) {
      this.transport.close();
    }

    const callbacks = {
      onMessage: (msg: unknown) => {
        if (msg && typeof msg === "object" && "id" in msg && "type" in msg) {
          eventStore.addEvent(msg as CbEvent);
        }
      },
      onStatus: (status: TransportStatus, retryInSec?: number) => {
        this.updateState(status, retryInSec);
      },
    };

    if (env.useMocks) {
      this.transport = new MockTransport(callbacks);
    } else {
      this.transport = new WebSocketTransport(callbacks);
    }

    this.transport.connect(token);
  }

  public reauth(token: string): void {
    if (this.transport) {
      this.transport.sendAuth(token);
    }
  }

  public stop(): void {
    if (this.transport) {
      this.transport.close();
      this.transport = null;
    }
    this.updateState("offline", undefined);
  }

  public dropConnection(ms = 3000): void {
    if (!this.transport) return;
    this.updateState("reconnecting", Math.round(ms / 1000));

    setTimeout(() => {
      if (this.transport) {
        this.transport.reconnect();
      }
    }, ms);
  }

  public getState(): RealtimeState {
    return this.cachedState;
  }

  public subscribe(listener: (state: RealtimeState) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener(this.cachedState));
  }
}

export const realtimeManager = new RealtimeManager();
