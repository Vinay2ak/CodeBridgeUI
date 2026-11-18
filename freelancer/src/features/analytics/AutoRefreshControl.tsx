import React from 'react';
import type { RefreshInterval } from './grafanaUrl';
import { Select, type SelectOption } from '../../components/ui/Select';

interface AutoRefreshControlProps {
  value: RefreshInterval;
  onChange: (interval: RefreshInterval) => void;
  disabled?: boolean;
}

const REFRESH_OPTIONS: SelectOption[] = [
  { value: 'off', label: 'Off' },
  { value: '30s', label: '30s' },
  { value: '1m', label: '1m' },
  { value: '5m', label: '5m' },
];

export const AutoRefreshControl: React.FC<AutoRefreshControlProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted font-medium">Auto-refresh:</span>
      <div className="w-24">
        <Select
          value={value}
          onChange={(val) => onChange(val as RefreshInterval)}
          options={REFRESH_OPTIONS}
          disabled={disabled}
          size="sm"
          aria-label="Auto-refresh interval"
        />
      </div>
    </div>
  );
};
