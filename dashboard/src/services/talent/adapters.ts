import {
  FreelancerProfile,
  FreelancerSummary,
  MatchesResponse,
} from './types';

export function adaptFreelancerSummary(raw: any): FreelancerSummary {
  const skills = Array.isArray(raw?.skills) ? raw.skills : [];
  const years = typeof raw?.experience_years === 'number' ? raw.experience_years : 4;
  const experience =
    years >= 7
      ? 'SENIOR'
      : years >= 3
      ? 'MID_LEVEL'
      : years >= 1
      ? 'JUNIOR'
      : 'STUDENT_EMERGING';

  const rawAvail = (raw?.availability || '').toUpperCase();
  const availability =
    rawAvail === 'AVAILABLE' || rawAvail === 'IMMEDIATE'
      ? 'IMMEDIATE'
      : rawAvail === 'BUSY' || rawAvail === 'HOURS_10_20'
      ? 'HOURS_10_20'
      : rawAvail === 'WEEKEND_SPRINTS'
      ? 'WEEKEND_SPRINTS'
      : 'BOOKED';

  return {
    id: raw?.id || '',
    displayName: raw?.full_name || raw?.displayName || 'Developer',
    headline: raw?.bio || raw?.headline || 'Full Stack Engineer',
    experience,
    availability,
    minBudget: raw?.min_budget ?? raw?.minBudget ?? 3000,
    githubVerified: Boolean(raw?.github_verified ?? raw?.githubVerified ?? true),
    verifiedWorkCount: raw?.verified_work_count ?? raw?.verifiedWorkCount ?? 12,
    rating: raw?.rating ?? 4.9,
    supportedStacks: raw?.supportedStacks || skills,
    debuggingSpecialties: raw?.debuggingSpecialties || ['API Integration', 'Performance Debugging'],
    skills,
    isNew: Boolean(raw?.is_new ?? raw?.isNew ?? false),
  };
}

export function adaptFreelancerProfile(raw: any): FreelancerProfile {
  const base = adaptFreelancerSummary(raw);
  return {
    ...base,
    bio: raw?.bio || '',
    githubUsername: raw?.github_username ?? raw?.githubUsername ?? null,
    portfolioUrl: raw?.portfolio_url ?? raw?.portfolioUrl ?? null,
    memberSince: raw?.created_at || raw?.memberSince || '2026-01-01',
  };
}

export function adaptMatchesResponse(raw: any): MatchesResponse {
  if (!raw) {
    return {
      status: 'ready',
      computedAt: null,
      totalCandidates: 0,
      items: [],
    };
  }

  const items = Array.isArray(raw.items) ? raw.items : [];
  return {
    status: raw.status || 'ready',
    computedAt: raw.computedAt || raw.computed_at || null,
    totalCandidates: raw.totalCandidates ?? raw.total_candidates ?? items.length,
    items,
  };
}
