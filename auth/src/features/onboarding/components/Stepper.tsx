import { Check } from "lucide-react";
import type { UserRole } from "../types";

export interface StepperProps {
  currentStep: number;
  role: UserRole | null;
  onStepClick?: (step: number) => void;
}

const LABELS_BY_ROLE: Record<UserRole | "none", readonly string[]> = {
  owner: ["Account", "Profile"],
  freelancer: ["Account", "Identity", "Skills"],
  none: ["Account", "Profile"],
};

export function Stepper({ currentStep, role, onStepClick }: StepperProps) {
  const labels = LABELS_BY_ROLE[role ?? "none"];
  const total = labels.length;

  return (
    <nav aria-label="Onboarding progress" className="mb-6">
      <p className="text-xs font-medium text-text-muted mb-2">
        Step {Math.min(currentStep + 1, total)} of {total}
      </p>
      <ol
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}
      >
        {labels.map((label, index) => {
          const isActive = index === currentStep;
          const isDone = index < currentStep;
          const isClickable = index >= 1 && isDone && Boolean(onStepClick);

          const badgeClass = [
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold border transition-colors duration-fast",
            isActive
              ? "border-primary bg-primary text-on-primary"
              : isDone
                ? "border-primary/60 bg-primary/15 text-primary"
                : "border-border bg-surface text-text-muted",
          ].join(" ");

          const content = (
            <>
              <span className={badgeClass} aria-hidden="true">
                {isDone ? <Check className="h-3.5 w-3.5" /> : index + 1}
              </span>
              <span
                className={[
                  "truncate text-xs font-medium",
                  isActive ? "text-text" : isDone ? "text-text" : "text-text-muted",
                ].join(" ")}
              >
                {label}
              </span>
            </>
          );

          return (
            <li
              key={label}
              aria-current={isActive ? "step" : undefined}
              className="min-w-0"
            >
              {isClickable ? (
                <button
                  type="button"
                  onClick={() => onStepClick?.(index)}
                  className="flex w-full min-w-0 items-center gap-2 rounded-md px-1.5 py-1 text-left transition-colors duration-fast hover:bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
                >
                  {content}
                </button>
              ) : (
                <span className="flex w-full min-w-0 items-center gap-2 rounded-md px-1.5 py-1">
                  {content}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
