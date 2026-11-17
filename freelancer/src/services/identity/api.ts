import { request } from "../../lib/http";
import type { RefreshResponse, User } from "./types";
import { adaptRefreshResponse, adaptUser } from "./adapters";

export const identityApi = {
  async refresh(): Promise<RefreshResponse> {
    const raw = await request<any>("/api/v1/auth/refresh", {
      method: "POST",
      skipAuth: true,
    });
    return adaptRefreshResponse(raw);
  },

  async logout(): Promise<void> {
    await request<void>("/api/v1/auth/logout", {
      method: "POST",
    });
  },

  async getCurrentUser(): Promise<User> {
    const raw = await request<any>("/api/v1/users/me");
    return adaptUser(raw);
  },
};
