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
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private isClosed = false;
  private currentToken: string | null = null;

  constructor(private callbacks: TransportEvents) {}

  private getWsUrl(): string {
    const raw = env.wsUrl || "/api/v1/notifications/ws";
    let base: string;
    if (raw.startsWith("ws://") || raw.startsWith("wss://")) {
      base = raw;
    } else {
      const origin = window.location.origin.replace(/^http/, "ws");
      const path = raw.startsWith("/") ? raw : `/${raw}`;
      base = `${origin}${path}`;
    }

    const token =
      this.currentToken ||
      (typeof localStorage !== "undefined"
        ? localStorage.getItem("cb_access_token")
        : null);

    if (token) {
      const sep = base.includes("?") ? "&" : "?";
      base = `${base}${sep}token=${encodeURIComponent(token)}`;
    }
    return base;
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
      this.callbacks.onStatus("live");
      if (this.currentToken) {
        this.sendAuth(this.currentToken);
      }
      if (this.pingTimer) clearInterval(this.pingTimer);
      this.pingTimer = setInterval(() => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          try {
            this.ws.send("ping");
          } catch {
            // Ignored
          }
        }
      }, 25000);
    };

    this.ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (
          parsed.type === "auth.ok" ||
          parsed.event === "connected" ||
          parsed.event === "pong"
        ) {
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
      if (this.pingTimer) {
        clearInterval(this.pingTimer);
        this.pingTimer = null;
      }
      if (!this.isClosed) {
        this.scheduleReconnect();
      }
    };
  }

  public sendAuth(token: string): void {
    this.currentToken = token;
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify({ type: "auth", token }));
      } catch {
        // Ignored
      }
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
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
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

