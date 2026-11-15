import React from "react";

export interface ChipProps {
  tone?: "neutral" | "success" | "warning" | "danger" | "info" | "money";
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const Chip: React.FC<ChipProps> = ({
  tone = "neutral",
  icon,
  children,
  className = "",
}) => {
  let toneClasses = "bg-raised border-line text-muted";
  switch (tone) {
    case "success":
      toneClasses = "bg-success-bg border-success-border text-success";
      break;
    case "warning":
      toneClasses = "bg-warning-bg border-warning-border text-warning";
      break;
    case "danger":
      toneClasses = "bg-danger-bg border-danger-border text-danger";
      break;
    case "info":
      toneClasses = "bg-info-bg border-info-border text-primary";
      break;
    case "money":
      toneClasses = "bg-money-bg border-money-border text-money-text";
      break;
    case "neutral":
    default:
      toneClasses = "bg-raised border-line text-ink";
      break;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs border font-medium ${toneClasses} ${className}`}
    >
      {icon}
      <span>{children}</span>
    </span>
  );
};

