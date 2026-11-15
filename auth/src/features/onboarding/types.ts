export type UserRole = "owner" | "freelancer";

export interface AccountFormData {
  displayName: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface OwnerStep1Data {
  ownerType: string;
  organizationName: string;
  roleTitle: string;
  timezone: string;
}

export interface OwnerStep2Data {
  primaryStack: string[];
  typicalBlocker: string;
}

export interface OwnerStep3Data {
  defaultBudgetRange: string;
  preferredVerificationMode: string;
}

export interface FreelancerStep1Data {
  headline: string;
  experience: string;
  githubUsername?: string;
  portfolioUrl?: string;
  bio: string;
}

export interface FreelancerStep2Data {
  supportedStacks: string[];
  skills: string[];
  debuggingSpecialties: string[];
}

export interface FreelancerStep3Data {
  availability: string;
  minBudget: number;
  acceptsIsolatedWorkspace: true;
  acceptsTestGate: true;
}

export interface OnboardingDraft {
  userId: string;
  role: UserRole;
  step: number;
  owner?: Partial<OwnerStep1Data & OwnerStep2Data & OwnerStep3Data>;
  freelancer?: Partial<FreelancerStep1Data & FreelancerStep2Data & FreelancerStep3Data>;
}
