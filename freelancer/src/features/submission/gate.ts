import { Run } from "../../services/submission/types";

export interface ComputeGateParams {
  workspaceStatus: string;
  run: Run | null;
  stale: boolean;
  requiredTestIds: string[];
  submissionStatus?: string;
}

export interface GateResult {
  canSubmit: boolean;
  reasons: string[];
}

export function isRunStale(runCompletedAt: number | null, lastSavedAt: number | null): boolean {
  if (!runCompletedAt || !lastSavedAt) {
    return false;
  }
  return lastSavedAt > runCompletedAt;
}

export function computeGate(params: ComputeGateParams): GateResult {
  const { workspaceStatus, run, stale, requiredTestIds, submissionStatus } = params;
  const reasons: string[] = [];

  if (submissionStatus === "in_review") {
    return {
      canSubmit: false,
      reasons: ["Submission is currently in review"],
    };
  }

  if (workspaceStatus !== "running" && workspaceStatus !== "idle") {
    reasons.push("Workspace must be running or idle");
  }

  if (!run) {
    reasons.push("Run the tests");
  } else {
    if (run.status !== "completed") {
      reasons.push("Test run in progress");
    }

    if (stale) {
      reasons.push("Code changed since the last run");
    }

    const testResultsMap = new Map(run.results.map((r) => [r.testId, r.status]));
    let failingRequiredCount = 0;

    for (const testId of requiredTestIds) {
      const status = testResultsMap.get(testId);
      if (status !== "passed") {
        failingRequiredCount++;
      }
    }

    if (failingRequiredCount > 0) {
      reasons.push(
        `${failingRequiredCount} required ${failingRequiredCount === 1 ? "test" : "tests"} failing`
      );
    }
  }

  return {
    canSubmit: reasons.length === 0,
    reasons,
  };
}

