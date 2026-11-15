import { request } from "../../lib/http";
import { RefreshResponse, User } from "./types";

export const identityApi = {
  refresh(): Promise<RefreshResponse> {
    return request<RefreshResponse>("/auth/refresh", {
      method: "POST",
      skipAuth: true,
    });
  },

  logout(): Promise<void> {
    return request<void>("/auth/logout", {
      method: "POST",
    });
  },

  getCurrentUser(): Promise<User> {
    return request<User>("/users/me");
  },
};

