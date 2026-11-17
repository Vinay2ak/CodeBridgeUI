import React from 'react';
import type { OptionItem } from '../options';

interface OptionRadioGroupProps {
  label: string;
  name: string;
  options: OptionItem[];
  value: string;
  onChange: (val: string) => void;
  columns?: 1 | 2 | 3;
  error?: string;
}

export const OptionRadioGroup: React.FC<OptionRadioGroupProps> = ({
  label,
  name,
  options,
  value,
  onChange,
  columns = 2,
  error,
}) => {
  const gridColsClass =
    columns === 3
      ? 'grid-cols-1 md:grid-cols-3'
      : columns === 1
      ? 'grid-cols-1'
      : 'grid-cols-1 sm:grid-cols-2';

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-semibold text-text">{label}</legend>
      <div className={`grid gap-3 ${gridColsClass}`} role="radiogroup" aria-label={label}>
        {options.map((opt) => {
          const isSelected = value === opt.value;
          const Icon = opt.icon;
          return (
            <label
              key={opt.value}
              className={`flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer transition-all ${
                isSelected
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                  : 'border-border bg-surface hover:bg-surface-raised/40 hover:border-text-muted/40'
              }`}
            >
              <input
                type="radio"
                name={name}
                value={opt.value}
                checked={isSelected}
                onChange={() => onChange(opt.value)}
                className="mt-0.5 text-primary focus:ring-primary accent-primary"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {Icon && <Icon className="w-4 h-4 text-primary shrink-0" />}
                  <span className="text-sm font-medium text-text leading-tight">{opt.label}</span>
                </div>
                {opt.hint && (
                  <p className="mt-1 text-xs text-text-muted leading-normal">{opt.hint}</p>
                )}
              </div>
            </label>
          );
        })}
      </div>
      {error && <p className="text-xs text-danger font-medium mt-1">{error}</p>}
    </fieldset>
  );
};
