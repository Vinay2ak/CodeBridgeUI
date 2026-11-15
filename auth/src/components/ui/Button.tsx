import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Spinner } from "./Spinner";

export type ButtonVariant = "primary" | "secondary" | "ghost";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
  fullWidth?: boolean;
  children: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-on-primary border border-transparent hover:opacity-90 disabled:opacity-50",
  secondary:
    "bg-surface-raised text-text border border-border hover:border-primary disabled:opacity-50",
  ghost:
    "bg-transparent text-text-muted border border-transparent hover:text-text hover:bg-surface-raised disabled:opacity-50",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      loading = false,
      fullWidth = false,
      disabled,
      className = "",
      type = "button",
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = Boolean(disabled || loading);

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        className={[
          "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold",
          "transition-all duration-fast cursor-pointer disabled:cursor-not-allowed",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2",
          variantClasses[variant],
          fullWidth ? "w-full" : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...props}
      >
        {loading && <Spinner size="sm" />}
        <span>{children}</span>
      </button>
    );
  }
);

Button.displayName = "Button";
