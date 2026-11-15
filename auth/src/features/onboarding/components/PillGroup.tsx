import { useId } from "react";
import { AlertCircle } from "lucide-react";

export interface PillOption {
  value: string;
  label: string;
  hint?: string;
}

export interface PillGroupProps {
  legend: string;
  options: readonly PillOption[];
  value: string[];
  onChange: (next: string[]) => void;
  hint?: string;
  error?: string;
  min?: number;
  max?: number;
}

export function PillGroup({
  legend,
  options,
  value,
  onChange,
  hint,
  error,
  min,
  max,
}: PillGroupProps) {
  const baseId = useId();
  const hintId = `${baseId}-hint`;
  const errorId = `${baseId}-error`;

  const describedBy = [hint ? hintId : null, error ? errorId : null]
    .filter(Boolean)
    .join(" ");

  const toggle = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((item) => item !== optionValue));
      return;
    }
    if (max !== undefined && value.length >= max) {
      return;
    }
    onChange([...value, optionValue]);
  };

  const countHint =
    min !== undefined && max !== undefined
      ? `Select ${min}–${max}`
      : min !== undefined
        ? `Select at least ${min}`
        : max !== undefined
          ? `Select up to ${max}`
          : null;

  return (
    <fieldset
      aria-describedby={describedBy || undefined}
      aria-invalid={Boolean(error) || undefined}
      className="flex flex-col gap-2 min-w-0"
    >
      <div className="flex items-baseline justify-between gap-2">
        <legend className="text-sm font-medium text-text">{legend}</legend>
        {countHint && (
          <span className="text-xs text-text-muted shrink-0">
            {value.length}
            {max !== undefined ? `/${max}` : ""} · {countHint}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = value.includes(option.value);
          const atMax = max !== undefined && !selected && value.length >= max;

          return (
            <label
              key={option.value}
              title={option.hint}
              className={[
                "inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-medium transition-colors duration-fast",
                atMax ? "cursor-not-allowed opacity-50" : "cursor-pointer",
                selected
                  ? "border-primary bg-primary/15 text-text"
                  : "border-border bg-bg text-text-muted hover:border-text-muted",
                "has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary has-[:focus-visible]:outline-offset-2",
              ].join(" ")}
            >
              <input
                type="checkbox"
                checked={selected}
                disabled={atMax}
                onChange={() => toggle(option.value)}
                className="sr-only peer"
              />
              <span className="peer-focus-visible:underline">{option.label}</span>
            </label>
          );
        })}
      </div>

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
    </fieldset>
  );
}
