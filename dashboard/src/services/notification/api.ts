import { http } from '../../lib/http';
import { NotificationsResponse } from './types';
import { adaptNotificationsResponse } from './adapters';

export const notificationApi = {
  getNotifications: async (): Promise<NotificationsResponse> => {
    const raw = await http.get<any>('/api/v1/notifications');
    return adaptNotificationsResponse(raw);
  },
};
