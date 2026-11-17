import { describe, it, expect } from "vitest";
import {
  adaptRun,
  adaptRunStartResponse,
  adaptSubmissionResponse,
  adaptCurrentSubmissionResponse,
} from "./adapters";

describe("submission adapters", () => {
  it("adapts run start response from contract line 445 (POST /api/v1/submissions/runs)", () => {
    const backendFixture = { runId: "run_98765" };
    const res = adaptRunStartResponse(backendFixture);
    expect(res.runId).toBe("run_98765");
  });

  it("adapts run details from contract line 446 (GET /api/v1/submissions/runs/{run_id})", () => {
    const backendFixture = {
      runId: "run_98765",
      taskId: "task-1",
      status: "completed",
      results: [
        {
          testId: "test_payment_callback_persists_status",
          status: "passed",
          message: "Pass (420ms)",
        },
      ],
    };

    const run = adaptRun(backendFixture);
    expect(run.runId).toBe("run_98765");
    expect(run.taskId).toBe("task-1");
    expect(run.status).toBe("completed");
    expect(run.results[0].testId).toBe("test_payment_callback_persists_status");
    expect(run.results[0].status).toBe("passed");
  });

  it("adapts submission creation from contract line 447 (POST /api/v1/submissions)", () => {
    const backendFixture = {
      submissionId: "sub_1024",
      status: "in_review",
    };

    const res = adaptSubmissionResponse(backendFixture);
    expect(res.submissionId).toBe("sub_1024");
    expect(res.status).toBe("in_review");
  });

  it("adapts current submission from contract line 448 (GET /api/v1/submissions/current)", () => {
    const backendFixture = {
      status: "in_review",
      note: "Implemented Redis locking",
      lastRun: {
        runId: "run_98765",
        status: "completed",
        results: [],
      },
    };

    const current = adaptCurrentSubmissionResponse(backendFixture);
    expect(current.status).toBe("in_review");
    expect(current.note).toBe("Implemented Redis locking");
    expect(current.lastRun?.runId).toBe("run_98765");
  });
});
