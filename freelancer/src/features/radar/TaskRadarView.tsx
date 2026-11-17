import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  RefreshCw,
  Sparkles,
  Check,
  CheckCircle2,
  Clock,
  FileText,
  X,
  Layers,
  ArrowRight,
} from "lucide-react";
import { projectApi } from "../../services/project/api";
import { workspaceApi } from "../../services/workspace/api";
import { paymentApi } from "../../services/payment/api";
import { profileApi } from "../../services/profile/api";
import type { ProjectScope } from "../../services/project/types";
import { formatCurrencyINR } from "../../lib/format";
import { Button } from "../../components/ui/Button";

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
  const [taskAcceptedMap, setTaskAcceptedMap] = useState<Record<string, boolean>>({});
  const [taskDeclinedMap, setTaskDeclinedMap] = useState<Record<string, boolean>>({});
  const [liveAnnouncement, setLiveAnnouncement] = useState<string>("");
  const [selectedProjectForModal, setSelectedProjectForModal] =
    useState<ProjectScope | null>(null);

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

  // If selectedTaskId prop is passed from outside, automatically open the modal for that task
  useEffect(() => {
    if (selectedTaskId && sortedProjects.length > 0) {
      const found = sortedProjects.find((p) => p.id === selectedTaskId);
      if (found) {
        setSelectedProjectForModal(found);
      }
    }
  }, [selectedTaskId, sortedProjects]);

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedProjectForModal(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Real-time task specification query for the project open in the modal
  const { data: taskDetails } = useQuery({
    queryKey: ["task", selectedProjectForModal?.id],
    queryFn: async () => {
      if (!selectedProjectForModal?.id) return null;
      try {
        return await workspaceApi.getTask(selectedProjectForModal.id);
      } catch {
        return null;
      }
    },
    enabled: !!selectedProjectForModal?.id,
    staleTime: 30_000,
  });

  // Real-time escrow payment query for the project open in the modal
  useQuery({
    queryKey: ["escrow", selectedProjectForModal?.id],
    queryFn: async () => {
      if (!selectedProjectForModal?.id) return null;
      try {
        return await paymentApi.getEscrow(selectedProjectForModal.id);
      } catch {
        return null;
      }
    },
    enabled: !!selectedProjectForModal?.id,
    staleTime: 30_000,
  });

  const announce = (msg: string) => {
    setLiveAnnouncement(msg);
    setTimeout(() => setLiveAnnouncement(""), 3000);
  };

  const handleAccept = (projectId: string) => {
    setTaskAcceptedMap((prev) => ({ ...prev, [projectId]: true }));
    setTaskDeclinedMap((prev) => ({ ...prev, [projectId]: false }));
    announce("Task accepted. Workspace is ready to launch.");
  };

  const handleDecline = (projectId: string) => {
    setTaskDeclinedMap((prev) => ({ ...prev, [projectId]: true }));
    setTaskAcceptedMap((prev) => ({ ...prev, [projectId]: false }));
    announce("Task declined.");
  };

  const handleReconsider = (projectId: string) => {
    setTaskDeclinedMap((prev) => ({ ...prev, [projectId]: false }));
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
  if (projectsLoading) {
    return (
      <div
        className="flex-1 overflow-y-auto bg-canvas p-6 lg:p-10"
        role="status"
        aria-label="Loading task details"
      >
        <div className="max-w-[1120px] mx-auto space-y-8">
          <div className="space-y-3">
            <div className="h-6 w-48 bg-surface rounded animate-pulse" />
            <div className="h-4 w-96 bg-surface rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-64 border border-line rounded-2xl bg-surface p-6 space-y-4"
              >
                <div className="flex justify-between items-center">
                  <div className="h-7 w-24 bg-canvas rounded animate-pulse" />
                  <div className="h-5 w-20 bg-canvas rounded-full animate-pulse" />
                </div>
                <div className="h-6 w-3/4 bg-canvas rounded animate-pulse" />
                <div className="h-12 w-full bg-canvas rounded animate-pulse" />
                <div className="h-10 w-full bg-canvas rounded-xl animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state with retry
  if (projectsError) {
    return (
      <div className="flex-1 flex items-center justify-center bg-canvas p-6 text-center">
        <div className="max-w-md w-full border border-line rounded-2xl bg-surface p-6 space-y-4">
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
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-on-primary bg-primary rounded-xl hover:opacity-95 transition-opacity"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            <span>Retry Connection</span>
          </button>
        </div>
      </div>
    );
  }

  // Empty state if backend returns 0 projects
  if (sortedProjects.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-canvas p-6 text-center">
        <div className="max-w-md w-full border border-line rounded-2xl bg-surface p-6 space-y-4">
          <h2 className="text-base font-semibold text-ink">No tasks available</h2>
          <p className="text-sm text-muted">
            There are currently no open tasks or assigned projects on the backend gateway.
          </p>
          <button
            type="button"
            onClick={() => refetchProjects()}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-on-primary bg-primary rounded-xl hover:opacity-95 transition-opacity"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            <span>Refresh</span>
          </button>
        </div>
      </div>
    );
  }

  // Active project data for the modal details
  const modalTaskId = selectedProjectForModal?.id || "";
  const modalTaskTitle = selectedProjectForModal?.title || "";
  const modalProblemText =
    selectedProjectForModal?.description ||
    (Array.isArray(taskDetails?.brief) ? taskDetails.brief[0] : "") ||
    "Issue details and reproduction steps provided by project owner.";
  const modalExpectedOutcome =
    selectedProjectForModal?.expectedResult ||
    (Array.isArray(taskDetails?.brief) ? taskDetails.brief[1] : "") ||
    "Expected outcome and verification requirements provided by project owner.";
  const modalSkillsList =
    taskDetails?.stack && taskDetails.stack.length > 0
      ? taskDetails.stack
      : selectedProjectForModal?.skills && selectedProjectForModal.skills.length > 0
      ? selectedProjectForModal.skills
      : ["Python", "FastAPI"];
  const modalCriteriaList: string[] =
    taskDetails?.criteria && taskDetails.criteria.length > 0
      ? taskDetails.criteria.map((c) => (typeof c === "string" ? c : c.text))
      : [
          selectedProjectForModal?.expectedResult ||
            "All test assertions pass cleanly with zero regression.",
        ];

  const modalDeadlineInfo = getDisplayDeadline(selectedProjectForModal?.deadline);
  const modalAmountFormatted = selectedProjectForModal
    ? formatCurrencyINR(selectedProjectForModal.budget)
    : "₹0";
  const modalRepoName =
    taskDetails?.repo?.name ||
    selectedProjectForModal?.github?.repoName ||
    "codebridge/payments-service";
  const modalCommitHash =
    taskDetails?.repo?.commit ||
    selectedProjectForModal?.github?.commitHash ||
    "c8f492b";

  const isModalTaskAccepted =
    taskAcceptedMap[modalTaskId] ||
    selectedProjectForModal?.projectState === "in_progress";
  const isModalTaskDeclined = taskDeclinedMap[modalTaskId] || false;

  const modalMatch = selectedProjectForModal
    ? computeSkillMatch(selectedProjectForModal, userSkills)
    : { matched: false, matchedSkills: [] as string[], matchPercentage: 0 };

  return (
    <div className="flex-1 overflow-y-auto bg-canvas text-ink min-h-screen">
      {/* Live announcement region for accessibility */}
      <div aria-live="polite" className="sr-only">
        {liveAnnouncement}
      </div>

      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10 space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-line">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-ink">
                Tasks Radar
              </h1>
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-surface border border-line text-muted">
                <Layers className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                <span>{sortedProjects.length} Tasks available</span>
              </span>
            </div>
            <p className="text-sm text-muted">
              Inspect objective acceptance criteria, review escrow guarantees, and accept tasks matching your tech stack.
            </p>
          </div>

          {userSkills.length > 0 && (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-surface border border-line text-xs">
              <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              <span className="text-muted">Matched with your skills:</span>
              <span className="font-semibold text-ink font-mono">
                {userSkills.slice(0, 3).join(", ")}
                {userSkills.length > 3 ? ` +${userSkills.length - 3}` : ""}
              </span>
            </div>
          )}
        </div>

        {/* Small Boxes Grid: Multiple projects displayed at once */}
        <section aria-label="Available projects grid">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedProjects.map((project) => {
              const match = computeSkillMatch(project, userSkills);
              const deadline = getDisplayDeadline(project.deadline);
              const isAccepted =
                taskAcceptedMap[project.id] || project.projectState === "in_progress";

              return (
                <div
                  key={project.id}
                  className="rounded-2xl border border-line bg-surface p-5 sm:p-6 shadow-sm hover:border-primary/50 transition-all flex flex-col justify-between space-y-5"
                >
                  {/* Card Top Header: Amount & Match */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-xs text-muted block font-medium">Fixed price</span>
                      <span className="text-2xl font-bold tabular-nums text-ink">
                        {formatCurrencyINR(project.budget)}
                      </span>
                    </div>

                    {match.matched && match.matchPercentage > 0 && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-success-bg text-success border border-success-border">
                        <Sparkles className="h-3 w-3" aria-hidden="true" />
                        <span>{match.matchPercentage}% Match</span>
                      </span>
                    )}
                  </div>

                  {/* Card Body: Title & Problem Context */}
                  <div className="space-y-2 flex-1">
                    <h2 className="text-base font-semibold text-ink line-clamp-2">
                      {project.title}
                    </h2>
                    <p className="text-xs text-muted line-clamp-2 leading-relaxed">
                      {project.description || "Objective specification provided by client."}
                    </p>
                  </div>

                  {/* Tech Stack Chips */}
                  {project.skills && project.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {project.skills.slice(0, 3).map((skill) => {
                        const isMatched = userSkills.some(
                          (us) => us.trim().toLowerCase() === skill.trim().toLowerCase()
                        );
                        return (
                          <span
                            key={skill}
                            className={`px-2 py-0.5 rounded-md text-[11px] font-mono border ${
                              isMatched
                                ? "bg-success-bg text-success border-success-border font-semibold"
                                : "bg-canvas text-muted border-line"
                            }`}
                          >
                            {skill}
                          </span>
                        );
                      })}
                      {project.skills.length > 3 && (
                        <span className="text-[11px] text-muted self-center">
                          +{project.skills.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Card Footer Meta: Deadline & Escrow Status */}
                  <div className="pt-3 border-t border-line/60 flex items-center justify-between text-xs text-muted">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{deadline.formattedDate}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 text-success font-medium">
                      <span className="h-1.5 w-1.5 rounded-full bg-success" />
                      <span>Payment held</span>
                    </span>
                  </div>

                  {/* Project Description Button at bottom of each box */}
                  <Button
                    variant={isAccepted ? "secondary" : "primary"}
                    onClick={() => setSelectedProjectForModal(project)}
                    className="w-full justify-center"
                    aria-label={`Project Description for ${project.title}`}
                  >
                    <FileText className="h-4 w-4" aria-hidden="true" />
                    <span>{isAccepted ? "View Workspace Scope" : "Project Description"}</span>
                  </Button>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* POPUP MODAL: Whole Project Description in details with Accept / Reject buttons */}
      {selectedProjectForModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-overlay backdrop-blur-sm overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-task-title"
        >
          <div className="w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-2xl border border-line bg-surface p-6 sm:p-8 shadow-2xl relative space-y-6">
            {/* Modal Top Header with Breadcrumbs & Close Button */}
            <div className="flex items-center justify-between gap-4 pb-4 border-b border-line">
              <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted">
                <span>Tasks</span>
                <span aria-hidden="true">/</span>
                <span className="font-mono text-ink font-medium">{modalTaskId}</span>
              </nav>

              <button
                type="button"
                onClick={() => setSelectedProjectForModal(null)}
                className="p-1.5 rounded-lg border border-line text-muted hover:text-ink hover:bg-canvas transition-colors"
                aria-label="Close dialog"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            {/* Personalized Match Banner inside Modal if applicable */}
            {modalMatch.matched && modalMatch.matchedSkills.length > 0 && (
              <div className="p-3.5 rounded-xl bg-success-bg border border-success-border text-xs text-success flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>
                    <strong>Recommended for your tech stack:</strong> matches your verified skills (
                    {modalMatch.matchedSkills.join(", ")}).
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-success text-on-primary font-bold text-[11px] shrink-0">
                  {modalMatch.matchPercentage}% Stack Match
                </span>
              </div>
            )}

            {/* Modal Main 2-Column Content */}
            <div className="flex flex-col lg:flex-row items-start gap-8 lg:gap-10">
              {/* Left Column: Scope, Expectations, Done When, Stack */}
              <div className="w-full lg:max-w-[620px] flex-1 space-y-6">
                <div>
                  <h1 id="modal-task-title" className="text-2xl font-bold tracking-tight text-ink">
                    {modalTaskTitle}
                  </h1>
                  <p className="text-xs text-muted mt-1">
                    Posted by {selectedProjectForModal.ownerName || "CodeBridge Project Owner"}
                  </p>
                </div>

                <div className="h-px bg-line" aria-hidden="true" />

                {/* What is broken */}
                <section aria-labelledby="modal-heading-broken" className="space-y-2">
                  <h2 id="modal-heading-broken" className="text-sm font-semibold text-ink flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4 text-warning" aria-hidden="true" />
                    <span>What is broken</span>
                  </h2>
                  <div className="p-3.5 rounded-xl bg-canvas border border-line">
                    <p className="text-sm leading-relaxed text-ink whitespace-pre-line">
                      {modalProblemText}
                    </p>
                  </div>
                </section>

                {/* What the owner expects */}
                <section aria-labelledby="modal-heading-expects" className="space-y-2">
                  <h2 id="modal-heading-expects" className="text-sm font-semibold text-ink flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" />
                    <span>What the owner expects</span>
                  </h2>
                  <div className="p-3.5 rounded-xl bg-canvas border border-line">
                    <p className="text-sm leading-relaxed text-ink whitespace-pre-line">
                      {modalExpectedOutcome}
                    </p>
                  </div>
                </section>

                {/* Done when (criteria) */}
                <section aria-labelledby="modal-heading-criteria" className="space-y-2">
                  <h2 id="modal-heading-criteria" className="text-sm font-semibold text-ink">
                    Done when
                  </h2>
                  {modalCriteriaList.length > 0 ? (
                    <ol className="space-y-2 list-decimal list-inside text-sm leading-relaxed text-ink p-3.5 rounded-xl bg-canvas border border-line">
                      {modalCriteriaList.map((item, idx) => (
                        <li key={idx} className="pl-1">
                          <span>{item}</span>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="text-sm text-muted">No specific criteria listed.</p>
                  )}
                </section>

                {/* Stack */}
                <section aria-labelledby="modal-heading-stack" className="space-y-2">
                  <h2 id="modal-heading-stack" className="text-sm font-semibold text-ink">
                    Stack
                  </h2>
                  <div className="flex flex-wrap items-center gap-2">
                    {modalSkillsList.map((skill) => {
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
                  <p className="sr-only">{modalSkillsList.join(", ")}</p>
                </section>
              </div>

              {/* Right Column: Escrow, Payment, Action Buttons & Details */}
              <aside className="w-full lg:w-[320px] rounded-2xl border border-line bg-canvas p-5 space-y-6">
                {/* Amount */}
                <div className="space-y-1">
                  <span className="text-xs text-muted block font-medium">Fixed price</span>
                  <div className="text-3xl font-bold tabular-nums text-ink">
                    {modalAmountFormatted}
                  </div>
                </div>

                {/* Simulated Payment & Escrow Status */}
                <div className="space-y-3 pt-2 border-t border-line">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-ink">Payment held</span>
                    {PAYMENT_MODE === "simulated" && (
                      <span className="text-muted">Simulated payment - demo only</span>
                    )}
                  </div>

                  {/* Vertical 4-Stage Escrow Stepper */}
                  <ul className="space-y-2.5 text-xs">
                    {ESCROW_STEPS.map((step) => {
                      const isHeld = step.key === "held";
                      return (
                        <li key={step.key} className="flex items-center gap-2.5">
                          <span
                            className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                              isHeld
                                ? "bg-success"
                                : "border border-line bg-surface"
                            }`}
                            aria-hidden="true"
                          />
                          <span
                            className={
                              isHeld
                                ? "font-bold text-ink"
                                : "text-muted"
                            }
                          >
                            {step.label}
                          </span>
                        </li>
                      );
                    })}
                  </ul>

                  <p className="text-[11px] text-muted leading-relaxed">
                    Released after your tests pass and the owner approves.
                  </p>
                </div>

                {/* Action Buttons: Accept / Decline / Open Workspace */}
                <div className="space-y-3 pt-2 border-t border-line">
                  {isModalTaskDeclined ? (
                    <div className="space-y-2 text-center">
                      <p className="text-xs text-muted">You declined this task.</p>
                      <Button
                        variant="secondary"
                        onClick={() => handleReconsider(modalTaskId)}
                        className="w-full justify-center text-xs"
                      >
                        Reconsider task
                      </Button>
                    </div>
                  ) : isModalTaskAccepted ? (
                    <Button
                      variant="primary"
                      onClick={() => {
                        setSelectedProjectForModal(null);
                        onOpenWorkspace(modalTaskId);
                      }}
                      className="w-full justify-center"
                    >
                      <span>Open workspace</span>
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  ) : (
                    <div className="space-y-2.5">
                      <Button
                        variant="primary"
                        onClick={() => handleAccept(modalTaskId)}
                        className="w-full justify-center"
                      >
                        Accept task
                      </Button>
                      <div className="flex items-center justify-between pt-1">
                        <button
                          type="button"
                          onClick={() => handleDecline(modalTaskId)}
                          className="text-xs text-muted hover:text-ink transition-colors"
                        >
                          Decline
                        </button>
                        <button
                          type="button"
                          onClick={() => announce("Messaging is not yet configured for this project.")}
                          className="text-xs text-primary hover:underline transition-all"
                        >
                          Ask the owner a question
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Definition List: Metadata */}
                <dl className="space-y-3 text-xs pt-4 border-t border-line">
                  <div className="flex items-start justify-between gap-2">
                    <dt className="text-muted shrink-0">Deadline</dt>
                    <dd className="text-right">
                      <span className={modalDeadlineInfo.isOverdue ? "text-danger font-medium" : "text-ink"}>
                        {modalDeadlineInfo.formattedDate}
                      </span>
                      {modalDeadlineInfo.relativeText && (
                        <span className={`block text-[11px] ${modalDeadlineInfo.isOverdue ? "text-danger font-semibold" : "text-muted"}`}>
                          ({modalDeadlineInfo.relativeText})
                        </span>
                      )}
                    </dd>
                  </div>

                  <div className="flex items-start justify-between gap-2">
                    <dt className="text-muted shrink-0">Task ID</dt>
                    <dd className="font-mono text-[11px] text-ink text-right break-all">
                      {modalTaskId}
                    </dd>
                  </div>

                  <div className="space-y-1">
                    <dt className="text-muted">Repository</dt>
                    <dd className="text-ink">
                      <span className="font-mono text-[11px] block">{modalRepoName}</span>
                      <span className="font-mono text-[11px] text-muted block">{modalCommitHash}</span>
                      <span className="text-[11px] text-muted block leading-tight mt-0.5">
                        Read-only. Opens in your workspace after you accept.
                      </span>
                    </dd>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-muted">Status</dt>
                    <dd className="font-medium text-ink">
                      {isModalTaskAccepted ? "Assigned" : "Available"}
                    </dd>
                  </div>
                </dl>
              </aside>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
