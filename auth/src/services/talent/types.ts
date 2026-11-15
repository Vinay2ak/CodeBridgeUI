export interface FreelancerProfilePayload {
  headline: string;
  experience: string;
  githubUsername?: string;
  portfolioUrl?: string;
  bio: string;
  supportedStacks: string[];
  skills: string[];
  debuggingSpecialties: string[];
  availability: string;
  minBudget: number;
  acceptsIsolatedWorkspace: true;
  acceptsTestGate: true;
}

export interface FreelancerProfile extends FreelancerProfilePayload {
  githubVerified: boolean;
  rating: null;
}

export interface SaveFreelancerProfileResponse {
  profile: FreelancerProfile;
  onboardingCompleted: true;
}
