import { describe, it, expect } from 'vitest';
import { applyFilters, sortMatches } from './filterSort';
import { Match } from '../../services/talent/types';

function createDummyMatch(partial: Partial<Match> & { id: string; minBudget?: number; availability?: any; githubVerified?: boolean }): Match {
  return {
    freelancer: {
      id: partial.id,
      displayName: `Dev ${partial.id}`,
      headline: 'Full-stack developer',
      experience: 'MID_LEVEL',
      availability: partial.availability ?? 'IMMEDIATE',
      minBudget: partial.minBudget ?? 2000,
      githubVerified: partial.githubVerified ?? true,
      verifiedWorkCount: 5,
      rating: 4.8,
      supportedStacks: ['PYTHON_FASTAPI'],
      debuggingSpecialties: ['TESTING'],
      skills: ['Python'],
      isNew: false,
    },
    score: partial.score ?? 85,
    label: partial.label ?? 'excellent',
    breakdown: {
      stack: { points: 30, max: 30 },
      specialty: { points: 20, max: 20 },
      skills: { points: 15, max: 15 },
      budget: { points: 10, max: 10 },
      availability: { points: 10, max: 10 },
      experience: { points: 10, max: 10 },
      trust: { points: 5, max: 5 },
    },
    reasons: partial.reasons ?? ['FastAPI expert'],
    warnings: partial.warnings ?? [],
    shortlisted: partial.shortlisted ?? false,
  };
}

describe('applyFilters and sortMatches', () => {
  const m1 = createDummyMatch({
    id: 'f-1',
    minBudget: 5000,
    availability: 'BOOKED',
    githubVerified: true,
    warnings: ['Minimum budget ₹5000 is ₹1000 above your budget'],
    shortlisted: false,
    score: 90,
  });

  const m2 = createDummyMatch({
    id: 'f-2',
    minBudget: 2500,
    availability: 'IMMEDIATE',
    githubVerified: true,
    warnings: [],
    shortlisted: true,
    score: 85,
  });

  const m3 = createDummyMatch({
    id: 'f-3',
    minBudget: 1500,
    availability: 'HOURS_10_20',
    githubVerified: false,
    warnings: [],
    shortlisted: false,
    score: 75,
  });

  const m4 = createDummyMatch({
    id: 'f-4',
    minBudget: 800,
    availability: 'WEEKEND_SPRINTS',
    githubVerified: true,
    warnings: [],
    shortlisted: true,
    score: 70,
  });

  const all = [m1, m2, m3, m4];

  it('1. filters by fitsBudget (excludes items with budget warning)', () => {
    const filtered = applyFilters(all, { fitsBudget: true });
    expect(filtered.map((m) => m.freelancer.id)).toEqual(['f-2', 'f-3', 'f-4']);
  });

  it('2. filters by availableNow (only IMMEDIATE)', () => {
    const filtered = applyFilters(all, { availableNow: true });
    expect(filtered.map((m) => m.freelancer.id)).toEqual(['f-2']);
  });

  it('3. filters by githubVerified (only githubVerified: true)', () => {
    const filtered = applyFilters(all, { githubVerified: true });
    expect(filtered.map((m) => m.freelancer.id)).toEqual(['f-1', 'f-2', 'f-4']);
  });

  it('4. filters by shortlistedOnly', () => {
    const filtered = applyFilters(all, { shortlistedOnly: true });
    expect(filtered.map((m) => m.freelancer.id)).toEqual(['f-2', 'f-4']);
  });

  it('5. combines multiple filters (fitsBudget + shortlistedOnly)', () => {
    const filtered = applyFilters(all, { fitsBudget: true, shortlistedOnly: true });
    expect(filtered.map((m) => m.freelancer.id)).toEqual(['f-2', 'f-4']);
  });

  it('6. sorts matches by price (minBudget ascending)', () => {
    const sorted = sortMatches(all, 'price');
    expect(sorted.map((m) => m.freelancer.id)).toEqual(['f-4', 'f-3', 'f-2', 'f-1']);
  });

  it('7. sorts matches by availability (IMMEDIATE, HOURS_10_20, WEEKEND_SPRINTS, BOOKED)', () => {
    const sorted = sortMatches(all, 'availability');
    expect(sorted.map((m) => m.freelancer.id)).toEqual(['f-2', 'f-3', 'f-4', 'f-1']);
  });

  it('8. preserves server order on best match', () => {
    const sorted = sortMatches(all, 'best');
    expect(sorted.map((m) => m.freelancer.id)).toEqual(['f-1', 'f-2', 'f-3', 'f-4']);
  });
});
