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
  Radio,
  FileText,
  Clock,
  Code,
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
  const queryClient = useQueryClient();
  const [copiedDockerCmd, setCopiedDockerCmd] = useState(false);

  // Form state for structured submission
  const [solutionSummary, setSolutionSummary] = useState("");
  const [filesModified, setFilesModified] = useState("");
  const [reviewerNotes, setReviewerNotes] = useState("");
  const [submitSuccessMsg, setSubmitSuccessMsg] = useState<string | null>(null);

  // Query real-time available projects list from backend
  const { data: remoteProjects } = useQuery<ProjectScope[]>({
    queryKey: ["projects", "realtime-list"],
    queryFn: () => projectApi.getProjects(),
    staleTime: 30_000,
  });

  const availableProjects = propProjects && propProjects.length > 0
    ? propProjects
    : (remoteProjects || []);

  // Resolve active project ID: use prop if not fallback 'proj_1024', or first real project from backend
  const activeProjectId =
    projectId && projectId !== "proj_1024"
      ? projectId
      : availableProjects[0]?.id || projectId || "proj_1024";

  // Fetch Project details for active project
  const { data: project } = useQuery<ProjectScope>({
    queryKey: ["project", activeProjectId],
    queryFn: () => projectApi.getProject(activeProjectId),
    enabled: !!activeProjectId,
    staleTime: 15_000,
  });

  // Current active project data with graceful fallback
  const currentProject: ProjectScope =
    project ||
    availableProjects.find((p) => p.id === activeProjectId) || {
      id: activeProjectId,
      title: "Project Workspace",
      description: "Active engineering workspace container for task verification and submission.",
      expectedResult: "Pass all deterministic test suites and acceptance criteria.",
      budget: 0,
      currency: "INR",
      deadline: "",
      skills: ["Fullstack"],
      ownerName: "CodeBridge Client",
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

  // Fetch Workspace Container state
  const { data: workspace, refetch: refetchWs } = useQuery<WorkspaceContainerInfo>({
    queryKey: ["project-workspace", activeProjectId],
    queryFn: () => projectApi.getWorkspace(activeProjectId),
    enabled: !!activeProjectId,
  });

  // Fetch Submissions
  const { data: submissions, refetch: refetchSubmissions } = useQuery<SubmissionRecord[]>({
    queryKey: ["project-submissions", activeProjectId],
    queryFn: () => projectApi.getSubmissions(activeProjectId),
    enabled: !!activeProjectId,
  });

  // State for last test run
  const [testResult, setTestResult] = useState<TestSuiteResult | null>(null);

  // Container Lifecycle Mutations
  const initMutation = useMutation({
    mutationFn: () => projectApi.initializeWorkspace(activeProjectId),
    onSuccess: () => refetchWs(),
  });

  const startMutation = useMutation({
    mutationFn: () => projectApi.startWorkspace(activeProjectId),
    onSuccess: () => refetchWs(),
  });

  const stopMutation = useMutation({
    mutationFn: () => projectApi.stopWorkspace(activeProjectId),
    onSuccess: () => refetchWs(),
  });

  // Run Test Suite Mutation
  const runTestsMutation = useMutation({
    mutationFn: () => projectApi.runVerificationTests(activeProjectId),
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
    }) => projectApi.submitProject(activeProjectId, payload),
    onSuccess: () => {
      setSubmitSuccessMsg("Work submitted successfully to client review queue!");
      setSolutionSummary("");
      setFilesModified("");
      setReviewerNotes("");
      refetchSubmissions();
      queryClient.invalidateQueries({ queryKey: ["project", activeProjectId] });
      setTimeout(() => setSubmitSuccessMsg(null), 5000);
    },
  });

  const dockerCliCmd =
    workspace?.connectCommand ||
    (activeProjectId
      ? `docker run -it --rm -v $(pwd):/workspace -e TASK_ID=${activeProjectId} codebridge/runner:latest`
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
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation Breadcrumb & Header */}
        <div className="space-y-3 pb-2 border-b border-line">
          <div className="flex items-center gap-2 text-xs text-muted">
            <button
              onClick={onNavigateToRadar}
              className="hover:text-primary transition-colors flex items-center gap-1 font-medium"
            >
              <Radio className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Tasks</span>
            </button>
            <ChevronRight className="h-3 w-3 text-line" />
            <span className="font-mono text-ink font-semibold">{currentProject.id}</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-ink">
                {currentProject.title}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-muted">
                <span className="font-medium text-ink">{currentProject.ownerName}</span>
                <span>•</span>
                <span className="font-mono text-[11px] bg-raised px-2 py-0.5 rounded border border-line">
                  {currentProject.id}
                </span>

                {availableProjects.length > 1 && (
                  <div className="flex items-center gap-1.5 ml-1">
                    <span className="text-[11px] text-muted">Switch Task:</span>
                    <select
                      value={activeProjectId}
                      onChange={(e) => onSelectProject?.(e.target.value)}
                      className="text-xs rounded border border-line bg-surface px-2 py-0.5 text-ink font-medium focus:ring-1 focus:ring-primary focus:outline-none"
                    >
                      {availableProjects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title.slice(0, 45)} ({p.id})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Escrow and Project State Pills */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <div className="px-3 py-1 rounded-lg text-xs font-semibold bg-success-bg text-success border border-success-border flex items-center gap-1.5 shadow-sm">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                <span>
                  {currentProject.budget > 0
                    ? `₹${currentProject.budget.toLocaleString()} ${currentProject.escrowState.replace(/_/g, " ").toUpperCase()}`
                    : "ESCROW SECURED"}
                </span>
              </div>
              <div className="px-3 py-1 rounded-lg text-xs font-semibold bg-info-bg text-primary border border-info-border flex items-center gap-1.5 uppercase tracking-wide shadow-sm">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{currentProject.projectState.replace(/_/g, " ")}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Revision Feedback Banner (if changes_requested) */}
        {isChangesRequested && (
          <div className="p-4 rounded-xl border border-warning-border bg-warning-bg/25 text-ink flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" aria-hidden="true" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-warning">Revision Feedback Received from Project Owner</h3>
              <p className="text-xs text-muted">
                {currentProject.changesRequestedNote ||
                  "Changes were requested by the project owner. Please review feedback, adjust code, and re-run test checks."}
              </p>
              <div className="text-xs font-medium text-warning pt-1">
                Action required: Update solution, pass the test-gate checks, and re-submit your solution below.
              </div>
            </div>
          </div>
        )}

        {/* 2-Column Responsive Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Left Column (7 cols): Test Gate, Submission Form, History */}
          <div className="lg:col-span-7 space-y-6">
            {/* Section 1: Objective Test-Gate Verification */}
            <div className="p-5 rounded-xl border border-line bg-surface space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-line">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-success-bg text-success border border-success-border shrink-0">
                    <FileCheck className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-ink">
                      Objective Test-Gate Verification
                    </h2>
                    <p className="text-xs text-muted">
                      Deterministic verification required before solution submission is unlocked.
                    </p>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => runTestsMutation.mutate()}
                  disabled={runTestsMutation.isPending}
                  className="font-bold shrink-0 text-xs px-3.5"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 mr-1.5 ${
                      runTestsMutation.isPending ? "animate-spin" : ""
                    }`}
                    aria-hidden="true"
                  />
                  <span>
                    {runTestsMutation.isPending
                      ? "Running Checks..."
                      : "Run Required Checks"}
                  </span>
                </Button>
              </div>

              {/* Test Checks Checklist */}
              <div className="space-y-2">
                {testResult?.steps ? (
                  testResult.steps.map((chk) => (
                    <div
                      key={chk.step}
                      className={`p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs ${
                        chk.status === "pass"
                          ? "bg-success-bg/20 border-success-border"
                          : "bg-danger-bg/20 border-danger-border"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {chk.status === "pass" ? (
                          <CheckCircle2 className="h-4 w-4 text-success shrink-0" aria-hidden="true" />
                        ) : (
                          <XCircle className="h-4 w-4 text-danger shrink-0" aria-hidden="true" />
                        )}
                        <div>
                          <span className="font-semibold text-ink block">{chk.name}</span>
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
                  ))
                ) : (
                  <div className="p-3.5 rounded-lg bg-raised border border-line text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-muted">
                        <Clock className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
                        <span className="font-medium text-ink">Ready for Verification Run</span>
                      </div>
                      <Chip tone="neutral">Pending Verification</Chip>
                    </div>
                    <p className="text-[11px] text-muted leading-relaxed">
                      Click <strong className="text-ink">Run Required Checks</strong> above to execute automated linting, idempotency checks, and the project test suite inside your container sandbox.
                    </p>
                  </div>
                )}
              </div>

              {/* Terminal Output Log */}
              {testResult?.rawOutput && (
                <div className="rounded-lg bg-canvas border border-line p-3 font-mono text-xs space-y-1 overflow-x-auto">
                  <div className="flex items-center justify-between text-muted pb-1.5 border-b border-line/60">
                    <span>Exit Code: {testResult.exitCode}</span>
                    <span>Duration: {testResult.durationMs}ms</span>
                    <span className={testResult.passed ? "text-success font-bold" : "text-danger font-bold"}>
                      {testResult.passed ? "ALL CHECKS PASSED (100%)" : "CHECKS FAILED"}
                    </span>
                  </div>
                  <pre className="text-success text-xs font-mono whitespace-pre-wrap pt-1">
                    {testResult.rawOutput}
                  </pre>
                </div>
              )}
            </div>

            {/* Section 2: Structured Solution Submission */}
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
                      Cryptographically linked to your passing verification checks.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {testResult?.passed ? (
                    <Chip tone="success">Gate: Verified Pass</Chip>
                  ) : (
                    <Chip tone="danger">Gate: Verification Required</Chip>
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
                    <span>View Portfolio</span>
                    <ArrowRight className="h-3 w-3 ml-1" aria-hidden="true" />
                  </Button>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Solution Summary */}
                <div>
                  <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                    Solution Summary <span className="text-danger">*</span>
                  </label>
                  <textarea
                    value={solutionSummary}
                    onChange={(e) => setSolutionSummary(e.target.value)}
                    rows={3}
                    required
                    className="w-full text-xs rounded-lg border border-line bg-canvas p-2.5 text-ink focus:outline-none focus:ring-2 focus:ring-primary font-mono placeholder:text-muted/60"
                    placeholder="Describe your technical implementation, architectural decisions, and bug fixes..."
                  />
                </div>

                {/* Files Modified */}
                <div>
                  <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                    Files Modified (one per line) <span className="text-danger">*</span>
                  </label>
                  <textarea
                    value={filesModified}
                    onChange={(e) => setFilesModified(e.target.value)}
                    rows={3}
                    required
                    className="w-full text-xs rounded-lg border border-line bg-canvas p-2.5 text-ink focus:outline-none focus:ring-2 focus:ring-primary font-mono placeholder:text-muted/60"
                    placeholder="e.g. app/api/v1/endpoints/payments.py"
                  />
                </div>

                {/* Reviewer Notes */}
                <div>
                  <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                    Notes for Reviewer / Project Owner (Optional)
                  </label>
                  <textarea
                    value={reviewerNotes}
                    onChange={(e) => setReviewerNotes(e.target.value)}
                    rows={2}
                    className="w-full text-xs rounded-lg border border-line bg-canvas p-2.5 text-ink focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted/60"
                    placeholder="Optional notes, verification instructions, or testing details for the project owner..."
                  />
                </div>

                {/* Submit Action Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                  <p className="text-xs text-muted">
                    {!testResult?.passed
                      ? "Submission locked: Pass automated test checks above to enable submission."
                      : "Ready for review: Solution will be routed to client review queue."}
                  </p>
                  <Button
                    variant="primary"
                    size="md"
                    type="submit"
                    disabled={!testResult?.passed || submitMutation.isPending}
                    className="font-bold text-xs px-6 shrink-0"
                  >
                    <Send className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
                    <span>
                      {submitMutation.isPending ? "Submitting Solution..." : "Submit Solution for Review"}
                    </span>
                  </Button>
                </div>
              </form>
            </div>

            {/* Section 3: Submission & Review History */}
            <div className="p-5 rounded-xl border border-line bg-surface space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-line">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted" aria-hidden="true" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-muted">
                    Submission & Review History
                  </h2>
                </div>
                {submissions && submissions.length > 0 && (
                  <span className="text-xs font-mono text-muted">
                    {submissions.length} submission{submissions.length > 1 ? "s" : ""}
                  </span>
                )}
              </div>

              {submissions && submissions.length > 0 ? (
                <div className="space-y-3">
                  {submissions.map((sub) => (
                    <div
                      key={sub.id}
                      className="p-3.5 rounded-lg bg-raised border border-line space-y-1.5 text-xs"
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
                      <p className="text-ink leading-relaxed">{sub.summary}</p>
                      {sub.feedback && (
                        <div className="p-2.5 rounded bg-warning-bg/20 border border-warning-border text-warning text-xs mt-1">
                          <strong>Owner Feedback:</strong> {sub.feedback}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-5 rounded-lg bg-canvas border border-line text-xs text-muted text-center space-y-1">
                  <FileText className="h-5 w-5 text-muted mx-auto mb-1 opacity-60" aria-hidden="true" />
                  <p className="font-medium text-ink">No submissions recorded yet for this project</p>
                  <p className="text-[11px] text-muted">
                    Completed submissions and reviewer feedback will appear here in real time.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Right Column (5 cols): Container Runtime & Project Scope */}
          <div className="lg:col-span-5 space-y-6">
            {/* Sidebar Card 1: Workspace Runtime Container */}
            <div className="p-5 rounded-xl border border-line bg-surface space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-line">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-info-bg text-primary border border-info-border">
                    <Server className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-ink">Workspace Runtime</h2>
                    <p className="text-[11px] text-muted">Docker sandbox container</p>
                  </div>
                </div>

                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
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

              {/* Lifecycle Controls */}
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => initMutation.mutate()}
                  disabled={initMutation.isPending}
                  className="text-xs h-7 px-2.5"
                >
                  <RefreshCw
                    className={`h-3 w-3 mr-1 ${initMutation.isPending ? "animate-spin" : ""}`}
                    aria-hidden="true"
                  />
                  <span>Initialize</span>
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => startMutation.mutate()}
                  disabled={startMutation.isPending || workspace?.state === "active"}
                  className="text-xs h-7 px-2.5"
                >
                  <Play className="h-3 w-3 mr-1 text-success" aria-hidden="true" />
                  <span>Start</span>
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => stopMutation.mutate()}
                  disabled={stopMutation.isPending || workspace?.state === "stopped"}
                  className="text-xs h-7 px-2.5"
                >
                  <Square className="h-3 w-3 mr-1 text-danger" aria-hidden="true" />
                  <span>Stop</span>
                </Button>
              </div>

              {/* Runtime Specs List */}
              <div className="space-y-2 text-xs pt-1">
                <div className="flex items-center justify-between p-2 rounded-lg bg-canvas border border-line">
                  <span className="text-muted text-[11px] font-medium">Container ID</span>
                  <span className="font-mono font-bold text-ink">
                    {workspace?.containerId || "Not initialized"}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-canvas border border-line">
                  <span className="text-muted text-[11px] font-medium">Runtime Image</span>
                  <span className="font-mono text-ink text-[11px] truncate max-w-[200px]">
                    {workspace?.image || "codebridge/runner:latest"}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-canvas border border-line">
                  <span className="text-muted text-[11px] font-medium">Isolation</span>
                  <span className="font-mono text-ink text-[11px]">
                    {workspace?.isolationLevel || "gVisor Hardened"}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-canvas border border-line">
                  <span className="text-muted text-[11px] font-medium">Mount</span>
                  <span className="font-mono text-ink text-[11px] truncate max-w-[200px]">
                    {workspace?.githubMount || (activeProjectId ? `/workspace/${activeProjectId}` : "—")}
                  </span>
                </div>
              </div>

              {/* Local CLI Command Box */}
              <div className="pt-2 border-t border-line space-y-1.5">
                <span className="text-[11px] font-semibold text-muted uppercase tracking-wider block">
                  CLI Runner Command
                </span>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-canvas border border-line font-mono text-[11px] text-ink overflow-x-auto">
                  <Terminal className="h-3.5 w-3.5 text-primary shrink-0" aria-hidden="true" />
                  <span className="flex-1 select-all min-w-0 truncate">{dockerCliCmd}</span>
                  <button
                    onClick={handleCopyDocker}
                    className="shrink-0 p-1 rounded hover:bg-raised text-muted hover:text-ink transition-colors"
                    title="Copy command"
                  >
                    {copiedDockerCmd ? (
                      <Check className="h-3.5 w-3.5 text-success" aria-hidden="true" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Sidebar Card 2: Project Scope & Acceptance Criteria */}
            <div className="p-5 rounded-xl border border-line bg-surface space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-line">
                <Code className="h-4 w-4 text-primary" aria-hidden="true" />
                <h2 className="text-sm font-bold text-ink">Scope & Acceptance Criteria</h2>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted block mb-1">
                    Problem Summary
                  </span>
                  <p className="text-ink leading-relaxed">
                    {currentProject.description || "No specific problem context provided."}
                  </p>
                </div>

                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted block mb-1">
                    Deterministic Expected Result
                  </span>
                  <div className="p-2.5 rounded-lg bg-canvas border border-line text-ink leading-relaxed font-mono text-[11px]">
                    {currentProject.expectedResult || "Pass all test-gate checks."}
                  </div>
                </div>

                {currentProject.skills && currentProject.skills.length > 0 && (
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted block mb-1.5">
                      Required Tech Stack
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {currentProject.skills.map((skill) => (
                        <span
                          key={skill}
                          className="px-2 py-0.5 rounded text-[11px] font-medium bg-raised text-ink border border-line"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
