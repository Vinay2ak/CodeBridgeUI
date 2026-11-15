import { request } from "../../lib/http";
import { NotificationsResponse } from "./types";

export const notificationApi = {
  getNotifications(): Promise<NotificationsResponse> {
    return request<NotificationsResponse>("/notifications");
  },
};

