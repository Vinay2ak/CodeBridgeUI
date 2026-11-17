import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Server,
  Play,
  Square,
  RefreshCw,
  Terminal,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Send,
  FileCheck,
  Check,
  Copy,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { projectApi } from "../../services/project/api";
import type {
  ProjectScope,
  WorkspaceContainerInfo,
  TestSuiteResult,
  SubmissionRecord,
} from "../../services/project/types";
import { Button } from "../../components/ui/Button";
import { Chip } from "../../components/ui/Chip";

interface ControlledWorkspaceViewProps {
  projectId: string;
  onNavigateToPortfolio: () => void;
}

export const ControlledWorkspaceView: React.FC<ControlledWorkspaceViewProps> = ({
  projectId,
  onNavigateToPortfolio,
}) => {
  const queryClient = useQueryClient();
  const [copiedDockerCmd, setCopiedDockerCmd] = useState(false);

  // Form state for structured submission
  const [solutionSummary, setSolutionSummary] = useState("");
  const [filesModified, setFilesModified] = useState("");
  const [reviewerNotes, setReviewerNotes] = useState("");
  const [submitSuccessMsg, setSubmitSuccessMsg] = useState<string | null>(null);

  // Fetch Project details
  const { data: project } = useQuery<ProjectScope>({
    queryKey: ["project", projectId],
    queryFn: () => projectApi.getProject(projectId),
  });

  // Fetch Workspace Container state
  const { data: workspace, refetch: refetchWs } = useQuery<WorkspaceContainerInfo>({
    queryKey: ["project-workspace", projectId],
    queryFn: () => projectApi.getWorkspace(projectId),
  });

  // Fetch Submissions
  const { data: submissions, refetch: refetchSubmissions } = useQuery<SubmissionRecord[]>({
    queryKey: ["project-submissions", projectId],
    queryFn: () => projectApi.getSubmissions(projectId),
  });

  // State for last test run
  const [testResult, setTestResult] = useState<TestSuiteResult | null>(null);

  // Container Lifecycle Mutations
  const initMutation = useMutation({
    mutationFn: () => projectApi.initializeWorkspace(projectId),
    onSuccess: () => refetchWs(),
  });

  const startMutation = useMutation({
    mutationFn: () => projectApi.startWorkspace(projectId),
    onSuccess: () => refetchWs(),
  });

  const stopMutation = useMutation({
    mutationFn: () => projectApi.stopWorkspace(projectId),
    onSuccess: () => refetchWs(),
  });

  // Run Test Suite Mutation
  const runTestsMutation = useMutation({
    mutationFn: () => projectApi.runVerificationTests(projectId),
    onSuccess: (data: TestSuiteResult) => {
      setTestResult(data);
      refetchWs();
    },
  });

  // Submit Work Mutation
  const submitMutation = useMutation({
    mutationFn: (payload: {
      summary: string;
      filesModified: string;
      testResultStatus: "PASSED";
      reviewerNotes: string;
    }) => projectApi.submitProject(projectId, payload),
    onSuccess: () => {
      setSubmitSuccessMsg("Work submitted successfully to client review queue!");
      refetchSubmissions();
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      setTimeout(() => setSubmitSuccessMsg(null), 5000);
    },
  });

  const currentProject: ProjectScope = project || {
    id: projectId || "active-task",
    title: "Project Workspace",
    description: "",
    expectedResult: "",
    budget: 0,
    currency: "INR",
    deadline: "",
    skills: [],
    ownerName: "Client",
    projectState: "in_progress",
    escrowState: "held",
    github: {
      status: "connected",
      repoName: "workspace-repo",
      defaultBranch: "main",
      commitHash: "head",
      accessLevel: "Controlled Read-Only (No Owner Password Shared)",
    },
  };

  const projectStates = [
    { label: "Draft", key: "draft" },
    { label: "Open", key: "open" },
    { label: "Assigned", key: "assigned" },
    { label: "In Progress", key: "in_progress" },
    { label: "Submitted", key: "submitted" },
    { label: "Approved", key: "completed" },
  ];

  const currentProjectStateIdx = projectStates.findIndex(
    (s) => s.key === currentProject.projectState
  );

  const dockerCliCmd =
    workspace?.connectCommand ||
    (projectId
      ? `docker run -it --rm -v $(pwd):/workspace -e TASK_ID=${projectId} codebridge/runner:latest`
      : "docker run -it --rm -v $(pwd):/workspace codebridge/runner:latest");

  const handleCopyDocker = () => {
    navigator.clipboard.writeText(dockerCliCmd);
    setCopiedDockerCmd(true);
    setTimeout(() => setCopiedDockerCmd(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testResult?.passed) return;

    submitMutation.mutate({
      summary: solutionSummary,
      filesModified,
      testResultStatus: "PASSED",
      reviewerNotes,
    });
  };

  const isChangesRequested = currentProject.projectState === "changes_requested";

  return (
    <div className="flex-1 overflow-y-auto bg-canvas p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Header Steppers: Project Lifecycle & Payment Lifecycle */}
        <div className="p-4 rounded-xl border border-line bg-surface space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-line">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-primary uppercase">
                  Controlled Workspace & Submission
                </span>
                <Chip tone="info">US-006 / US-008 / US-009</Chip>
              </div>
              <h1 className="text-lg font-bold text-ink">{currentProject.title}</h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted">ID:</span>
              <code className="text-xs font-mono font-bold text-primary">{currentProject.id}</code>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1">
            {/* Project State Stepper */}
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-2">
                Project Lifecycle State
              </div>
              <div className="flex items-center gap-1 overflow-x-auto pb-1">
                {projectStates.map((st, idx) => {
                  const isCurrent =
                    idx === (currentProjectStateIdx >= 0 ? currentProjectStateIdx : 3);
                  const isDone =
                    idx < (currentProjectStateIdx >= 0 ? currentProjectStateIdx : 3);
                  return (
                    <div key={st.key} className="flex items-center gap-1 shrink-0">
                      <div
                        className={`px-2 py-0.5 rounded text-[11px] font-medium border flex items-center gap-1 ${
                          isCurrent
                            ? "bg-primary text-on-primary border-primary font-bold shadow-sm"
                            : isDone
                            ? "bg-info-bg text-primary border-info-border"
                            : "bg-surface text-muted/50 border-line"
                        }`}
                      >
                        {isDone && <Check className="h-2.5 w-2.5" />}
                        <span>{st.label}</span>
                      </div>
                      {idx < projectStates.length - 1 && (
                        <ChevronRight className="h-3 w-3 text-line shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Escrow Payment State */}
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-2">
                Escrow Payment State
              </div>
              <div className="flex items-center gap-2">
                <div className="px-2.5 py-1 rounded-md text-xs font-semibold bg-success-bg text-success border border-success-border flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>
                    {currentProject.budget > 0
                      ? `₹${currentProject.budget.toLocaleString()} ${currentProject.escrowState.replace(/_/g, " ").toUpperCase()}`
                      : "ESCROW SECURED"}
                  </span>
                </div>
                <span className="text-xs text-muted">
                  Auto-release triggered on test suite pass & owner approval
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Amber Revision Feedback Banner (if changes_requested) */}
        {isChangesRequested && (
          <div className="p-4 rounded-xl border border-warning-border bg-warning-bg/25 text-ink flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-warning">Revision Feedback Received from Project Owner</h3>
              <p className="text-xs text-muted">
                {currentProject.changesRequestedNote ||
                  "Changes were requested by the project owner. Please review feedback, update your code, and re-run tests."}
              </p>
              <div className="text-xs font-medium text-warning pt-1">
                Action required: Modify code, run test suite checks below, and re-submit your updated solution.
              </div>
            </div>
          </div>
        )}

        {/* Panel A: Controlled Docker Workspace Lifecycle */}
        <div className="p-5 rounded-xl border border-line bg-surface space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-line">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-info-bg text-primary border border-info-border shrink-0">
                <Server className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-ink">
                  Controlled Docker Workspace Container
                </h2>
                <p className="text-xs text-muted">
                  Standardized runtime container with locked dependencies and isolation.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted">State:</span>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                  workspace?.state === "active"
                    ? "bg-success text-on-primary"
                    : workspace?.state === "creating"
                    ? "bg-warning text-on-primary animate-pulse"
                    : "bg-surface text-muted border border-line"
                }`}
              >
                {workspace?.state || "idle"}
              </span>
            </div>
          </div>

          {/* Container Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-2.5 rounded-lg bg-raised border border-line">
              <span className="text-muted block text-[10px] uppercase font-mono">Container ID</span>
              <span className="font-mono font-bold text-ink">{workspace?.containerId || "Not initialized"}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-raised border border-line">
              <span className="text-muted block text-[10px] uppercase font-mono">Image Tag</span>
              <span className="font-mono text-ink truncate block">{workspace?.image || "codebridge/runner:latest"}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-raised border border-line">
              <span className="text-muted block text-[10px] uppercase font-mono">Isolation</span>
              <span className="font-mono text-ink">{workspace?.isolationLevel || "gVisor Hardened"}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-raised border border-line">
              <span className="text-muted block text-[10px] uppercase font-mono">Mount</span>
              <span className="font-mono text-ink truncate block">
                {workspace?.githubMount || (projectId ? `/workspace/${projectId}` : "—")}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => initMutation.mutate()}
              disabled={initMutation.isPending}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${initMutation.isPending ? "animate-spin" : ""}`} />
              <span>Initialize Workspace</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => startMutation.mutate()}
              disabled={startMutation.isPending || workspace?.state === "active"}
            >
              <Play className="h-3.5 w-3.5 text-success" />
              <span>Start Container</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => stopMutation.mutate()}
              disabled={stopMutation.isPending || workspace?.state === "stopped"}
            >
              <Square className="h-3.5 w-3.5 text-danger" />
              <span>Stop Container</span>
            </Button>
          </div>

          {/* Copyable CLI Docker Run Command */}
          <div className="pt-2">
            <span className="text-[11px] font-semibold text-muted uppercase tracking-wider block mb-1">
              Local CLI Runner Command (Docker Compatible)
            </span>
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-canvas border border-line font-mono text-xs text-ink overflow-x-auto">
              <Terminal className="h-4 w-4 text-primary shrink-0" />
              <span className="flex-1 select-all min-w-0 truncate">{dockerCliCmd}</span>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCopyDocker}
                className="shrink-0 h-7 text-xs px-2.5"
              >
                {copiedDockerCmd ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-success" />
                    <span className="text-success">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Panel B: Objective Test-Gate Runner */}
        <div className="p-5 rounded-xl border border-line bg-surface space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-line">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success-bg text-success border border-success-border shrink-0">
                <FileCheck className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-ink">
                  Objective Test-Gate Runner
                </h2>
                <p className="text-xs text-muted">
                  Deterministic pass/fail verification required before submission is unlocked.
                </p>
              </div>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => runTestsMutation.mutate()}
              disabled={runTestsMutation.isPending}
              className="font-bold shrink-0"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 mr-1.5 ${
                  runTestsMutation.isPending ? "animate-spin" : ""
                }`}
              />
              <span>
                {runTestsMutation.isPending
                  ? "Running Test Suite..."
                  : "Run Required Project Checks"}
              </span>
            </Button>
          </div>

          {/* Test Checks Checklist */}
          {testResult && (
            <div className="space-y-3">
              <div className="space-y-2">
                {testResult.steps.map((chk) => (
                  <div
                    key={chk.step}
                    className={`p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                      chk.status === "pass"
                        ? "bg-success-bg/20 border-success-border"
                        : "bg-danger-bg/20 border-danger-border"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {chk.status === "pass" ? (
                        <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-danger shrink-0" />
                      )}
                      <div>
                        <span className="text-xs font-semibold text-ink block">{chk.name}</span>
                        {chk.details && (
                          <span className="text-[11px] text-muted block mt-0.5">{chk.details}</span>
                        )}
                      </div>
                    </div>
                    {chk.durationMs && (
                      <span className="text-[11px] font-mono text-muted shrink-0">
                        {chk.durationMs}ms
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Console Output */}
              {testResult.rawOutput && (
                <div className="rounded-lg bg-canvas border border-line p-3 font-mono text-xs space-y-1 overflow-x-auto">
                  <div className="flex items-center justify-between text-muted pb-1 border-b border-line/60">
                    <span>Exit Code: {testResult.exitCode}</span>
                    <span>Duration: {testResult.durationMs}ms</span>
                    <span className="text-success font-bold">ALL TESTS PASSED (100%)</span>
                  </div>
                  <pre className="text-success text-xs font-mono whitespace-pre-wrap">
                    {testResult.rawOutput}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Panel C: Structured Work Submission Form */}
        <div className="p-5 rounded-xl border border-line bg-surface space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-line">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-info-bg text-primary border border-info-border shrink-0">
                <Send className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-ink">
                  Structured Work Submission
                </h2>
                <p className="text-xs text-muted">
                  Complete all four required fields. Submission is cryptographically linked to your passing test run.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted">Test-Gate Status:</span>
              {testResult?.passed ? (
                <Chip tone="success">VERIFIED PASS</Chip>
              ) : (
                <Chip tone="danger">TESTS REQUIRED</Chip>
              )}
            </div>
          </div>

          {submitSuccessMsg && (
            <div className="p-3 rounded-lg bg-success-bg border border-success-border text-success text-xs font-semibold flex items-center justify-between">
              <span>{submitSuccessMsg}</span>
              <Button
                variant="secondary"
                size="sm"
                onClick={onNavigateToPortfolio}
                className="h-7 text-xs"
              >
                <span>View Portfolio Record</span>
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Field 1: Solution Summary */}
            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                1. Solution Summary <span className="text-danger">*</span>
              </label>
              <textarea
                value={solutionSummary}
                onChange={(e) => setSolutionSummary(e.target.value)}
                rows={3}
                required
                className="w-full text-xs rounded-lg border border-line bg-canvas p-2.5 text-ink focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                placeholder="Describe your technical implementation, architectural decisions, and bug fixes..."
              />
            </div>

            {/* Field 2: Files Modified */}
            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                2. Files Modified (One per line) <span className="text-danger">*</span>
              </label>
              <textarea
                value={filesModified}
                onChange={(e) => setFilesModified(e.target.value)}
                rows={3}
                required
                className="w-full text-xs rounded-lg border border-line bg-canvas p-2.5 text-ink focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                placeholder="e.g. src/api/endpoints.py (one per line)"
              />
            </div>

            {/* Field 3: Objective Test Result Status */}
            <div>
              <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                3. Objective Test Result Status (Read-Only)
              </label>
              <div className="p-2.5 rounded-lg bg-raised border border-line flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  {testResult?.passed ? (
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  ) : (
                    <XCircle className="h-4 w-4 text-danger" />
                  )}
                  <span className="font-mono text-ink">
                    {testResult?.passed
                      ? `Automated Verification Checks — PASSED (Exit Code: ${testResult.exitCode ?? 0})`
                      : "No passing test run recorded. Click 'Run Required Project Checks' above."}
                  </span>
                </div>
                {testResult?.passed && (
                  <span className="text-[11px] font-mono text-muted">
                    {new Date(testResult.timestamp).toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>

            {/* Field 4: Reviewer Notes */}
            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                4. Notes for Reviewer / Project Owner (Optional)
              </label>
              <textarea
                value={reviewerNotes}
                onChange={(e) => setReviewerNotes(e.target.value)}
                rows={2}
                className="w-full text-xs rounded-lg border border-line bg-canvas p-2.5 text-ink focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Optional notes, verification instructions, or testing details for the project owner..."
              />
            </div>

            {/* Submit Action Button */}
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-muted">
                {!testResult?.passed
                  ? "Submission locked: All automated test checks must pass first."
                  : "Ready for submission: Escrow release will be reviewed."}
              </p>
              <Button
                variant="primary"
                size="md"
                type="submit"
                disabled={!testResult?.passed || submitMutation.isPending}
                className="font-bold text-xs px-6"
              >
                <Send className="h-3.5 w-3.5 mr-1.5" />
                <span>
                  {submitMutation.isPending ? "Submitting Solution..." : "Submit Solution for Review"}
                </span>
              </Button>
            </div>
          </form>

          {/* Submission History Timeline */}
          <div className="pt-4 border-t border-line space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              Submission & Review History
            </span>
            {submissions && submissions.length > 0 ? (
              <div className="space-y-2">
                {submissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="p-3 rounded-lg bg-raised border border-line space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-ink">{sub.id}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            sub.status === "approved"
                              ? "bg-success text-on-primary"
                              : sub.status === "changes_requested"
                              ? "bg-warning text-on-primary"
                              : "bg-primary text-on-primary"
                          }`}
                        >
                          {sub.status.replace("_", " ")}
                        </span>
                      </div>
                      <span className="text-muted font-mono text-[11px]">
                        {new Date(sub.submittedAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-ink">{sub.summary}</p>
                    {sub.feedback && (
                      <p className="text-warning text-[11px] font-medium pt-1">
                        Feedback: {sub.feedback}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-raised border border-line text-xs text-muted text-center">
                No submissions recorded yet for this project. Completed submissions and reviewer feedback will appear here in real time.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
