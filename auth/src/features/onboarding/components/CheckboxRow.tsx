import { forwardRef, useId, type InputHTMLAttributes } from "react";
import { AlertCircle } from "lucide-react";

export interface CheckboxRowProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  hint?: string;
  error?: string;
}

export const CheckboxRow = forwardRef<HTMLInputElement, CheckboxRowProps>(
  ({ label, hint, error, id, className = "", ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const hintId = `${inputId}-hint`;
    const errorId = `${inputId}-error`;

    const describedBy = [hint ? hintId : null, error ? errorId : null]
      .filter(Boolean)
      .join(" ");

    return (
      <div className="flex flex-col gap-1 min-w-0">
        <label
          htmlFor={inputId}
          className={[
            "flex items-start gap-3 rounded-md border p-3.5 cursor-pointer transition-colors duration-fast",
            error
              ? "border-danger bg-danger/5"
              : "border-border bg-surface hover:border-text-muted",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <input
            ref={ref}
            id={inputId}
            type="checkbox"
            aria-invalid={Boolean(error) || undefined}
            aria-describedby={describedBy || undefined}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-border bg-bg accent-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
            {...props}
          />
          <span className="min-w-0 flex-1 space-y-0.5">
            <span className="block text-sm font-medium text-text">{label}</span>
            {hint && (
              <span id={hintId} className="block text-xs text-text-muted">
                {hint}
              </span>
            )}
          </span>
        </label>
        <div className="min-h-[1.25rem]">
          {error && (
            <p id={errorId} role="alert" className="flex items-center gap-1.5 text-xs text-danger">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </p>
          )}
        </div>
      </div>
    );
  }
);

CheckboxRow.displayName = "CheckboxRow";
