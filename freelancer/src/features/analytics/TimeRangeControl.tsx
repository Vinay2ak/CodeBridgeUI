import React from 'react';
import type { TimeRange } from './grafanaUrl';
import { Select, type SelectOption } from '../../components/ui/Select';

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

const SELECT_RANGE_OPTIONS: SelectOption[] = [
  { value: '1h', label: '1 hour' },
  { value: '6h', label: '6 hours' },
  { value: '24h', label: '24 hours' },
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
];

export const TimeRangeControl: React.FC<TimeRangeControlProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted font-medium">Time:</span>
      {/* Desktop Pill Group */}
      <div
        role="radiogroup"
        aria-label="Time range"
        className="hidden sm:inline-flex items-center rounded-lg border border-line bg-canvas p-0.5"
      >
        {RANGE_OPTIONS.map((opt) => {
          const isSelected = value === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={disabled}
              onClick={() => onChange(opt.id)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                isSelected
                  ? 'bg-surface text-ink font-bold shadow-sm'
                  : 'text-muted hover:text-ink'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Mobile Select dropdown */}
      <div className="sm:hidden w-28">
        <Select
          value={value}
          onChange={(val) => onChange(val as TimeRange)}
          options={SELECT_RANGE_OPTIONS}
          disabled={disabled}
          size="sm"
          aria-label="Time range"
        />
      </div>
    </div>
  );
};
