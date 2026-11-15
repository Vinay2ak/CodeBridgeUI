import { useEffect, useRef } from "react";

export interface StepHeadingProps {
  stepKey: string | number;
  title: string;
  subtitle?: string;
}

export function StepHeading({ stepKey, title, subtitle }: StepHeadingProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, [stepKey]);

  return (
    <div className="space-y-1 mb-6">
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="text-xl font-semibold tracking-tight text-text outline-none"
      >
        {title}
      </h1>
      {subtitle && <p className="text-sm text-text-muted">{subtitle}</p>}
    </div>
  );
}
