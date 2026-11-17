import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronRight,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Check,
  CheckCircle2,
} from "lucide-react";
import { projectApi } from "../../services/project/api";
import { workspaceApi } from "../../services/workspace/api";
import { paymentApi } from "../../services/payment/api";
import { profileApi } from "../../services/profile/api";
import type { ProjectScope } from "../../services/project/types";
import { formatCurrencyINR } from "../../lib/format";

interface TaskRadarViewProps {
  onOpenWorkspace: (projectId: string) => void;
  selectedTaskId?: string;
}

// Payment mode constant driving payment copy
const PAYMENT_MODE: "simulated" | "live" = "simulated";

type EscrowStepKey = "authorized" | "held" | "release_pending" | "released";

interface EscrowStep {
  key: EscrowStepKey;
  label: string;
}

const ESCROW_STEPS: EscrowStep[] = [
  { key: "authorized", label: "Authorized" },
  { key: "held", label: "Held" },
  { key: "release_pending", label: "Release pending" },
  { key: "released", label: "Released" },
];

export const TaskRadarView: React.FC<TaskRadarViewProps> = ({
  onOpenWorkspace,
  selectedTaskId,
}) => {
  const [taskAccepted, setTaskAccepted] = useState<boolean>(false);
  const [taskDeclined, setTaskDeclined] = useState<boolean>(false);
  const [liveAnnouncement, setLiveAnnouncement] = useState<string>("");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    selectedTaskId || null
  );

  useEffect(() => {
    if (selectedTaskId) {
      setSelectedProjectId(selectedTaskId);
    }
  }, [selectedTaskId]);

  // Fetch logged-in freelancer profile skills for personalized tech stack matching
  const { data: userSkills = [] } = useQuery<string[]>({
    queryKey: ["freelancer", "skills"],
    queryFn: () => profileApi.getFreelancerSkills(),
    staleTime: 60_000,
  });

  // Real backend query for tasks / projects list
  const {
    data: projects,
    isLoading: projectsLoading,
    isError: projectsError,
    error: projectErrorDetails,
    refetch: refetchProjects,
  } = useQuery({
    queryKey: ["projects", "realtime-list"],
    queryFn: async () => {
      return await projectApi.getProjects();
    },
    staleTime: 30_000,
    retry: 1,
  });

  // Helper to compute tech stack matching
  const computeSkillMatch = (project: ProjectScope, skills: string[]) => {
    if (!skills || skills.length === 0) {
      return { matched: true, matchedSkills: [] as string[], matchPercentage: 100 };
    }
    const pSkills = project.skills || [];
    if (pSkills.length === 0) {
      return { matched: true, matchedSkills: [] as string[], matchPercentage: 100 };
    }
    const matched = pSkills.filter((ps) =>
      skills.some((us) => us.trim().toLowerCase() === ps.trim().toLowerCase())
    );
    const percentage = Math.round((matched.length / pSkills.length) * 100);
    return {
      matched: matched.length > 0,
      matchedSkills: matched,
      matchPercentage: percentage,
    };
  };

  // Prioritize projects that match the freelancer's profile skills
  const sortedProjects = React.useMemo(() => {
    if (!projects || projects.length === 0) return [];
    if (userSkills.length === 0) return projects;
    return [...projects].sort((a, b) => {
      const matchA = computeSkillMatch(a, userSkills).matchedSkills.length;
      const matchB = computeSkillMatch(b, userSkills).matchedSkills.length;
      return matchB - matchA;
    });
  }, [projects, userSkills]);

  const activeProject: ProjectScope | undefined =
    sortedProjects.find((p) => p.id === selectedProjectId) ||
    sortedProjects[0] ||
    projects?.find((p) => p.id === selectedTaskId) ||
    projects?.[0];

  const currentMatch = activeProject
    ? computeSkillMatch(activeProject, userSkills)
    : { matched: false, matchedSkills: [] as string[], matchPercentage: 0 };

  // Real-time task specification query from /api/v1/tasks/{id}
  const {
    data: taskDetails,
    isLoading: taskLoading,
  } = useQuery({
    queryKey: ["task", activeProject?.id],
    queryFn: async () => {
      if (!activeProject?.id) return null;
      try {
        return await workspaceApi.getTask(activeProject.id);
      } catch {
        return null;
      }
    },
    enabled: !!activeProject?.id,
    staleTime: 30_000,
  });

  // Real-time escrow payment query from /api/v1/payment/escrow/{id}
  const {
    data: escrowData,
  } = useQuery({
    queryKey: ["escrow", activeProject?.id],
    queryFn: async () => {
      if (!activeProject?.id) return null;
      try {
        return await paymentApi.getEscrow(activeProject.id);
      } catch {
        return null;
      }
    },
    enabled: !!activeProject?.id,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (activeProject && activeProject.projectState === "in_progress") {
      setTaskAccepted(true);
    }
  }, [activeProject]);

  const announce = (msg: string) => {
    setLiveAnnouncement(msg);
    setTimeout(() => setLiveAnnouncement(""), 3000);
  };

  const handleAccept = () => {
    setTaskAccepted(true);
    setTaskDeclined(false);
    announce("Task accepted. Workspace is ready to launch.");
  };

  const handleDecline = () => {
    setTaskDeclined(true);
    setTaskAccepted(false);
    announce("Task declined.");
  };

  const handleReconsider = () => {
    setTaskDeclined(false);
    announce("Task available to accept.");
  };

  // Compute a deadline date relative to today from the real backend deadline
  const getDisplayDeadline = (deadlineStr?: string) => {
    if (!deadlineStr) {
      return {
        formattedDate: "Open deadline",
        relativeText: "no due date",
        isOverdue: false,
      };
    }

    const d = new Date(deadlineStr);
    const isValid = !isNaN(d.getTime());
    if (!isValid) {
      return {
        formattedDate: deadlineStr,
        relativeText: "",
        isOverdue: false,
      };
    }

    const formattedDate = d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    const now = Date.now();
    const diffMs = d.getTime() - now;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        formattedDate,
        relativeText: `overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? "" : "s"}`,
        isOverdue: true,
      };
    }

    return {
      formattedDate,
      relativeText: diffDays === 0 ? "due today" : `in ${diffDays} day${diffDays === 1 ? "" : "s"}`,
      isOverdue: false,
    };
  };

  // Loading skeleton state
  if (projectsLoading || (activeProject && taskLoading && !taskDetails)) {
    return (
      <div
        className="flex-1 overflow-y-auto bg-canvas p-6 lg:p-10"
        role="status"
        aria-label="Loading task details"
      >
        <div className="max-w-[1120px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-12">
          <div className="space-y-8 max-w-[720px]">
            <div className="h-4 w-32 bg-surface rounded animate-pulse" />
            <div className="h-9 w-3/4 bg-surface rounded animate-pulse" />
            <div className="h-px bg-line" />
            <div className="space-y-3">
              <div className="h-5 w-28 bg-surface rounded animate-pulse" />
              <div className="h-4 w-full bg-surface rounded animate-pulse" />
              <div className="h-4 w-5/6 bg-surface rounded animate-pulse" />
            </div>
            <div className="h-px bg-line" />
            <div className="space-y-3">
              <div className="h-5 w-28 bg-surface rounded animate-pulse" />
              <div className="h-4 w-full bg-surface rounded animate-pulse" />
              <div className="h-4 w-4/5 bg-surface rounded animate-pulse" />
            </div>
          </div>
          <div className="h-96 border border-line rounded-md bg-surface p-5 space-y-6">
            <div className="h-8 w-32 bg-canvas rounded animate-pulse" />
            <div className="h-24 bg-canvas rounded animate-pulse" />
            <div className="h-10 bg-canvas rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // Error state with retry
  if (projectsError) {
    return (
      <div className="flex-1 flex items-center justify-center bg-canvas p-6 text-center">
        <div className="max-w-md w-full border border-line rounded-md bg-surface p-6 space-y-4">
          <div className="flex justify-center">
            <AlertCircle className="h-6 w-6 text-danger" aria-hidden="true" />
          </div>
          <h2 className="text-base font-semibold text-ink">
            Unable to load real-time tasks from backend
          </h2>
          <p className="text-sm text-muted">
            {projectErrorDetails instanceof Error
              ? projectErrorDetails.message
              : "The CodeBridge API Gateway (/api/v1/projects) returned an error or is unreachable."}
          </p>
          <button
            type="button"
            onClick={() => refetchProjects()}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-on-primary bg-primary rounded-md hover:opacity-95 transition-opacity"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            <span>Retry Connection</span>
          </button>
        </div>
      </div>
    );
  }

  // Empty state if backend returns 0 projects
  if (!activeProject) {
    return (
      <div className="flex-1 flex items-center justify-center bg-canvas p-6 text-center">
        <div className="max-w-md w-full border border-line rounded-md bg-surface p-6 space-y-4">
          <h2 className="text-base font-semibold text-ink">No tasks available</h2>
          <p className="text-sm text-muted">
            There are currently no open tasks or assigned projects on the backend gateway.
          </p>
          <button
            type="button"
            onClick={() => refetchProjects()}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-on-primary bg-primary rounded-md hover:opacity-95 transition-opacity"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            <span>Refresh</span>
          </button>
        </div>
      </div>
    );
  }

  const taskId = activeProject.id;
  const taskTitle = activeProject.title;
  const problemText = activeProject.description;
  const expectedOutcome = activeProject.expectedResult;
  const skillsList =
    taskDetails?.stack && taskDetails.stack.length > 0
      ? taskDetails.stack
      : activeProject.skills || [];
  const repoName =
    taskDetails?.repo?.name ||
    activeProject.github?.repoName ||
    "codebridge/payments-service";
  const commitHash =
    taskDetails?.repo?.commit ||
    activeProject.github?.commitHash ||
    "c4b2a8f";

  // Dynamic acceptance criteria from real backend task or expectedResult
  const criteriaList: string[] =
    taskDetails?.criteria && taskDetails.criteria.length > 0
      ? taskDetails.criteria.map((c) => c.text)
      : expectedOutcome
        ? [expectedOutcome]
        : [];

  const { formattedDate, relativeText, isOverdue } = getDisplayDeadline(activeProject.deadline);

  // Escrow state from real payment service or project record
  const currentEscrowState: EscrowStepKey =
    escrowData?.state === "held" || activeProject.escrowState === "held"
      ? "held"
      : escrowData?.state === "authorized" || activeProject.escrowState === "authorized"
        ? "authorized"
        : escrowData?.state === "released" || activeProject.escrowState === "released"
          ? "released"
          : "held";

  const budgetAmount = escrowData?.amount || activeProject.budget || 0;

  return (
    <div className="flex-1 overflow-y-auto bg-canvas">
      {/* Screen-reader live region */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {liveAnnouncement}
      </div>

      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
        {/* Main 2-column layout (fluid main + sticky sidebar) */}
        <div className="flex flex-col lg:flex-row items-start gap-8 lg:gap-12">
          {/* Main Task Note Box (fluid, max 720px) */}
          <main className="w-full lg:max-w-[720px] flex-1 order-2 lg:order-1">
            <div className="rounded-2xl border border-line bg-surface p-6 sm:p-8 shadow-sm space-y-6">
              {/* Note Header Bar: Breadcrumb + Skill Match Pill */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-line">
                <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted">
                  {/* TODO(route): link to all tasks list view */}
                  <a
                    href="#tasks"
                    className="hover:text-ink transition-colors"
                    onClick={(e) => {
                      e.preventDefault();
                    }}
                  >
                    Tasks
                  </a>
                  <ChevronRight className="h-3 w-3 text-muted shrink-0" aria-hidden="true" />
                  <span className="font-mono text-ink font-semibold">{taskId}</span>
                </nav>

                {/* Tech Stack Match Badge */}
                {currentMatch.matchedSkills.length > 0 ? (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-success-bg text-success border border-success-border">
                    <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{currentMatch.matchPercentage}% Tech Stack Match</span>
                  </div>
                ) : userSkills.length > 0 ? (
                  <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-raised text-muted border border-line">
                    <span>Available Scope</span>
                  </div>
                ) : null}
              </div>

              {/* Multi-Task Switcher Pill Strip (if multiple projects exist) */}
              {sortedProjects.length > 1 && (
                <div className="flex flex-wrap items-center gap-2 pb-1">
                  <span className="text-[11px] font-mono text-muted uppercase tracking-wider font-semibold">
                    Matching Tasks ({sortedProjects.length}):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {sortedProjects.map((p) => {
                      const isSelected = p.id === activeProject.id;
                      const pMatch = computeSkillMatch(p, userSkills);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setSelectedProjectId(p.id)}
                          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                            isSelected
                              ? "bg-primary text-on-primary font-bold shadow-xs"
                              : "bg-canvas border border-line text-muted hover:text-ink"
                          }`}
                        >
                          {pMatch.matched && userSkills.length > 0 && (
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                isSelected ? "bg-on-primary" : "bg-success"
                              }`}
                            />
                          )}
                          <span className="truncate max-w-[140px]">{p.title}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Personalized Profile Match Recommendation Note */}
              {currentMatch.matchedSkills.length > 0 && (
                <div className="p-3.5 rounded-xl bg-info-bg/40 border border-info-border text-xs text-primary flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-primary" aria-hidden="true" />
                  <div className="space-y-0.5">
                    <p className="font-semibold text-ink">
                      Tailored to your developer tech stack
                    </p>
                    <p className="text-muted leading-relaxed">
                      This task requires <strong>{currentMatch.matchedSkills.join(", ")}</strong>, matching your verified freelancer skills.
                    </p>
                  </div>
                </div>
              )}

              {/* H1: Task Title in Sentence Case, without ID */}
              <div>
                <h1 className="text-[26px] sm:text-[28px] leading-[34px] font-bold text-ink text-left">
                  {taskTitle}
                </h1>
                <p className="text-xs text-muted mt-1">
                  Posted by <span className="font-medium text-ink">{activeProject.ownerName}</span>
                </p>
              </div>

              {/* 1px Divider */}
              <div className="h-px bg-line" aria-hidden="true" />

              {/* What is broken */}
              <section aria-labelledby="heading-broken" className="space-y-2.5">
                <h2 id="heading-broken" className="text-base font-semibold text-ink flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-warning" aria-hidden="true" />
                  <span>What is broken</span>
                </h2>
                <div className="p-3.5 rounded-xl bg-canvas border border-line/60">
                  <p className="text-sm leading-[22px] text-ink max-w-[68ch] whitespace-pre-line font-mono text-xs sm:text-sm">
                    {problemText}
                  </p>
                </div>
              </section>

              {/* 1px Divider */}
              <div className="h-px bg-line" aria-hidden="true" />

              {/* What the owner expects */}
              <section aria-labelledby="heading-expects" className="space-y-2.5">
                <h2 id="heading-expects" className="text-base font-semibold text-ink flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" />
                  <span>What the owner expects</span>
                </h2>
                <div className="p-3.5 rounded-xl bg-canvas border border-line/60">
                  <p className="text-sm leading-[22px] text-ink max-w-[68ch] whitespace-pre-line">
                    {expectedOutcome}
                  </p>
                </div>
              </section>

              {/* 1px Divider */}
              <div className="h-px bg-line" aria-hidden="true" />

              {/* Done when (Acceptance criteria) */}
              <section aria-labelledby="heading-criteria" className="space-y-2.5">
                <h2 id="heading-criteria" className="text-base font-semibold text-ink">
                  Done when
                </h2>
                {criteriaList.length > 0 ? (
                  <ol className="space-y-2 list-decimal list-inside text-sm leading-[22px] text-ink p-3.5 rounded-xl bg-canvas border border-line/60">
                    {criteriaList.map((item, idx) => (
                      <li key={idx} className="pl-1">
                        <span>{item}</span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-sm text-muted">No criteria specified.</p>
                )}
              </section>

              {/* 1px Divider */}
              <div className="h-px bg-line" aria-hidden="true" />

              {/* Stack */}
              <section aria-labelledby="heading-stack" className="space-y-2.5">
                <h2 id="heading-stack" className="text-base font-semibold text-ink">
                  Stack
                </h2>
                <div className="flex flex-wrap items-center gap-2">
                  {skillsList.map((skill) => {
                    const isMatchedSkill = userSkills.some(
                      (us) => us.trim().toLowerCase() === skill.trim().toLowerCase()
                    );
                    return (
                      <span
                        key={skill}
                        className={`px-3 py-1 rounded-lg text-xs font-mono font-medium border flex items-center gap-1.5 ${
                          isMatchedSkill
                            ? "bg-success-bg text-success border-success-border font-bold"
                            : "bg-canvas text-ink border-line"
                        }`}
                      >
                        {isMatchedSkill && <Check className="h-3 w-3" aria-hidden="true" />}
                        <span>{skill}</span>
                        {isMatchedSkill && (
                          <span className="text-[10px] opacity-75 font-sans">(Matched)</span>
                        )}
                      </span>
                    );
                  })}
                </div>
                {/* Accessible text version for test runner and screen readers */}
                <p className="sr-only">{skillsList.join(", ")}</p>
              </section>
            </div>
          </main>

          {/* Sticky Sidebar: ONLY boxed surface (1px border, 6px radius, 20px padding) */}
          <aside
            aria-label="Task acceptance details"
            className="w-full lg:w-[320px] shrink-0 border border-line rounded-md p-5 bg-surface lg:sticky lg:top-6 space-y-5 order-1 lg:order-2"
          >
            {/* Amount & Fixed price */}
            <div>
              <div className="text-[32px] font-semibold text-ink leading-tight tabular-nums">
                {formatCurrencyINR(budgetAmount)}
              </div>
              <div className="text-xs text-muted mt-0.5">Fixed price</div>
            </div>

            {/* Payment state list (compact vertical list of 4 states) */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-ink">Payment held</span>
                {PAYMENT_MODE === "simulated" && (
                  <span className="text-xs text-muted">Simulated payment - demo only</span>
                )}
              </div>

              <div
                className="space-y-2 text-xs"
                role="list"
                aria-label="Payment lifecycle stages"
              >
                {ESCROW_STEPS.map((step) => {
                  const isCurrent = step.key === currentEscrowState;
                  return (
                    <div
                      key={step.key}
                      role="listitem"
                      className="flex items-center gap-2"
                    >
                      {isCurrent ? (
                        <span
                          className="h-2 w-2 rounded-full bg-ok shrink-0 inline-block"
                          aria-hidden="true"
                        />
                      ) : (
                        <span
                          className="h-2 w-2 rounded-full border border-line shrink-0 inline-block"
                          aria-hidden="true"
                        />
                      )}
                      <span
                        className={
                          isCurrent
                            ? "font-semibold text-ink"
                            : "text-muted"
                        }
                      >
                        {step.label}
                      </span>
                      {isCurrent && (
                        <span className="sr-only">(current status)</span>
                      )}
                    </div>
                  );
                })}
              </div>

              <p className="text-xs text-muted leading-normal">
                Released after your tests pass and the owner approves.
              </p>
            </div>

            {/* Actions: Accept / Decline / Ask question OR Open workspace */}
            <div className="space-y-2 pt-1">
              {taskDeclined ? (
                <div className="space-y-2">
                  <div className="text-xs text-muted p-2 rounded bg-canvas border border-line">
                    You have declined this task.
                  </div>
                  <button
                    type="button"
                    onClick={handleReconsider}
                    className="w-full text-xs text-primary hover:underline py-1 font-medium text-left"
                  >
                    Reconsider this task
                  </button>
                </div>
              ) : taskAccepted ? (
                <button
                  type="button"
                  onClick={() => onOpenWorkspace(taskId)}
                  className="w-full px-4 py-2.5 text-sm font-semibold text-on-primary bg-primary rounded-md hover:opacity-95 transition-opacity text-center shadow-none"
                >
                  Open workspace
                </button>
              ) : (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleAccept}
                    className="w-full px-4 py-2.5 text-sm font-semibold text-on-primary bg-primary rounded-md hover:opacity-95 transition-opacity text-center shadow-none"
                  >
                    Accept task
                  </button>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={handleDecline}
                      className="text-xs text-muted hover:text-ink transition-colors"
                    >
                      Decline
                    </button>

                    {/* TODO(backend): owner messaging feature */}
                    <a
                      href="#ask-owner"
                      onClick={(e) => {
                        e.preventDefault();
                        announce("Owner messaging is not yet connected to the backend.");
                      }}
                      className="text-xs text-primary hover:underline"
                    >
                      Ask the owner a question
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* 1px Divider */}
            <div className="h-px bg-line" aria-hidden="true" />

            {/* Details list in definition-list style */}
            <dl className="space-y-2.5 text-xs">
              <div className="flex items-baseline justify-between gap-2">
                <dt className="text-muted shrink-0">Deadline</dt>
                <dd className="text-right">
                  <span className="text-ink">{formattedDate}</span>{" "}
                  {isOverdue ? (
                    <span className="text-danger font-semibold">({relativeText})</span>
                  ) : (
                    <span className="text-muted">({relativeText})</span>
                  )}
                </dd>
              </div>

              <div className="flex items-baseline justify-between gap-2">
                <dt className="text-muted shrink-0">Task ID</dt>
                <dd className="font-mono text-ink text-right">{taskId}</dd>
              </div>

              <div className="flex flex-col gap-0.5">
                <dt className="text-muted">Repository</dt>
                <dd className="text-ink">
                  <div>{repoName}</div>
                  <div className="font-mono text-muted text-[11px]">{commitHash}</div>
                  <div className="text-muted text-[11px] mt-0.5">
                    Read-only. Opens in your workspace after you accept.
                  </div>
                </dd>
              </div>

              <div className="flex items-baseline justify-between gap-2">
                <dt className="text-muted shrink-0">Status</dt>
                <dd className="text-ink font-medium capitalize">
                  {taskAccepted
                    ? "In progress"
                    : taskDeclined
                      ? "Declined"
                      : "Available"}
                </dd>
              </div>

              {/* TODO(backend): owner rating */}
              {/* TODO(backend): estimated hours */}
              {/* TODO(backend): payout after fee */}
            </dl>
          </aside>
        </div>
      </div>

      {/* Mobile Sticky Bottom Bar (<= 640px) */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 p-3.5 border-t border-line bg-surface flex items-center justify-between z-40 pb-[max(0.875rem,env(safe-area-inset-bottom))] shadow-none">
        <div>
          <div className="text-lg font-semibold text-ink leading-tight tabular-nums">
            {formatCurrencyINR(budgetAmount)}
          </div>
          <div className="text-[11px] text-muted">Fixed price</div>
        </div>

        <div>
          {taskAccepted ? (
            <button
              type="button"
              onClick={() => onOpenWorkspace(taskId)}
              className="px-4 py-2 text-xs font-semibold text-on-primary bg-primary rounded-md"
            >
              Open workspace
            </button>
          ) : taskDeclined ? (
            <button
              type="button"
              onClick={handleReconsider}
              className="px-3 py-2 text-xs font-semibold text-primary border border-line rounded-md"
            >
              Reconsider
            </button>
          ) : (
            <button
              type="button"
              onClick={handleAccept}
              className="px-4 py-2 text-xs font-semibold text-on-primary bg-primary rounded-md"
            >
              Accept task
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
