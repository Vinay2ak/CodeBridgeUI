import React from "react";

export interface PanelProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}

export const Panel: React.FC<PanelProps> = ({
  title,
  subtitle,
  actions,
  children,
  className = "",
  bodyClassName = "",
}) => {
  return (
    <section className={`rounded-xl border border-line bg-surface shadow-sm flex flex-col ${className}`}>
      {(title || actions) && (
        <header className="flex items-center justify-between border-b border-line px-4 py-3 shrink-0">
          <div>
            {title && <h2 className="text-base font-semibold text-ink leading-tight">{title}</h2>}
            {subtitle && <p className="text-xs text-muted mt-0.5">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={`p-4 flex-1 ${bodyClassName}`}>{children}</div>
    </section>
  );
};

