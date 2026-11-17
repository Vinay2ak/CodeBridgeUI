import { describe, it, expect } from "vitest";
import { adaptPortfolioSummary, adaptVerifiedWorkRecord } from "./adapters";

describe("profile adapters", () => {
  it("adapts backend verified record from contract section 5.7 (GET /api/v1/profile/verified-work)", () => {
    // Exact fixture from contract line 465-472
    const backendRecord = {
      id: "CB-VER-891",
      project_id: "proj_1024",
      project_title: "Fix payment callback webhook race condition",
      completed_at: "2026-09-08T18:30:00.000Z",
      payout_amount: 5000,
      currency: "INR",
      payout_status: "RELEASED",
      skills_proven: ["Python", "FastAPI", "PostgreSQL", "Pytest", "Idempotency"],
      verification_badge: "VERIFIED_TEST_PASS_100",
      repo_ref: "git.codebridge.dev/repos/proj_1024@c4b2a8f",
      reviewer: "Verified by CodeBridge Automated Escrow Test-Gate",
      recruiter_proof_url: "https://verify.codebridge.dev/c/CB-VER-891-92A8",
    };

    const record = adaptVerifiedWorkRecord(backendRecord);
    expect(record.id).toBe("CB-VER-891");
    expect(record.projectId).toBe("proj_1024");
    expect(record.projectTitle).toBe("Fix payment callback webhook race condition");
    expect(record.completedAt).toBe("2026-09-08T18:30:00.000Z");
    expect(record.payoutAmount).toBe(5000);
    expect(record.skillsProven).toContain("Python");
    expect(record.recruiterProofUrl).toBe("https://verify.codebridge.dev/c/CB-VER-891-92A8");
  });

  it("calculates summary statistics correctly from array of records", () => {
    const rawList = [
      {
        id: "CB-VER-1",
        project_id: "proj_1",
        payout_amount: 5000,
        skills_proven: ["Python", "Docker"],
      },
      {
        id: "CB-VER-2",
        project_id: "proj_2",
        payout_amount: 3000,
        skills_proven: ["TypeScript", "Python"],
      },
    ];

    const summary = adaptPortfolioSummary(rawList);
    expect(summary.verifiedProjectsCount).toBe(2);
    expect(summary.escrowEarningsReleased).toBe(8000);
    expect(summary.skillsProvenCount).toBe(3); // Python, Docker, TypeScript
    expect(summary.testPassRate).toBe(100);
  });
});
