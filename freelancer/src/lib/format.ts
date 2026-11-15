export function formatCurrencyINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatRelativeTime(dateString: string): string {
  const now = Date.now();
  const date = new Date(dateString).getTime();
  const diffSec = Math.round((date - now) / 1000);

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  const absSec = Math.abs(diffSec);
  if (absSec < 60) {
    return diffSec >= 0 ? "in a few seconds" : "just now";
  }
  const diffMin = Math.round(diffSec / 60);
  if (Math.abs(diffMin) < 60) {
    return rtf.format(diffMin, "minute");
  }
  const diffHours = Math.round(diffMin / 60);
  if (Math.abs(diffHours) < 24) {
    return rtf.format(diffHours, "hour");
  }
  const diffDays = Math.round(diffHours / 24);
  return rtf.format(diffDays, "day");
}

export function formatCountdown(expiresAt: string | null): string {
  if (!expiresAt) return "00:00";
  const remaining = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
  const m = Math.floor(remaining / 60);
  const s = remaining % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

