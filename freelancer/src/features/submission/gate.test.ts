import { describe, it, expect } from "vitest";
import { computeGate, isRunStale } from "./gate";
import { Run } from "../../services/submission/types";

describe("Submission Gate Logic", () => {
  const baseRun: Run = {
    runId: "run_test_1",
    taskId: "t1",
    status: "completed",
    results: [
      { testId: "req_1", status: "passed" },
      { testId: "req_2", status: "passed" },
      { testId: "opt_1", status: "passed" },
    ],
  };

  const requiredTestIds = ["req_1", "req_2"];

  it("1. blocks submission when there is no run", () => {
    const res = computeGate({
      workspaceStatus: "running",
      run: null,
      stale: false,
      requiredTestIds,
    });
    expect(res.canSubmit).toBe(false);
    expect(res.reasons).toContain("Run the tests");
  });

  it("2. blocks submission when a required test is failing", () => {
    const failingRun: Run = {
      ...baseRun,
      results: [
        { testId: "req_1", status: "passed" },
        { testId: "req_2", status: "failed", message: "Assertion error" },
        { testId: "opt_1", status: "passed" },
      ],
    };
    const res = computeGate({
      workspaceStatus: "running",
      run: failingRun,
      stale: false,
      requiredTestIds,
    });
    expect(res.canSubmit).toBe(false);
    expect(res.reasons).toContain("1 required test failing");
  });

  it("3. allows submission when all required tests pass", () => {
    const res = computeGate({
      workspaceStatus: "running",
      run: baseRun,
      stale: false,
      requiredTestIds,
    });
    expect(res.canSubmit).toBe(true);
    expect(res.reasons).toHaveLength(0);
  });

  it("4. blocks submission when run is stale", () => {
    const res = computeGate({
      workspaceStatus: "running",
      run: baseRun,
      stale: true,
      requiredTestIds,
    });
    expect(res.canSubmit).toBe(false);
    expect(res.reasons).toContain("Code changed since the last run");
  });

  it("5. allows submission when an optional test is failing but all required tests pass", () => {
    const optionalFailingRun: Run = {
      ...baseRun,
      results: [
        { testId: "req_1", status: "passed" },
        { testId: "req_2", status: "passed" },
        { testId: "opt_1", status: "failed", message: "Optional style check failed" },
      ],
    };
    const res = computeGate({
      workspaceStatus: "running",
      run: optionalFailingRun,
      stale: false,
      requiredTestIds,
    });
    expect(res.canSubmit).toBe(true);
    expect(res.reasons).toHaveLength(0);
  });

  it("6. blocks submission when workspace is stopped", () => {
    const res = computeGate({
      workspaceStatus: "stopped",
      run: baseRun,
      stale: false,
      requiredTestIds,
    });
    expect(res.canSubmit).toBe(false);
    expect(res.reasons).toContain("Workspace must be running or idle");
  });

  it("7. blocks submission when a submission is already in review", () => {
    const res = computeGate({
      workspaceStatus: "running",
      run: baseRun,
      stale: false,
      requiredTestIds,
      submissionStatus: "in_review",
    });
    expect(res.canSubmit).toBe(false);
    expect(res.reasons).toContain("Submission is currently in review");
  });

  it("8. blocks submission when changes are requested and run has not been rerun", () => {
    const res = computeGate({
      workspaceStatus: "running",
      run: baseRun,
      stale: true,
      requiredTestIds,
      submissionStatus: "changes_requested",
    });
    expect(res.canSubmit).toBe(false);
    expect(res.reasons).toContain("Code changed since the last run");
  });

  it("9. correctly detects staleness via isRunStale helper", () => {
    const runTime = 10000;
    const saveBeforeRun = 9000;
    const saveAfterRun = 11000;

    expect(isRunStale(runTime, saveBeforeRun)).toBe(false);
    expect(isRunStale(runTime, saveAfterRun)).toBe(true);
    expect(isRunStale(null, saveAfterRun)).toBe(false);
    expect(isRunStale(runTime, null)).toBe(false);
  });
});

