import { CbEvent, UserRole } from '../realtime/types';
import { initialProjects } from './data';

export interface MockState {
  tokenGen: number;
  isSuspended: boolean;
  failingServices: Record<string, boolean>;
  failMatching: boolean;
  matchingDelayMs: number;
}

export const mockState: MockState = {
  tokenGen: 1,
  isSuspended: false,
  failingServices: {
    project: false,
    talent: false,
    payment: false,
    workspace: false,
    admin: false,
    notification: false,
  },
  failMatching: false,
  matchingDelayMs: 0,
};

const listeners = new Set<() => void>();

function notifyControlsChanged() {
  listeners.forEach((l) => l());
}

export function subscribeMockControls(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function expireToken(): void {
  mockState.tokenGen++;
  notifyControlsChanged();
}

export function setSuspended(suspended: boolean): void {
  mockState.isSuspended = suspended;
  notifyControlsChanged();
}

export function setServiceFailing(service: string, failing: boolean): void {
  mockState.failingServices[service] = failing;
  notifyControlsChanged();
}

export function isServiceFailing(service: string): boolean {
  return !!mockState.failingServices[service];
}

export function setFailMatching(fail: boolean): void {
  mockState.failMatching = fail;
  notifyControlsChanged();
}

export function setMatchingDelay(delayMs: number): void {
  mockState.matchingDelayMs = Math.max(0, delayMs);
  notifyControlsChanged();
}

let dropConnectionHandler: ((ms: number) => void) | null = null;
let emitEventHandler: ((event: CbEvent) => void) | null = null;

export function registerTransportHandlers(
  onDrop: (ms: number) => void,
  onEmit: (event: CbEvent) => void
) {
  dropConnectionHandler = onDrop;
  emitEventHandler = onEmit;
}

export function dropConnection(ms = 5000): void {
  if (dropConnectionHandler) {
    dropConnectionHandler(ms);
  }
}

export function emitTestEvent(type: string, data?: Record<string, unknown>): void {
  const id = `event-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const correlationId = `corr-${Math.random().toString(36).substring(2, 9)}`;
  const occurredAt = new Date().toISOString();

  let event: CbEvent;

  switch (type) {
    case 'project.posted':
      event = {
        id,
        type: 'project.posted',
        occurredAt,
        source: 'project-service',
        correlationId,
        data: data ?? {
          projectId: 'p-1',
          title: 'New project posted',
          budget: 5000,
        },
      };
      break;

    case 'user.registered':
      event = {
        id,
        type,
        occurredAt,
        source: 'identity-service',
        correlationId,
        data: data ?? {
          userId: `usr-${Date.now().toString(36)}`,
          role: 'freelancer' as UserRole,
          displayName: 'New Freelancer',
        },
      };
      break;

    case 'project.status_changed':
      event = {
        id,
        type,
        occurredAt,
        source: 'project-service',
        correlationId,
        data: data ?? {
          projectId: initialProjects[0].id,
          title: initialProjects[0].title,
          from: 'in_progress',
          to: 'in_review',
        },
      };
      break;

    case 'payment.held':
      event = {
        id,
        type,
        occurredAt,
        source: 'payment-service',
        correlationId,
        data: data ?? {
          paymentId: `pay-${Date.now().toString(36)}`,
          projectTitle: initialProjects[0].title,
          amount: 600,
        },
      };
      break;

    case 'payment.released':
      event = {
        id,
        type,
        occurredAt,
        source: 'payment-service',
        correlationId,
        data: data ?? {
          paymentId: `pay-${Date.now().toString(36)}`,
          projectTitle: initialProjects[2].title,
          amount: 450,
        },
      };
      break;

    case 'task.assigned':
      event = {
        id,
        type,
        occurredAt,
        source: 'workspace-service',
        correlationId,
        data: data ?? {
          taskId: `task-${Date.now().toString(36)}`,
          title: 'Code review and unit verification',
          projectTitle: initialProjects[1].title,
        },
      };
      break;

    case 'service.degraded':
      event = {
        id,
        type,
        occurredAt,
        source: 'health-service',
        correlationId,
        data: data ?? {
          service: 'ai',
          status: 'degraded',
        },
      };
      break;

    default:
      event = {
        id,
        type,
        occurredAt,
        source: 'system',
        correlationId,
        data: data ?? {},
      };
  }

  if (emitEventHandler) {
    emitEventHandler(event);
  } else if (typeof BroadcastChannel !== 'undefined') {
    const bc = new BroadcastChannel('cb-events');
    bc.postMessage(event);
    bc.close();
  }
}

// Global console helper
if (typeof window !== 'undefined') {
  (window as any).__cbMock = {
    serviceDown: (service: string, down = true) => setServiceFailing(service, down),
    failMatching: (fail = true) => setFailMatching(fail),
    setMatchingDelay: (ms: number) => setMatchingDelay(ms),
    emitEvent: emitTestEvent,
    expireToken,
    setSuspended,
  };
}
