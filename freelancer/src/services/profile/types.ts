export interface VerifiedWorkRecord {
  id: string;
  projectId: string;
  projectTitle: string;
  completedAt: string;
  payoutAmount: number;
  currency: "INR";
  payoutStatus: "RELEASED";
  skillsProven: string[];
  verificationBadge: string;
  repoRef: string;
  reviewer: string;
  recruiterProofUrl: string;
}

export interface PortfolioSummary {
  verifiedProjectsCount: number;
  escrowEarningsReleased: number;
  testPassRate: number;
  skillsProvenCount: number;
  records: VerifiedWorkRecord[];
}
