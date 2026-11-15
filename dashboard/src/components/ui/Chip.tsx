import React from 'react';

export interface ChipProps {
  icon?: React.ReactNode;
  label: React.ReactNode;
  tone?: 'neutral' | 'primary' | 'money' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md';
  className?: string;
}

export const Chip: React.FC<ChipProps> = ({
  icon,
  label,
  tone = 'neutral',
  size = 'md',
  className = '',
}) => {
  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
  }[size];

  const toneStyles = {
    neutral: 'bg-surface-raised text-text-muted border border-border',
    primary: 'bg-primary/15 text-primary border border-primary/30',
    // Rule: never white text on amber. Amber uses --on-money text (#0B132B).
    money: 'bg-money text-on-money font-semibold border border-money',
    success: 'bg-success/15 text-success border border-success/30',
    warning: 'bg-warning/15 text-warning border border-warning/30',
    danger: 'bg-danger/15 text-danger border border-danger/30',
  }[tone];

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${sizeStyles} ${toneStyles} ${className}`}
    >
      {icon && <span className="flex-shrink-0 [&>svg]:w-3.5 [&>svg]:h-3.5">{icon}</span>}
      <span>{label}</span>
    </span>
  );
};

