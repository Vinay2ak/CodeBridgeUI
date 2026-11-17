import React from 'react';
import type { OptionItem } from '../options';

interface PillMultiSelectProps {
  label: string;
  options: OptionItem[];
  values: string[];
  onChange: (vals: string[]) => void;
  max: number;
  min?: number;
  error?: string;
  helperText?: string;
}

export const PillMultiSelect: React.FC<PillMultiSelectProps> = ({
  label,
  options,
  values,
  onChange,
  max,
  min = 0,
  error,
  helperText,
}) => {
  const toggleValue = (val: string) => {
    if (values.includes(val)) {
      onChange(values.filter((v) => v !== val));
    } else {
      if (values.length < max) {
        onChange([...values, val]);
      }
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-text">
          {label}{' '}
          <span className="text-xs font-normal text-text-muted">
            ({values.length}/{max}{min > 0 ? `, min ${min}` : ''})
          </span>
        </label>
        {helperText && <span className="text-xs text-text-muted">{helperText}</span>}
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
        {options.map((opt) => {
          const isSelected = values.includes(opt.value);
          const isDisabled = !isSelected && values.length >= max;

          return (
            <button
              key={opt.value}
              type="button"
              disabled={isDisabled}
              onClick={() => toggleValue(opt.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                isSelected
                  ? 'bg-primary text-on-primary border-primary shadow-xs'
                  : 'bg-surface text-text border-border hover:bg-surface-raised hover:border-text-muted/40'
              }`}
              aria-pressed={isSelected}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {error && <p className="text-xs text-danger font-medium mt-1">{error}</p>}
    </div>
  );
};
