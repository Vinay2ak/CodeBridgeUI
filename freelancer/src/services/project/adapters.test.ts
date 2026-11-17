import { describe, it, expect } from "vitest";
import {
  adaptProjectScope,
  adaptProjectState,
  adaptEscrowState,
  adaptWorkspaceContainerInfo,
  adaptTestSuiteResult,
  adaptSubmissionPayloadToBackend,
  adaptSubmissionRecord,
} from "./adapters";

describe("project adapters", () => {
  it("adapts backend project item from contract section 5.2 (GET /api/v1/projects)", () => {
    // Exact fixture from contract line 363-365 & 689-691
    const backendFixture = {
      id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      owner_id: "c1f7b8c2-2849-4177-bb89-7cf1f7823f66",
      title: "Fix payment callback webhook race condition",
      description: "Payment succeeds but the callback is not saving the final status.",
      status: "IN_PROGRESS",
      budget: 5000,
      currency: "INR",
      deadline: "2026-09-10",
      required_skills: ["Python", "FastAPI", "React"],
      expected_result: "Payment status is stored correctly after callback.",
      escrow_status: "HELD",
    };

    const project = adaptProjectScope(backendFixture);

    expect(project.id).toBe("3fa85f64-5717-4562-b3fc-2c963f66afa6");
    expect(project.title).toBe("Fix payment callback webhook race condition");
    expect(project.projectState).toBe("in_progress");
    expect(project.escrowState).toBe("held");
    expect(project.budget).toBe(5000);
    expect(project.skills).toEqual(["Python", "FastAPI", "React"]);
    expect(project.github.status).toBe("connected");
  });

  it("adapts backend workspace container info (POST /api/v1/workspace/projects/{id})", () => {
    // Exact fixture from contract line 417-422
    const backendWs = {
      workspace_id: "ws_1024",
      status: "READY",
      container_id: "cb-cnt-90214",
      image_tag: "codebridge/runner:python3.11",
    };

    const wsInfo = adaptWorkspaceContainerInfo(backendWs, "proj_1024");
    expect(wsInfo.workspaceId).toBe("ws_1024");
    expect(wsInfo.containerId).toBe("cb-cnt-90214");
    expect(wsInfo.state).toBe("ready");
    expect(wsInfo.image).toBe("codebridge/runner:python3.11");
  });

  it("adapts test suite result from contract line 424", () => {
    const backendTestRun = {
      exit_code: 0,
      passed: true,
      output: "pytest tests/test_payment_callback.py: 3 passed in 1.42s",
    };

    const result = adaptTestSuiteResult(backendTestRun);
    expect(result.passed).toBe(true);
    expect(result.exitCode).toBe(0);
    expect(result.steps).toHaveLength(3);
    expect(result.rawOutput).toContain("3 passed");
  });

  it("adapts submission payload to backend format", () => {
    const payload = {
      summary: "Fixed race condition",
      filesModified: "app/payments.py\ntests/test_payments.py",
      testResultStatus: "PASSED" as const,
      reviewerNotes: "Ready for review",
    };

    const backendPayload = adaptSubmissionPayloadToBackend(payload);
    expect(backendPayload.summary).toBe("Fixed race condition");
    expect(backendPayload.files).toEqual(["app/payments.py", "tests/test_payments.py"]);
    expect(backendPayload.reviewer_notes).toBe("Ready for review");
  });

  it("adapts submission record from backend", () => {
    const backendSub = {
      id: "sub_1024",
      status: "UNDER_REVIEW",
      summary: "Implemented distributed lock",
      files: ["app/payments.py"],
      created_at: "2026-11-17T12:00:00Z",
    };

    const record = adaptSubmissionRecord(backendSub, "proj_1024");
    expect(record.id).toBe("sub_1024");
    expect(record.status).toBe("in_review");
    expect(record.filesModified).toEqual(["app/payments.py"]);
  });

  it("maps project and escrow enums", () => {
    expect(adaptProjectState("OPEN")).toBe("open");
    expect(adaptProjectState("IN_PROGRESS")).toBe("in_progress");
    expect(adaptProjectState("COMPLETED")).toBe("completed");
    expect(adaptEscrowState("HELD")).toBe("held");
    expect(adaptEscrowState("RELEASED")).toBe("released");
  });
});
