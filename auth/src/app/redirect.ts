import { VITE_DASHBOARD_URL, VITE_FREELANCER_URL } from "../lib/env";

export function redirectToDashboard(role: "owner" | "freelancer" | "admin"): void {
  const rt =
    typeof localStorage !== "undefined"
      ? localStorage.getItem("cb_refresh_token") || localStorage.getItem("cb_rt")
      : null;

  if (rt && typeof document !== "undefined") {
    document.cookie = `cb_refresh_token=${encodeURIComponent(rt)}; path=/; max-age=604800; SameSite=Lax`;
    document.cookie = `cb_rt=${encodeURIComponent(rt)}; path=/; max-age=604800; SameSite=Lax`;
  }

  const base =
    role === "freelancer"
      ? (VITE_FREELANCER_URL || "http://localhost:5177").replace(/\/$/, "")
      : (VITE_DASHBOARD_URL || "http://localhost:5175").replace(/\/$/, "");

  const target = rt ? `${base}?rt=${encodeURIComponent(rt)}` : base;
  window.location.assign(target);
}

export function redirectToLogin(): void {
  window.location.assign("/login");
}
