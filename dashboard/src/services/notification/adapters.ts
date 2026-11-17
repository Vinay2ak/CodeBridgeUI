import { CbEvent } from '../../realtime/types';
import { NotificationsResponse } from './types';

export function adaptNotification(raw: any): CbEvent {
  const eventType = raw?.type || raw?.event_type || 'notification';
  const cleanType = eventType.toLowerCase().replace(/_/g, '.');

  return {
    id: raw?.id || `notif-${Date.now()}`,
    type: cleanType,
    occurredAt: raw?.created_at || raw?.createdAt || new Date().toISOString(),
    source: raw?.resource_type || 'notification-service',
    correlationId: raw?.id || 'unknown',
    data: {
      id: raw?.id,
      title: raw?.title || '',
      message: raw?.message || '',
      isRead: Boolean(raw?.is_read),
      ...raw,
    },
  };
}

export function adaptNotificationsResponse(raw: any): NotificationsResponse {
  if (!raw) return { items: [] };
  const items = Array.isArray(raw) ? raw : raw.items || [];
  return {
    items: items.map(adaptNotification),
  };
}
