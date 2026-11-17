import React, { useRef } from 'react';
import type { TimeRange } from './grafanaUrl';

interface TimeRangeControlProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
  disabled?: boolean;
}

const RANGE_OPTIONS: { id: TimeRange; label: string }[] = [
  { id: '1h', label: '1 hour' },
  { id: '6h', label: '6 hours' },
  { id: '24h', label: '24 hours' },
  { id: '7d', label: '7 days' },
  { id: '30d', label: '30 days' },
];

export const TimeRangeControl: React.FC<TimeRangeControlProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (disabled) return;
    let nextIndex = -1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      nextIndex = (index + 1) % RANGE_OPTIONS.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      nextIndex = (index - 1 + RANGE_OPTIONS.length) % RANGE_OPTIONS.length;
    }

    if (nextIndex !== -1) {
      const nextOption = RANGE_OPTIONS[nextIndex];
      onChange(nextOption.id);
      const buttons = containerRef.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]');
      buttons?.[nextIndex]?.focus();
    }
  };

  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor="time-range-select"
        className="text-xs font-medium text-text-muted shrink-0"
      >
        Time range
      </label>

      {/* Native select below 640px */}
      <select
        id="time-range-select"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value as TimeRange)}
        className="sm:hidden block px-2.5 py-1.5 text-xs rounded-lg border border-border bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
      >
        {RANGE_OPTIONS.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Segmented radiogroup on 640px and up */}
      <div
        ref={containerRef}
        role="radiogroup"
        aria-label="Time range"
        className={`hidden sm:inline-flex rounded-lg border border-border bg-surface p-0.5 ${
          disabled ? 'opacity-50 pointer-events-none' : ''
        }`}
      >
        {RANGE_OPTIONS.map((opt, idx) => {
          const isSelected = value === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              tabIndex={isSelected ? 0 : -1}
              disabled={disabled}
              onClick={() => onChange(opt.id)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                isSelected
                  ? 'bg-primary text-on-primary font-semibold'
                  : 'text-text-muted hover:text-text hover:bg-surface-raised'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
