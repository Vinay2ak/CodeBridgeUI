import React, { useState } from 'react';
import {
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle2,
  GitBranch,
} from 'lucide-react';
import type { ProjectDetail } from '../../../services/project/types';
import { BLOCKER_TYPES, URGENCY, VERIFICATION_MODES, STACKS, SPECIALTIES } from '../../post-project/options';
import { sizeFromBudget } from '../../post-project/size';
import { StatusChip } from '../../../components/dashboard/StatusChip';

interface ProjectSummaryCardProps {
  project: ProjectDetail;
}

const STACK_MAP = new Map(STACKS.map((s) => [s.value, s.label]));
const SPECIALTY_MAP = new Map(SPECIALTIES.map((s) => [s.value, s.label]));
const BLOCKER_MAP = new Map(BLOCKER_TYPES.map((b) => [b.value, b.label]));
const URGENCY_MAP = new Map(URGENCY.map((u) => [u.value, u.label]));
const VERIFICATION_MAP = new Map(VERIFICATION_MODES.map((v) => [v.value, v.label]));

export const ProjectSummaryCard: React.FC<ProjectSummaryCardProps> = ({ project }) => {
  const [detailsOpen, setDetailsOpen] = useState(false);

  const sizeInfo = sizeFromBudget(project.budget);
  const blockerLabel = BLOCKER_MAP.get(project.blockerType) || project.blockerType;
  const urgencyLabel = URGENCY_MAP.get(project.urgency) || project.urgency;
  const verificationLabel =
    VERIFICATION_MAP.get(project.verificationMode) || project.verificationMode;

  return (
    <div className="rounded-xl border border-border bg-surface shadow-xs p-6 space-y-4">
      {/* Title & Budget Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusChip category="project" status={project.status || 'open'} />
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-surface-raised border border-border font-medium text-text">
              {sizeInfo.label}
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-surface-raised border border-border text-text-muted">
              {blockerLabel}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text">
            {project.title}
          </h1>
        </div>

        {/* Budget */}
        <div className="sm:text-right shrink-0">
          <div className="text-xs text-text-muted">Escrow Budget</div>
          <div className="text-xl font-bold font-mono text-on-money bg-money px-3 py-1 rounded-md inline-block mt-0.5">
            ₹{project.budget.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* Meta Chips Row */}
      <div className="flex items-center gap-4 text-xs text-text-muted pt-2 border-t border-border flex-wrap">
        <span className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-primary" />
          {urgencyLabel}
        </span>
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-success" />
          {verificationLabel}
        </span>
        {project.repoUrl && (
          <a
            href={project.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-primary hover:underline font-mono"
          >
            <GitBranch className="w-3.5 h-3.5" />
            {project.repo || 'GitHub Repository'}
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      {/* Expandable Project Details */}
      <div className="border-t border-border pt-3">
        <button
          type="button"
          onClick={() => setDetailsOpen((prev) => !prev)}
          className="flex items-center justify-between w-full text-xs font-semibold text-text hover:text-primary transition-colors cursor-pointer"
          aria-expanded={detailsOpen}
        >
          <span>{detailsOpen ? 'Hide project details & description' : 'View full project details & scope'}</span>
          {detailsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {detailsOpen && (
          <div className="mt-4 space-y-4 text-xs text-text bg-surface-raised/30 p-4 rounded-lg border border-border animate-in fade-in duration-200">
            <div>
              <h4 className="font-semibold text-text uppercase tracking-wider text-[11px] mb-1 text-text-muted">
                Description & Reproduction Notes
              </h4>
              <p className="text-sm text-text whitespace-pre-line leading-relaxed">
                {project.description}
              </p>
            </div>

            {/* Stacks & Specialties */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <div>
                <span className="font-semibold text-text-muted text-[11px] block mb-1">
                  Primary Stacks:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {project.stacks.map((st) => (
                    <span
                      key={st}
                      className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                    >
                      {STACK_MAP.get(st) || st}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="font-semibold text-text-muted text-[11px] block mb-1">
                  Debugging Specialties:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {project.specialties.map((sp) => (
                    <span
                      key={sp}
                      className="px-2 py-0.5 rounded-md text-xs font-medium bg-surface-raised border border-border text-text"
                    >
                      {SPECIALTY_MAP.get(sp) || sp}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {project.skills.length > 0 && (
              <div>
                <span className="font-semibold text-text-muted text-[11px] block mb-1">
                  Required Skills:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {project.skills.map((sk) => (
                    <span
                      key={sk}
                      className="px-2 py-0.5 rounded text-xs bg-surface border border-border text-text-muted"
                    >
                      {sk}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
