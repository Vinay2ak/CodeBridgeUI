import { CbEvent } from "./types";

const MAX_STORED_EVENTS = 50;

class EventStore {
  private events: CbEvent[] = [];
  private eventIds = new Set<string>();
  private listeners = new Set<(event: CbEvent) => void>();
  private typeListeners = new Map<string, Set<(event: CbEvent) => void>>();

  public addEvent(event: CbEvent): boolean {
    if (!event || !event.id) return false;
    if (this.eventIds.has(event.id)) {
      return false; // deduplicate
    }

    this.eventIds.add(event.id);
    this.events.unshift(event);

    if (this.events.length > MAX_STORED_EVENTS) {
      const removed = this.events.pop();
      if (removed) {
        this.eventIds.delete(removed.id);
      }
    }

    // Notify listeners
    this.listeners.forEach((listener) => listener(event));
    const typeSet = this.typeListeners.get(event.type);
    if (typeSet) {
      typeSet.forEach((listener) => listener(event));
    }

    return true;
  }

  public getEvents(type?: string): CbEvent[] {
    if (!type) {
      return [...this.events];
    }
    return this.events.filter((e) => e.type === type);
  }

  public subscribe(type: string, listener: (event: CbEvent) => void): () => void {
    if (!this.typeListeners.has(type)) {
      this.typeListeners.set(type, new Set());
    }
    const set = this.typeListeners.get(type)!;
    set.add(listener);

    return () => {
      set.delete(listener);
      if (set.size === 0) {
        this.typeListeners.delete(type);
      }
    };
  }

  public subscribeAll(listener: (event: CbEvent) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public clear(): void {
    this.events = [];
    this.eventIds.clear();
  }
}

export const eventStore = new EventStore();

