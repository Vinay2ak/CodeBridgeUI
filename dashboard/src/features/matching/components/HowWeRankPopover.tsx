import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, X } from 'lucide-react';

const SCORING_ITEMS = [
  { label: 'Stack coverage', max: 30, desc: 'Exact framework match (FastAPI, React, etc.)' },
  { label: 'Specialty match', max: 20, desc: 'Target problem type & debugging area overlap' },
  { label: 'Skills & tools', max: 15, desc: 'Specific libraries, test suites, and APIs' },
  { label: 'Budget fit', max: 10, desc: 'Fits within engineer engagement threshold' },
  { label: 'Availability', max: 10, desc: 'Turnaround timeline compatibility' },
  { label: 'Experience scope', max: 10, desc: 'Seniority calibrated to project module complexity' },
  { label: 'Trust & ratings', max: 5, desc: 'GitHub verification, completed fixes & rating' },
];

export const HowWeRankPopover: React.FC = () => {
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [open]);

  return (
    <div className="relative inline-block" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text cursor-pointer px-2 py-1 rounded-md hover:bg-surface-raised transition-colors"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <HelpCircle className="w-3.5 h-3.5 text-primary" />
        How we rank developers
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="How developers are ranked"
          className="absolute right-0 top-full mt-2 w-80 sm:w-96 p-4 rounded-xl border border-border bg-surface shadow-xl z-30 text-text space-y-3"
        >
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <h4 className="text-sm font-bold text-text">Matching Algorithm (100 Pts)</h4>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-1 rounded text-text-muted hover:text-text"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-text-muted leading-relaxed">
            Every candidate is ranked deterministically by the Talent service based on these dimensions:
          </p>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {SCORING_ITEMS.map((item) => (
              <div key={item.label} className="flex items-start justify-between gap-2 text-xs">
                <div>
                  <span className="font-semibold text-text">{item.label}</span>
                  <p className="text-[11px] text-text-muted">{item.desc}</p>
                </div>
                <span className="font-mono text-[11px] text-text-muted bg-surface-raised px-1.5 py-0.5 rounded border border-border shrink-0">
                  {item.max} pts
                </span>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-border text-[11px] text-text-muted">
            <span className="font-semibold text-text">Labels:</span> 80+ Excellent, 65+ Strong, 50+ Good, &lt;50 Partial.
          </div>
        </div>
      )}
    </div>
  );
};
