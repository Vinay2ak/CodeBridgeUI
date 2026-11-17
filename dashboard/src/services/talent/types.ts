export type ExperienceLevel = 'STUDENT_EMERGING' | 'JUNIOR' | 'MID_LEVEL' | 'SENIOR';
export type AvailabilityType = 'IMMEDIATE' | 'HOURS_10_20' | 'WEEKEND_SPRINTS' | 'BOOKED';

export interface FreelancerSummary {
  id: string;
  displayName: string;
  headline: string;
  experience: ExperienceLevel;
  availability: AvailabilityType;
  minBudget: number;
  githubVerified: boolean;
  verifiedWorkCount: number;
  rating: number | null;
  supportedStacks: string[];
  debuggingSpecialties: string[];
  skills: string[];
  isNew: boolean;
}

export interface FreelancerProfile extends FreelancerSummary {
  bio: string;
  githubUsername: string | null;
  portfolioUrl: string | null;
  memberSince: string;
}

export interface BreakdownItem {
  points: number;
  max: number;
}

export interface MatchBreakdown {
  stack: BreakdownItem;
  specialty: BreakdownItem;
  skills: BreakdownItem;
  budget: BreakdownItem;
  availability: BreakdownItem;
  experience: BreakdownItem;
  trust: BreakdownItem;
}

export interface Match {
  freelancer: FreelancerSummary;
  score: number;
  label: 'excellent' | 'strong' | 'good' | 'partial';
  breakdown: MatchBreakdown;
  reasons: string[];
  warnings: string[];
  shortlisted: boolean;
}

export interface MatchesResponse {
  status: 'computing' | 'ready' | 'failed';
  computedAt: string | null;
  totalCandidates: number;
  items: Match[];
}
