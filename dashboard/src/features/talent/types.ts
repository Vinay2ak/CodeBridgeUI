export type AvailabilityStatus = 'available' | 'busy' | 'offline';

export interface PastFix {
  id: string;
  projectTitle: string;
  repo: string;
  description: string;
  completedAt: string;
  bounty: number;
  testPassRate: number; // e.g. 100
  reviewScore: number; // e.g. 5.0
  tags: string[];
}

export interface DeveloperProfile {
  id: string;
  name: string;
  avatarUrl?: string;
  roleHeadline: string;
  bio: string;
  availability: AvailabilityStatus;
  isVerified: boolean;
  passRate: number; // e.g. 99
  completedFixes: number; // e.g. 54
  turnaroundTime: string; // e.g. "< 4 hrs"
  typicalRate: string; // e.g. "$130/hr • $600/fix"
  suggestedBudget: number; // e.g. 850
  skills: string[];
  category: 'backend' | 'frontend' | 'security' | 'database' | 'fullstack';
  github: {
    handle: string;
    commitsThisMonth: number;
    prAcceptanceRate: number;
    repoDoctorScore: number;
  };
  testHistory: {
    totalSuitesRun: number;
    passedSuites: number;
    failedSuites: number;
    avgExecutionTimeMs: number;
  };
  pastFixes: PastFix[];
}

export type TalentFilterCategory =
  | 'all'
  | 'available'
  | 'backend'
  | 'frontend'
  | 'security'
  | 'high_pass_rate';
