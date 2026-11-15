import React from "react";
import { Info, AlertTriangle, AlertCircle, CheckCircle2 } from "lucide-react";

export interface AlertProps {
  tone?: "info" | "warning" | "danger" | "success";
  title?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  tone = "info",
  title,
  children,
  action,
  className = "",
}) => {
  let containerClasses = "bg-info-bg border-info-border";
  let icon = <Info className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />;

  switch (tone) {
    case "warning":
      containerClasses = "bg-warning-bg border-warning-border";
      icon = <AlertTriangle className="h-4 w-4 text-warning shrink-0" aria-hidden="true" />;
      break;
    case "danger":
      containerClasses = "bg-danger-bg border-danger-border";
      icon = <AlertCircle className="h-4 w-4 text-danger shrink-0" aria-hidden="true" />;
      break;
    case "success":
      containerClasses = "bg-success-bg border-success-border";
      icon = <CheckCircle2 className="h-4 w-4 text-success shrink-0" aria-hidden="true" />;
      break;
    case "info":
    default:
      containerClasses = "bg-info-bg border-info-border";
      icon = <Info className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />;
      break;
  }

  return (
    <div
      role="alert"
      className={`rounded-lg border p-3 flex items-start gap-3 ${containerClasses} ${className}`}
    >
      <div className="mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0 text-sm text-ink">
        {title && <div className="font-semibold mb-0.5">{title}</div>}
        <div>{children}</div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};

