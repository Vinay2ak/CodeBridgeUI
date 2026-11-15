export const EVENT_CHANNEL = "cb-events";

export interface CbEventBase {
  id: string;
  occurredAt: string; // ISO
  source: string;
  correlationId: string;
}

export interface UserRegisteredEvent extends CbEventBase {
  type: "user.registered";
  data: { userId: string; role: string; displayName: string };
}

export interface FreelancerProfileCompletedEvent extends CbEventBase {
  type: "freelancer.profile_completed";
  data: { userId: string; experience: string; skillCount: number; availability: string };
}

export interface OwnerProfileCompletedEvent extends CbEventBase {
  type: "owner.profile_completed";
  data: { userId: string; ownerType: string };
}

export type CbEvent =
  | UserRegisteredEvent
  | FreelancerProfileCompletedEvent
  | OwnerProfileCompletedEvent;

export function emitMockEvent(event: CbEvent): void {
  try {
    const channel = new BroadcastChannel(EVENT_CHANNEL);
    channel.postMessage(event);
    channel.close();
  } catch {
    // BroadcastChannel not supported (e.g. jsdom)
  }
}
