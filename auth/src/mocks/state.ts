// Shared in-memory state for mock handlers
export const githubLinks = new Map<string, string>(); // userId -> githubUsername

let talentDown = false;
let githubDown = false;
let _forcedFieldError: string | null = null;

export function setTalentDown(val: boolean): void { talentDown = val; }
export function isTalentDown(): boolean { return talentDown; }

export function setGithubDown(val: boolean): void { githubDown = val; }
export function isGithubDown(): boolean { return githubDown; }

export function setForcedFieldError(field: string | null): void { _forcedFieldError = field; }
export function getForcedFieldError(): string | null { return _forcedFieldError; }
export function consumeForcedFieldError(): string | null {
  const v = _forcedFieldError;
  _forcedFieldError = null;
  return v;
}

const freelancerProfiles = new Map<string, Record<string, unknown>>();
export function setFreelancerProfile(userId: string, profile: Record<string, unknown>): void {
  freelancerProfiles.set(userId, profile);
}
export function getFreelancerProfile(userId: string): Record<string, unknown> | undefined {
  return freelancerProfiles.get(userId);
}
