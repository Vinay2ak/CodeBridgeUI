import { CbEvent, UserRole } from './types';
import { roleCanSeeEvent, simulator } from '../mocks/simulator';
import { registerTransportHandlers } from '../mocks/controls';
import { env } from '../lib/env';

export interface Transport {
  connect(): void;
  close(): void;
  send(msg: any): void;
  onOpen?: () => void;
  onMessage?: (data: any) => void;
  onClose?: (reason?: string) => void;
  onError?: (err?: any) => void;
}

/**
 * Real WebSocket Transport
 */
export class WebSocketTransport implements Transport {
  private ws: WebSocket | null = null;
  public onOpen?: () => void;
  public onMessage?: (data: any) => void;
  public onClose?: (reason?: string) => void;
  public onError?: (err?: any) => void;

  public connect(): void {
    if (this.ws) {
      this.close();
    }

    let wsUrl = env.VITE_WS_URL;
    if (!wsUrl.startsWith('ws://') && !wsUrl.startsWith('wss://')) {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const cleanPath = wsUrl.startsWith('/') ? wsUrl : `/${wsUrl}`;
      wsUrl = `${protocol}//${window.location.host}${cleanPath}`;
    }

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.onOpen?.();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.onMessage?.(data);
        } catch (err) {
          console.warn('Failed to parse WebSocket message', err);
        }
      };

      this.ws.onclose = (event) => {
        this.onClose?.(event.reason || 'Closed');
      };

      this.ws.onerror = (err) => {
        this.onError?.(err);
      };
    } catch (err) {
      this.onError?.(err);
      this.onClose?.('Connection failed');
    }
  }

  public close(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  public send(msg: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  }
}

/**
 * Mock Transport using BroadcastChannel "cb-events" + simulator + role filtering
 */
export class MockTransport implements Transport {
  private bc: BroadcastChannel | null = null;
  private currentRole: UserRole = 'owner';
  private dropTimer: NodeJS.Timeout | number | null = null;
  public onOpen?: () => void;
  public onMessage?: (data: any) => void;
  public onClose?: (reason?: string) => void;
  public onError?: (err?: any) => void;

  public connect(): void {
    this.close();

    this.bc = typeof window !== 'undefined' && 'BroadcastChannel' in window
      ? new BroadcastChannel('cb-events')
      : null;

    if (this.bc) {
      this.bc.onmessage = (ev) => {
        const event = ev.data as CbEvent;
        if (event && event.type && roleCanSeeEvent(this.currentRole, event.type)) {
          this.onMessage?.(event);
        }
      };
    }

    // Connect simulator
    simulator.setEmitCallback((event) => {
      if (roleCanSeeEvent(this.currentRole, event.type)) {
        this.onMessage?.(event);
      }
    });

    // Register dev controls
    registerTransportHandlers(
      (ms: number) => this.handleDrop(ms),
      (event: CbEvent) => {
        if (roleCanSeeEvent(this.currentRole, event.type)) {
          this.onMessage?.(event);
        }
        // Also broadcast to other tabs
        this.bc?.postMessage(event);
      }
    );

    // Trigger open
    setTimeout(() => {
      this.onOpen?.();
    }, 50);
  }

  private handleDrop(ms: number) {
    simulator.stop();
    this.onClose?.('Forced connection drop');

    if (this.dropTimer) clearTimeout(this.dropTimer);
    this.dropTimer = setTimeout(() => {
      // Re-connect
      this.connect();
    }, ms);
  }

  public close(): void {
    if (this.dropTimer) {
      clearTimeout(this.dropTimer);
      this.dropTimer = null;
    }
    simulator.stop();
    if (this.bc) {
      this.bc.close();
      this.bc = null;
    }
  }

  public send(msg: any): void {
    if (typeof msg === 'object' && msg.type === 'auth') {
      // Extract role from token payload if possible
      try {
        const token = msg.token;
        if (token && token.includes('.')) {
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload.role) {
            this.currentRole = payload.role;
          }
        }
      } catch {
        // Keep current role
      }

      // Answer auth.ok
      setTimeout(() => {
        this.onMessage?.({ type: 'auth.ok' });
        simulator.start(this.currentRole);
      }, 50);
    }
  }
}

