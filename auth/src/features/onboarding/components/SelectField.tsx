import { forwardRef, useId, type SelectHTMLAttributes } from "react";
import { AlertCircle } from "lucide-react";

export type SelectOption = string | { value: string; label: string };

export interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: readonly SelectOption[];
  error?: string;
  hint?: string;
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ label, options, error, hint, id, className = "", ...props }, ref) => {
    const generatedId = useId();
    const selectId = id ?? generatedId;
    const hintId = `${selectId}-hint`;
    const errorId = `${selectId}-error`;

    const describedBy = [hint ? hintId : null, error ? errorId : null]
      .filter(Boolean)
      .join(" ");

    return (
      <div className="flex flex-col gap-1.5 min-w-0">
        <label htmlFor={selectId} className="text-sm font-medium text-text">
          {label}
        </label>
        <select
          ref={ref}
          id={selectId}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={describedBy || undefined}
          className={[
            "w-full rounded-md border bg-bg px-3.5 py-2.5 text-sm text-text",
            "transition-colors duration-fast",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2",
            error
              ? "border-danger focus-visible:outline-danger"
              : "border-border hover:border-text-muted focus:border-primary",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          {...props}
        >
          {options.map((opt) => {
            const optionValue = typeof opt === "string" ? opt : opt.value;
            const optionLabel = typeof opt === "string" ? opt : opt.label;
            return (
              <option key={optionValue} value={optionValue}>
                {optionLabel}
              </option>
            );
          })}
        </select>
        {hint && !error && (
          <p id={hintId} className="text-xs text-text-muted">
            {hint}
          </p>
        )}
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

SelectField.displayName = "SelectField";
