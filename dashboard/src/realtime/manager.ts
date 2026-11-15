import { Transport, WebSocketTransport, MockTransport } from './transports';
import { nextDelay } from './backoff';
import { eventStore } from './store';
import { env } from '../lib/env';
import { getAccessToken } from '../lib/authHeader';
import { registerRealtimeReauth } from '../features/session/session';
import { CbEvent } from './types';

let transport: Transport | null = null;
let attempt = 0;
let reconnectTimer: NodeJS.Timeout | number | null = null;
let countdownInterval: NodeJS.Timeout | number | null = null;
let isStarted = false;
let liveToastHandler: ((event: CbEvent) => void) | null = null;

export function registerLiveToastHandler(handler: (event: CbEvent) => void) {
  liveToastHandler = handler;
}

function clearTimers() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
}

function createTransport(): Transport {
  return env.VITE_USE_MOCKS ? new MockTransport() : new WebSocketTransport();
}

const MAX_RECONNECT_ATTEMPTS = 1;

function scheduleReconnect() {
  if (!isStarted) return;

  clearTimers();

  if (attempt >= MAX_RECONNECT_ATTEMPTS) {
    // Gracefully fall back to offline when WebSocket backend is not reachable
    eventStore.setStatus('offline');
    return;
  }

  const delayMs = nextDelay(attempt);
  attempt++;

  const remainingSec = Math.max(1, Math.ceil(delayMs / 1000));
  eventStore.setStatus('reconnecting', remainingSec);

  reconnectTimer = setTimeout(() => {
    clearTimers();
    if (!isStarted) return;
    connect();
  }, delayMs);
}

function connect() {
  if (!isStarted) return;

  eventStore.setStatus('connecting');

  if (!transport) {
    transport = createTransport();
    setupTransportListeners(transport);
  }

  transport.connect();
}

function setupTransportListeners(t: Transport) {
  t.onOpen = () => {
    // Send auth handshake
    const token = getAccessToken();
    t.send({ type: 'auth', token });
  };

  t.onMessage = (msg: any) => {
    if (msg?.type === 'auth.ok') {
      // Handshake succeeded: reset attempt counter and set live
      attempt = 0;
      eventStore.setStatus('live');
      return;
    }

    if (msg && msg.id && msg.type) {
      const event = msg as CbEvent;
      // Add live event to store (increments unread count)
      eventStore.addLiveEvent(event);

      // Trigger live toast
      if (liveToastHandler) {
        liveToastHandler(event);
      }
    }
  };

  t.onClose = () => {
    if (isStarted) {
      scheduleReconnect();
    } else {
      eventStore.setStatus('offline');
    }
  };

  t.onError = () => {
    if (isStarted) {
      scheduleReconnect();
    }
  };
}

export function startRealtime(): void {
  if (isStarted) return;
  isStarted = true;
  attempt = 0;
  clearTimers();
  connect();
}

export function stopRealtime(): void {
  isStarted = false;
  clearTimers();
  if (transport) {
    transport.close();
    transport = null;
  }
  eventStore.setStatus('offline');
}

export function reauth(token?: string): void {
  const authToken = token || getAccessToken();
  if (transport && authToken) {
    transport.send({ type: 'auth', token: authToken });
  }
}

export function retryRealtime(): void {
  attempt = 0;
  clearTimers();
  if (transport) {
    transport.close();
    transport = null;
  }
  isStarted = true;
  connect();
}

// Hook session proactive and reactive token refresh to realtime reauth
registerRealtimeReauth((token) => {
  reauth(token);
});
