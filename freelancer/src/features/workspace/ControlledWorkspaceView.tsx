import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Server,
  Radio,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  GitBranch,
} from "lucide-react";
import { projectApi } from "../../services/project/api";
import type { ProjectScope } from "../../services/project/types";
import { Button } from "../../components/ui/Button";
import { formatCurrencyINR } from "../../lib/format";

interface ControlledWorkspaceViewProps {
  projectId: string | null;
  projects?: ProjectScope[];
  onSelectProject?: (projectId: string) => void;
  onNavigateToPortfolio: () => void;
  onNavigateToRadar?: () => void;
}

export const ControlledWorkspaceView: React.FC<ControlledWorkspaceViewProps> = ({
  projectId,
  projects: propProjects,
  onSelectProject,
  onNavigateToPortfolio,
  onNavigateToRadar,
}) => {
  void onNavigateToPortfolio;

  // Real backend query for projects list
  const { data: remoteProjects, isLoading: projectsLoading } = useQuery<ProjectScope[]>({
    queryKey: ["projects", "realtime-list"],
    queryFn: () => projectApi.getProjects(),
    staleTime: 30_000,
  });

  const availableProjects =
    propProjects && propProjects.length > 0
      ? propProjects
      : remoteProjects || [];

  // Active project ID resolved only from real projects
  const activeProjectId =
    projectId || availableProjects[0]?.id || null;

  // Real-time project query for the active project
  const { data: projectDetails, isLoading: projectLoading } = useQuery<ProjectScope | null>({
    queryKey: ["project", activeProjectId],
    queryFn: async () => {
      if (!activeProjectId) return null;
      try {
        return await projectApi.getProject(activeProjectId);
      } catch {
        return availableProjects.find((p) => p.id === activeProjectId) || null;
      }
    },
    enabled: !!activeProjectId,
    staleTime: 15_000,
  });

  const activeProject =
    projectDetails || availableProjects.find((p) => p.id === activeProjectId) || null;

  // Loading state
  if (projectsLoading || (activeProjectId && projectLoading && !activeProject)) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-canvas text-ink">
        <div className="max-w-md w-full p-8 rounded-2xl border border-line bg-surface text-center space-y-4">
          <div className="h-10 w-10 rounded-xl bg-canvas border border-line flex items-center justify-center mx-auto text-primary animate-pulse">
            <Server className="h-5 w-5" aria-hidden="true" />
          </div>
          <p className="text-sm text-muted">Loading real-time workspace details...</p>
        </div>
      </div>
    );
  }

  // Clean empty state if no real task is currently active/selected
  if (!activeProject) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 bg-canvas text-ink">
        <div className="max-w-md w-full p-8 rounded-2xl border border-line bg-surface text-center space-y-4 shadow-sm">
          <div className="h-14 w-14 rounded-2xl bg-canvas border border-line flex items-center justify-center mx-auto text-primary">
            <Server className="h-7 w-7" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-ink">No Active Task in Workspace</h2>
            <p className="text-xs sm:text-sm text-muted leading-relaxed">
              Accept a task from the Tasks Radar to load real-time project specifications and launch your workspace.
            </p>
          </div>
          <Button
            variant="primary"
            onClick={onNavigateToRadar}
            className="w-full justify-center"
          >
            <Radio className="h-4 w-4 mr-1.5" aria-hidden="true" />
            <span>Browse Available Tasks</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-canvas p-4 sm:p-6 lg:p-8 space-y-6 text-ink">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Navigation Breadcrumb & Header */}
        <div className="space-y-3 pb-4 border-b border-line">
          <div className="flex items-center gap-2 text-xs text-muted">
            <button
              type="button"
              onClick={onNavigateToRadar}
              className="hover:text-primary transition-colors flex items-center gap-1 font-medium"
            >
              <Radio className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Tasks</span>
            </button>
            <ChevronRight className="h-3 w-3 text-line" />
            <span className="font-mono text-ink font-semibold">{activeProject.id}</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-ink">
                {activeProject.title}
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                <span className="font-medium text-ink">
                  {activeProject.ownerName || "CodeBridge Client"}
                </span>
                <span>•</span>
                <span className="font-mono text-[11px] bg-surface px-2 py-0.5 rounded border border-line">
                  {activeProject.id}
                </span>

                {availableProjects.length > 1 && (
                  <div className="flex items-center gap-1.5 ml-2">
                    <span className="text-[11px] text-muted">Switch Task:</span>
                    <select
                      value={activeProject.id}
                      onChange={(e) => onSelectProject?.(e.target.value)}
                      className="text-xs rounded-lg border border-line bg-surface px-2 py-1 text-ink font-medium focus:ring-1 focus:ring-primary focus:outline-none"
                    >
                      {availableProjects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title.slice(0, 40)} ({p.id})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Escrow and Project State Badges */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {activeProject.budget > 0 && (
                <div className="px-3 py-1 rounded-lg text-xs font-semibold bg-success-bg text-success border border-success-border flex items-center gap-1.5 shadow-sm">
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                  <span>{formatCurrencyINR(activeProject.budget)} HELD IN ESCROW</span>
                </div>
              )}
              <div className="px-3 py-1 rounded-lg text-xs font-semibold bg-surface text-primary border border-line flex items-center gap-1.5 uppercase tracking-wide">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{activeProject.projectState.replace(/_/g, " ")}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Real-Time Project Scope Card */}
        <div className="rounded-2xl border border-line bg-surface p-6 space-y-6 shadow-sm">
          <div className="space-y-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted">
              Project Specification
            </h2>
            <p className="text-sm text-ink leading-relaxed whitespace-pre-line">
              {activeProject.description || "No description provided for this task."}
            </p>
          </div>

          {activeProject.expectedResult && (
            <div className="space-y-2 pt-4 border-t border-line">
              <h3 className="text-sm font-semibold text-ink">
                Expected Deliverable & Acceptance Scope
              </h3>
              <div className="p-3.5 rounded-xl bg-canvas border border-line text-sm text-ink leading-relaxed">
                {activeProject.expectedResult}
              </div>
            </div>
          )}

          {activeProject.skills && activeProject.skills.length > 0 && (
            <div className="space-y-2 pt-4 border-t border-line">
              <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">
                Required Tech Stack
              </h3>
              <div className="flex flex-wrap gap-2">
                {activeProject.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-2.5 py-1 rounded-lg text-xs font-mono font-medium bg-canvas border border-line text-ink"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {activeProject.github?.repoName && (
            <div className="space-y-2 pt-4 border-t border-line">
              <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">
                Repository Information
              </h3>
              <div className="p-3.5 rounded-xl bg-canvas border border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <GitBranch className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
                  <span className="font-mono text-ink font-semibold">
                    {activeProject.github.repoName}
                  </span>
                  <span className="text-muted">
                    ({activeProject.github.defaultBranch || "main"})
                  </span>
                </div>
                <span className="text-muted text-[11px]">
                  Read-only access configured for task development
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
