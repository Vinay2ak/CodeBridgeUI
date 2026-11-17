import type { CbEvent } from "../../realtime/types";
import type { NotificationsResponse } from "./types";

/**
 * Maps a backend notification record (from GET /api/v1/notifications) to internal CbEvent envelope
 */
export function adaptNotificationItem(item: any): CbEvent {
  const id = String(item?.id || `notif_${Math.random().toString(36).substring(2, 9)}`);
  const title = String(item?.title || "");
  const message = String(item?.message || "");
  const occurredAt = String(item?.created_at || item?.occurredAt || new Date().toISOString());
  const eventType = String(item?.event_type || item?.type || "notification.created");

  return {
    id,
    type: eventType,
    occurredAt,
    source: "notification-service",
    correlationId: item?.correlation_id || item?.request_id || "none",
    data: {
      id,
      title,
      message,
      isRead: Boolean(item?.is_read ?? item?.read ?? false),
      resourceType: item?.resource_type,
      resourceId: item?.resource_id,
      userId: item?.user_id,
    },
  };
}

/**
 * Adapts backend GET /api/v1/notifications response payload into NotificationsResponse
 */
export function adaptNotificationsResponse(raw: any): NotificationsResponse {
  if (!raw || typeof raw !== "object") {
    return { items: [] };
  }

  const rawItems = Array.isArray(raw.items)
    ? raw.items
    : Array.isArray(raw.data)
    ? raw.data
    : Array.isArray(raw)
    ? raw
    : [];

  const items: CbEvent[] = rawItems.map(adaptNotificationItem);

  return { items };
}
