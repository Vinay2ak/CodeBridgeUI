import { describe, it, expect } from "vitest";
import { adaptNotificationsResponse, adaptNotificationItem } from "./adapters";

describe("notification adapters", () => {
  it("adapts backend notification item from contract line 502 & 588", () => {
    const backendItem = {
      id: "e2a6d71b-3f41-47fa-8ea2-1209b5a8e0f1",
      user_id: "c1f7b8c2-2849-4177-bb89-7cf1f7823f66",
      event_type: "project.assigned",
      title: "You have been assigned to project!",
      message: "Project Owner selected you for Payments Webhook Fix.",
      resource_type: "project",
      resource_id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      is_read: false,
      created_at: "2026-11-17T12:05:00Z",
    };

    const event = adaptNotificationItem(backendItem);

    expect(event.id).toBe("e2a6d71b-3f41-47fa-8ea2-1209b5a8e0f1");
    expect(event.type).toBe("project.assigned");
    expect(event.occurredAt).toBe("2026-11-17T12:05:00Z");
    expect((event.data as any).title).toBe("You have been assigned to project!");
    expect((event.data as any).isRead).toBe(false);
  });

  it("adapts GET /api/v1/notifications envelope", () => {
    const backendResponse = {
      items: [
        {
          id: "notif-1",
          title: "Payment Released",
          message: "Escrow funds released.",
          is_read: true,
          created_at: "2026-11-17T14:00:00Z",
        },
      ],
      total_unread: 0,
    };

    const res = adaptNotificationsResponse(backendResponse);
    expect(res.items).toHaveLength(1);
    expect(res.items[0].id).toBe("notif-1");
  });
});
