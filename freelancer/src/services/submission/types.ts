export type TestStatus = "pending" | "running" | "passed" | "failed";

export interface TestResult {
  testId: string;
  status: TestStatus;
  durationMs?: number;
  message?: string;
}

export interface Run {
  runId: string;
  taskId: string;
  status: "running" | "completed";
  results: TestResult[];
}

export interface RunStartResponse {
  runId: string;
}

export interface SubmissionResponse {
  submissionId: string;
  status: "in_review";
}

export interface CurrentSubmissionResponse {
  status: "none" | "in_review" | "approved" | "changes_requested";
  note?: string;
  lastRun?: Run;
}

