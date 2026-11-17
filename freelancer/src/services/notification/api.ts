import { request } from "../../lib/http";
import type { NotificationsResponse } from "./types";
import { adaptNotificationsResponse } from "./adapters";

export const notificationApi = {
  async getNotifications(): Promise<NotificationsResponse> {
    try {
      const raw = await request<any>("/api/v1/notifications");
      return adaptNotificationsResponse(raw);
    } catch {
      return { items: [] };
    }
  },
};
