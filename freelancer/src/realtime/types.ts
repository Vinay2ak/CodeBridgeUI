export interface CbEnvelope<T = unknown> {
  id: string;
  type: string;
  occurredAt: string;
  source: string;
  correlationId: string;
  data: T;
}

export type WorkspaceStatus = "stopped" | "provisioning" | "starting" | "running" | "idle" | "error";
export type PaymentState = "authorized" | "held" | "tested" | "approved" | "released";
export type SubmissionStatus = "none" | "in_review" | "approved" | "changes_requested";

export interface WorkspaceStatusChangedData {
  taskId: string;
  status: WorkspaceStatus;
}

export interface TestRunProgressData {
  taskId: string;
  runId: string;
  testId: string;
  status: "running" | "passed" | "failed";
}

export interface TestRunCompletedData {
  taskId: string;
  runId: string;
  passed: number;
  failed: number;
  requiredPassed: boolean;
}

export interface SubmissionStatusChangedData {
  taskId: string;
  status: "in_review" | "approved" | "changes_requested";
  note?: string;
}

export interface PaymentStateChangedData {
  taskId: string;
  state: PaymentState;
}

export interface TaskAssignedData {
  taskId: string;
  title: string;
  projectTitle: string;
}

export type CbEvent =
  | CbEnvelope<WorkspaceStatusChangedData> & { type: "workspace.status_changed" }
  | CbEnvelope<TestRunProgressData> & { type: "test.run.progress" }
  | CbEnvelope<TestRunCompletedData> & { type: "test.run.completed" }
  | CbEnvelope<SubmissionStatusChangedData> & { type: "submission.status_changed" }
  | CbEnvelope<PaymentStateChangedData> & { type: "payment.state_changed" }
  | CbEnvelope<TaskAssignedData> & { type: "task.assigned" }
  | CbEnvelope<unknown>;

