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

export interface FreelancerProfileData {
  displayName: string;
  email: string;
  bio: string;
  headline: string;
  githubUsername: string;
  experienceYears: number;
  availability: "AVAILABLE" | "BUSY" | "OPEN_TO_OFFERS";
  skills: string[];
  preferredStack: string;
  notifications: {
    newMatchingTasks: boolean;
    escrowUpdates: boolean;
    testGateResults: boolean;
    clientMessages: boolean;
  };
  workspaceSettings: {
    defaultImage: string;
    autoRunTests: boolean;
    isolatedNetwork: boolean;
  };
}
