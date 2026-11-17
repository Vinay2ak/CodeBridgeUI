import type {
  Run,
  RunStartResponse,
  SubmissionResponse,
  CurrentSubmissionResponse,
  TestResult,
  TestStatus,
} from "./types";

/**
 * Maps backend test status to internal TestStatus
 */
export function adaptTestStatus(status?: string): TestStatus {
  const norm = (status || "").toLowerCase();
  if (norm === "passed" || norm === "pass") return "passed";
  if (norm === "failed" || norm === "fail") return "failed";
  if (norm === "running") return "running";
  return "pending";
}

/**
 * Adapts backend run results (from GET /api/v1/submissions/runs/{run_id})
 */
export function adaptRun(raw: any): Run {
  const runId = String(raw?.runId || raw?.run_id || `run_${Date.now()}`);
  const taskId = String(raw?.taskId || raw?.task_id || "task-1");
  const rawStatus = (raw?.status || "").toLowerCase();
  const status: "running" | "completed" = rawStatus === "running" ? "running" : "completed";

  const rawResults = Array.isArray(raw?.results) ? raw.results : [];
  const results: TestResult[] = rawResults.map((r: any) => ({
    testId: String(r.testId || r.test_id || "test_unknown"),
    status: adaptTestStatus(r.status),
    durationMs: typeof r.durationMs === "number" ? r.durationMs : r.duration_ms,
    message: r.message,
  }));

  return {
    runId,
    taskId,
    status,
    results,
  };
}

/**
 * Adapts backend run start response (POST /api/v1/submissions/runs)
 */
export function adaptRunStartResponse(raw: any): RunStartResponse {
  const runId = String(raw?.runId || raw?.run_id || `run_${Date.now()}`);
  return { runId };
}

/**
 * Adapts backend submission creation response (POST /api/v1/submissions)
 */
export function adaptSubmissionResponse(raw: any): SubmissionResponse {
  const submissionId = String(raw?.submissionId || raw?.submission_id || raw?.id || `sub_${Date.now()}`);
  return {
    submissionId,
    status: "in_review",
  };
}

/**
 * Adapts backend current submission response (GET /api/v1/submissions/current)
 */
export function adaptCurrentSubmissionResponse(raw: any): CurrentSubmissionResponse {
  if (!raw || typeof raw !== "object") {
    return { status: "none" };
  }

  const rawStatus = (raw.status || "none").toLowerCase();
  let status: "none" | "in_review" | "approved" | "changes_requested" = "none";
  if (rawStatus === "in_review" || rawStatus === "under_review" || rawStatus === "submitted") {
    status = "in_review";
  } else if (rawStatus === "approved" || rawStatus === "completed") {
    status = "approved";
  } else if (rawStatus === "changes_requested") {
    status = "changes_requested";
  }

  const note = raw.note || raw.notes;
  const lastRun = raw.lastRun || raw.last_run ? adaptRun(raw.lastRun || raw.last_run) : undefined;

  return {
    status,
    note,
    lastRun,
  };
}
