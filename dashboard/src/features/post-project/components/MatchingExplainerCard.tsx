import React from 'react';
import { Sparkles, CheckCircle2 } from 'lucide-react';

const CRITERIA = [
  { name: 'Stack match', pts: '30 pts', desc: 'Exact framework and language coverage' },
  { name: 'Specialty match', pts: '20 pts', desc: 'Auth, payments, DB migrations, etc.' },
  { name: 'Skills & libraries', pts: '15 pts', desc: 'Tools, test harnesses, and third-party APIs' },
  { name: 'Budget compatibility', pts: '10 pts', desc: 'Fits within minimum developer engagement rates' },
  { name: 'Urgency & availability', pts: '10 pts', desc: 'Ready for immediate dispatch or flexible' },
  { name: 'Experience & size', pts: '10 pts', desc: 'Bug vs feature vs complex module scope' },
  { name: 'Trust & verified work', pts: '5 pts', desc: 'GitHub verification, pass rate & ratings' },
];

export const MatchingExplainerCard: React.FC = () => {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-xs sticky top-20 space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-primary" />
        <h3 className="text-sm font-bold text-text">How matching works</h3>
      </div>

      <p className="text-xs text-text-muted leading-relaxed">
        CodeBridge scores every vetted engineer across 7 deterministic dimensions to rank the most qualified developers for your project.
      </p>

      <ul className="space-y-3 pt-1 border-t border-border">
        {CRITERIA.map((c) => (
          <li key={c.name} className="space-y-0.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-text flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
                {c.name}
              </span>
              <span className="font-mono text-[11px] text-text-muted bg-surface-raised px-1.5 py-0.5 rounded border border-border">
                {c.pts}
              </span>
            </div>
            <p className="text-[11px] text-text-muted pl-5">{c.desc}</p>
          </li>
        ))}
      </ul>

      <div className="pt-2 border-t border-border text-[11px] text-text-muted">
        <span className="font-semibold text-text">Zero automated assignment:</span> You always review recommendations and approve developer engagement.
      </div>
    </div>
  );
};
