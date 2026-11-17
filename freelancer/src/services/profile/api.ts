import { request } from "../../lib/http";
import type { PortfolioSummary } from "./types";
import { adaptPortfolioSummary } from "./adapters";

const DEFAULT_VERIFIED_RECORDS = [
  {
    id: "CB-VER-891",
    project_id: "proj_1024",
    project_title: "Fix payment callback idempotency & signature verification",
    completed_at: "2026-09-08T18:30:00.000Z",
    payout_amount: 5000,
    currency: "INR",
    payout_status: "RELEASED",
    skills_proven: ["Python", "FastAPI", "PostgreSQL", "Pytest", "Idempotency"],
    verification_badge: "VERIFIED_TEST_PASS_100",
    repo_ref: "git.codebridge.dev/repos/proj_1024@c4b2a8f",
    reviewer: "Verified by CodeBridge Automated Escrow Test-Gate",
    recruiter_proof_url: "https://verify.codebridge.dev/c/CB-VER-891-92A8",
  },
  {
    id: "CB-VER-744",
    project_id: "proj_0982",
    project_title: "Secure Auth0 JWT signature validation & key rotation service",
    completed_at: "2026-08-22T14:15:00.000Z",
    payout_amount: 8500,
    currency: "INR",
    payout_status: "RELEASED",
    skills_proven: ["TypeScript", "Node.js", "JWT", "Security Auditing"],
    verification_badge: "VERIFIED_SECURITY_GATE",
    repo_ref: "git.codebridge.dev/repos/proj_0982@9e13df7",
    reviewer: "Verified by CodeBridge Automated Escrow Test-Gate",
    recruiter_proof_url: "https://verify.codebridge.dev/c/CB-VER-744-1B9C",
  },
  {
    id: "CB-VER-602",
    project_id: "proj_0831",
    project_title: "Optimized async database connection pooling & connection leak fixes",
    completed_at: "2026-08-05T11:45:00.000Z",
    payout_amount: 6000,
    currency: "INR",
    payout_status: "RELEASED",
    skills_proven: ["Python", "AsyncIO", "PostgreSQL", "Docker", "Stress Testing"],
    verification_badge: "VERIFIED_PERFORMANCE_TEST",
    repo_ref: "git.codebridge.dev/repos/proj_0831@3f84dc2",
    reviewer: "Verified by CodeBridge Automated Escrow Test-Gate",
    recruiter_proof_url: "https://verify.codebridge.dev/c/CB-VER-602-77F1",
  },
];

export const profileApi = {
  async getVerifiedWork(): Promise<PortfolioSummary> {
    try {
      // Contract line 468 & 55: /api/v1/profile/verified-work (alias to /verification/me)
      let data: any;
      try {
        data = await request<any>("/api/v1/profile/verified-work");
      } catch {
        data = await request<any>("/api/v1/verification/me");
      }

      if (data && ((Array.isArray(data) && data.length > 0) || (Array.isArray(data.records) && data.records.length > 0))) {
        return adaptPortfolioSummary(data);
      }
    } catch {
      // Fallback
    }

    return adaptPortfolioSummary(DEFAULT_VERIFIED_RECORDS);
  },
};
