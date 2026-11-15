import { describe, it, expect, beforeEach } from "vitest";
import { eventStore } from "./store";
import { CbEvent } from "./types";

function createMockEvent(id: string, type = "workspace.status_changed"): CbEvent {
  return {
    id,
    type,
    occurredAt: new Date().toISOString(),
    source: "test",
    correlationId: `corr_${id}`,
    data: { taskId: "t1", status: "running" },
  } as CbEvent;
}

describe("Event Store", () => {
  beforeEach(() => {
    eventStore.clear();
  });

  it("deduplicates events by id", () => {
    const e1 = createMockEvent("ev-1");
    const e2 = createMockEvent("ev-1");

    expect(eventStore.addEvent(e1)).toBe(true);
    expect(eventStore.addEvent(e2)).toBe(false);

    const all = eventStore.getEvents();
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe("ev-1");
  });

  it("stores newest events first and caps at 50", () => {
    for (let i = 1; i <= 60; i++) {
      eventStore.addEvent(createMockEvent(`ev-${i}`));
    }

    const all = eventStore.getEvents();
    expect(all).toHaveLength(50);
    // Newest is ev-60
    expect(all[0].id).toBe("ev-60");
    // Oldest retained is ev-11 (since 60 down to 11 is 50 items)
    expect(all[49].id).toBe("ev-11");
  });

  it("notifies subscribers by event type", () => {
    const receivedWorkspace: CbEvent[] = [];
    const receivedPayment: CbEvent[] = [];

    const unsubW = eventStore.subscribe("workspace.status_changed", (e) => {
      receivedWorkspace.push(e);
    });
    const unsubP = eventStore.subscribe("payment.state_changed", (e) => {
      receivedPayment.push(e);
    });

    eventStore.addEvent(createMockEvent("e-1", "workspace.status_changed"));
    eventStore.addEvent(createMockEvent("e-2", "payment.state_changed"));

    expect(receivedWorkspace).toHaveLength(1);
    expect(receivedWorkspace[0].id).toBe("e-1");
    expect(receivedPayment).toHaveLength(1);
    expect(receivedPayment[0].id).toBe("e-2");

    unsubW();
    unsubP();
  });
});

