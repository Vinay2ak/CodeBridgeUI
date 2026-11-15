import React, { forwardRef } from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'secondary', size = 'md', className = '', children, disabled, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-colors duration-100 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 disabled:pointer-events-none cursor-pointer';

    const sizeStyles = {
      sm: 'px-2.5 py-1 text-xs gap-1.5',
      md: 'px-3.5 py-1.5 text-sm gap-2',
      lg: 'px-4 py-2 text-base gap-2.5',
    }[size];

    const variantStyles = {
      primary: 'bg-primary text-on-primary hover:opacity-90 active:opacity-95 font-semibold',
      secondary: 'bg-surface-raised text-text border border-border hover:bg-border/40',
      outline: 'bg-transparent text-text border border-border hover:bg-surface-raised',
      ghost: 'bg-transparent text-text-muted hover:text-text hover:bg-surface-raised',
      danger: 'bg-danger text-on-primary hover:opacity-90 font-semibold',
    }[variant];

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

