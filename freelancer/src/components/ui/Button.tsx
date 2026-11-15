import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className = "", children, ...props }, ref) => {
    let sizeClasses = "h-10 px-4 text-sm";
    if (size === "sm") sizeClasses = "h-8 px-3 text-xs";
    if (size === "lg") sizeClasses = "h-12 px-6 text-base";

    let variantClasses = "";
    switch (variant) {
      case "primary":
        variantClasses =
          "bg-primary text-on-primary hover:bg-primary-hover active:bg-primary-active disabled:bg-raised disabled:text-muted disabled:cursor-not-allowed";
        break;
      case "secondary":
        variantClasses =
          "border border-line-strong text-ink hover:bg-raised active:bg-surface disabled:text-muted disabled:cursor-not-allowed";
        break;
      case "ghost":
        variantClasses = "text-ink hover:bg-raised active:bg-surface disabled:text-muted disabled:cursor-not-allowed";
        break;
      case "danger":
        variantClasses =
          "bg-danger text-on-danger hover:opacity-90 active:opacity-100 disabled:bg-raised disabled:text-muted disabled:cursor-not-allowed";
        break;
    }

    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${sizeClasses} ${variantClasses} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

