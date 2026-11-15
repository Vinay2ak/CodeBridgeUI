import React, { useSyncExternalStore } from "react";
import { Radio, Loader2, AlertCircle, WifiOff } from "lucide-react";
import { realtimeManager } from "../../realtime/manager";

export const LivePill: React.FC = () => {
  const state = useSyncExternalStore(
    (onStoreChange) => realtimeManager.subscribe(onStoreChange),
    () => realtimeManager.getState()
  );

  const renderContent = () => {
    switch (state.status) {
      case "live":
        return {
          icon: <Radio className="h-3 w-3 text-success animate-pulse" aria-hidden="true" />,
          label: "Live",
          className: "bg-success-bg text-success border-success-border",
        };
      case "connecting":
        return {
          icon: <Loader2 className="h-3 w-3 text-primary animate-spin" aria-hidden="true" />,
          label: "Connecting…",
          className: "bg-info-bg text-primary border-info-border",
        };
      case "reconnecting":
        return {
          icon: <AlertCircle className="h-3 w-3 text-warning animate-bounce" aria-hidden="true" />,
          label: state.retryInSec ? `Reconnecting in ${state.retryInSec}s` : "Reconnecting…",
          className: "bg-warning-bg text-warning border-warning-border",
        };
      case "offline":
      default:
        return {
          icon: <WifiOff className="h-3 w-3 text-muted" aria-hidden="true" />,
          label: "Offline",
          className: "bg-raised text-muted border-line",
        };
    }
  };

  const { icon, label, className } = renderContent();

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${className}`}
      role="status"
      aria-live="polite"
    >
      {icon}
      <span>{label}</span>
    </div>
  );
};
