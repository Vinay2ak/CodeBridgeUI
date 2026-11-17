import React from 'react';
import type { RefreshInterval } from './grafanaUrl';

interface AutoRefreshControlProps {
  value: RefreshInterval;
  onChange: (refresh: RefreshInterval) => void;
  disabled?: boolean;
}

const REFRESH_OPTIONS: { id: RefreshInterval; label: string }[] = [
  { id: 'off', label: 'Off' },
  { id: '30s', label: '30 seconds' },
  { id: '1m', label: '1 minute' },
  { id: '5m', label: '5 minutes' },
];

export const AutoRefreshControl: React.FC<AutoRefreshControlProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor="auto-refresh-select"
        className="text-xs font-medium text-text-muted shrink-0"
      >
        Auto-refresh
      </label>
      <select
        id="auto-refresh-select"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value as RefreshInterval)}
        className="px-2.5 py-1.5 text-xs rounded-lg border border-border bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 cursor-pointer"
      >
        {REFRESH_OPTIONS.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};
