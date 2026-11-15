import { http } from '../../lib/http';
import { NotificationsResponse } from './types';

export const notificationApi = {
  getNotifications: () => http.get<NotificationsResponse>('/notifications'),
};

