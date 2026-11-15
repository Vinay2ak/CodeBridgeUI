import { env } from "../lib/env";
import { nextDelay } from "./backoff";

export type TransportStatus = "connecting" | "live" | "reconnecting" | "offline";

export interface TransportEvents {
  onMessage: (message: unknown) => void;
  onStatus: (status: TransportStatus, retryInSec?: number) => void;
}

export interface RealtimeTransport {
  connect(token: string | null): void;
  sendAuth(token: string): void;
  close(): void;
  reconnect(): void;
}

export class WebSocketTransport implements RealtimeTransport {
  private ws: WebSocket | null = null;
  private attempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private isClosed = false;
  private currentToken: string | null = null;

  constructor(private callbacks: TransportEvents) {}

  private getWsUrl(): string {
    const raw = env.wsUrl;
    if (raw.startsWith("ws://") || raw.startsWith("wss://")) {
      return raw;
    }
    const origin = window.location.origin.replace(/^http/, "ws");
    const path = raw.startsWith("/") ? raw : `/${raw}`;
    return `${origin}${path}`;
  }

  public connect(token: string | null): void {
    this.isClosed = false;
    this.currentToken = token;
    this.callbacks.onStatus("connecting");

    try {
      this.ws = new WebSocket(this.getWsUrl());
    } catch {
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this.attempt = 0;
      if (this.currentToken) {
        this.sendAuth(this.currentToken);
      }
    };

    this.ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.type === "auth.ok") {
          this.callbacks.onStatus("live");
          return;
        }
        this.callbacks.onMessage(parsed);
      } catch {
        // Ignored
      }
    };

    this.ws.onerror = () => {
      // WebSocket error triggers onclose
    };

    this.ws.onclose = () => {
      if (!this.isClosed) {
        this.scheduleReconnect();
      }
    };
  }

  public sendAuth(token: string): void {
    this.currentToken = token;
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: "auth", token }));
    }
  }

  private scheduleReconnect(): void {
    if (this.isClosed) return;
    if (this.attempt >= 3) {
      this.callbacks.onStatus("offline");
      return;
    }
    const delay = nextDelay(this.attempt);
    this.attempt++;
    const sec = Math.round(delay / 1000);
    this.callbacks.onStatus("reconnecting", sec);

    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      if (!this.isClosed) {
        this.connect(this.currentToken);
      }
    }, delay);
  }

  public reconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.close();
    }
    this.connect(this.currentToken);
  }

  public close(): void {
    this.isClosed = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.callbacks.onStatus("offline");
  }
}

export class MockTransport implements RealtimeTransport {
  private channel: BroadcastChannel | null = null;
  private isClosed = false;
  private currentToken: string | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(private callbacks: TransportEvents) {}

  public connect(token: string | null): void {
    this.isClosed = false;
    this.currentToken = token;
    this.callbacks.onStatus("connecting");

    if (typeof BroadcastChannel !== "undefined") {
      this.channel = new BroadcastChannel("cb-events");
      this.channel.onmessage = (event) => {
        if (this.isClosed) return;
        this.callbacks.onMessage(event.data);
      };
    }

    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      if (this.isClosed) return;
      if (this.currentToken) {
        this.callbacks.onStatus("live");
      } else {
        this.callbacks.onStatus("offline");
      }
    }, 200);
  }

  public sendAuth(token: string): void {
    this.currentToken = token;
    if (!this.isClosed) {
      this.callbacks.onStatus("live");
    }
  }

  public reconnect(): void {
    this.callbacks.onStatus("connecting");
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      if (!this.isClosed) {
        this.callbacks.onStatus("live");
      }
    }, 300);
  }

  public close(): void {
    this.isClosed = true;
    if (this.timer) clearTimeout(this.timer);
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    this.callbacks.onStatus("offline");
  }
}

