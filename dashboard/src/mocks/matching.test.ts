import { describe, it, expect } from 'vitest';
import { scoreFreelancer, rankFreelancers } from './matching';
import type { ProjectDetail } from '../services/project/types';
import type { FreelancerSummary } from '../services/talent/types';
import { mockFreelancers } from './data/freelancers';

const baseProject: ProjectDetail = {
  id: 'p-1',
  title: 'Fix FastAPI webhook signature verification error',
  description: 'Webhook verification failing on production FastAPI microservice with HMAC SHA256.',
  blockerType: 'HARD_BUG',
  stacks: ['PYTHON_FASTAPI'],
  specialties: ['PAYMENT_WEBHOOKS', 'TESTING'],
  skills: ['Python', 'FastAPI', 'Pytest'],
  budget: 5000,
  urgency: 'ASAP',
  size: 'FEATURE_INTEGRATION',
  repoUrl: 'https://github.com/acme/api',
  verificationMode: 'AUTO_TESTS_AND_REVIEW',
  createdAt: '2026-11-01T10:00:00Z',
  matchingStatus: 'ready',
  status: 'open',
  repo: 'acme/api',
  freelancerName: null,
  updatedAt: '2026-11-01T10:00:00Z',
};

const baseFreelancer: FreelancerSummary = {
  id: 'f-test',
  displayName: 'Test Dev',
  headline: 'Full-stack Python & FastAPI Specialist',
  experience: 'MID_LEVEL',
  availability: 'IMMEDIATE',
  minBudget: 3000,
  githubVerified: true,
  verifiedWorkCount: 5,
  rating: 4.9,
  supportedStacks: ['PYTHON_FASTAPI'],
  debuggingSpecialties: ['PAYMENT_WEBHOOKS', 'TESTING'],
  skills: ['Python', 'FastAPI', 'Pytest'],
  isNew: false,
};

describe('matching algorithm', () => {
  it('1. awards full score for perfect stack match', () => {
    const match = scoreFreelancer(baseProject, baseFreelancer);
    expect(match.breakdown.stack.points).toBe(30);
  });

  it('2. calculates partial stack coverage correctly', () => {
    const proj: ProjectDetail = {
      ...baseProject,
      stacks: ['PYTHON_FASTAPI', 'REACT_TS'],
    };
    const match = scoreFreelancer(proj, baseFreelancer);
    expect(match.breakdown.stack.points).toBe(15);
  });

  it('3. uses default specialties when project specialties is empty', () => {
    const proj: ProjectDetail = {
      ...baseProject,
      specialties: [],
      blockerType: 'HARD_BUG', // defaults: TESTING, STATE_MACHINES
    };
    const match = scoreFreelancer(proj, baseFreelancer);
    // baseFreelancer has TESTING (1 of 2) -> 10 pts
    expect(match.breakdown.specialty.points).toBe(10);
  });

  it('4. matches skills case-insensitively', () => {
    const proj: ProjectDetail = {
      ...baseProject,
      skills: ['PYTHON', 'fastapi'],
    };
    const match = scoreFreelancer(proj, baseFreelancer);
    expect(match.breakdown.skills.points).toBe(15);
  });

  it('5. awards full budget points when project budget >= minBudget', () => {
    const match = scoreFreelancer(baseProject, { ...baseFreelancer, minBudget: 4000 });
    expect(match.breakdown.budget.points).toBe(10);
    expect(match.warnings.some((w) => w.includes('Minimum budget'))).toBe(false);
  });

  it('6. applies penalty and warning when project budget < minBudget', () => {
    const match = scoreFreelancer(baseProject, { ...baseFreelancer, minBudget: 10000 });
    expect(match.breakdown.budget.points).toBeLessThan(10);
    expect(match.warnings.some((w) => w.includes('Minimum budget'))).toBe(true);
  });

  it('7. scores availability based on urgency ASAP', () => {
    const immediate = scoreFreelancer(baseProject, { ...baseFreelancer, availability: 'IMMEDIATE' });
    const booked = scoreFreelancer(baseProject, { ...baseFreelancer, availability: 'BOOKED' });
    expect(immediate.breakdown.availability.points).toBe(10);
    expect(booked.breakdown.availability.points).toBe(0);
    expect(booked.warnings).toContain('Currently booked');
  });

  it('8. scores availability based on urgency FLEXIBLE', () => {
    const proj: ProjectDetail = { ...baseProject, urgency: 'FLEXIBLE' };
    const weekend = scoreFreelancer(proj, { ...baseFreelancer, availability: 'WEEKEND_SPRINTS' });
    expect(weekend.breakdown.availability.points).toBe(8);
  });

  it('9. scores experience level against project size', () => {
    const complexProj: ProjectDetail = { ...baseProject, size: 'COMPLEX_MODULE', budget: 15000 };
    const student = scoreFreelancer(complexProj, { ...baseFreelancer, experience: 'STUDENT_EMERGING' });
    const senior = scoreFreelancer(complexProj, { ...baseFreelancer, experience: 'SENIOR' });
    expect(student.breakdown.experience.points).toBe(2);
    expect(student.warnings).toContain('Work size might exceed current experience level');
    expect(senior.breakdown.experience.points).toBe(10);
  });

  it('10. handles unrated freelancer with warning', () => {
    const unrated = scoreFreelancer(baseProject, { ...baseFreelancer, rating: null });
    expect(unrated.warnings).toContain('No ratings yet');
  });

  it('11. assigns correct quality label (excellent, strong, good, partial)', () => {
    const perfect = scoreFreelancer(baseProject, baseFreelancer);
    expect(perfect.score).toBeGreaterThanOrEqual(80);
    expect(perfect.label).toBe('excellent');

    const lowScore = scoreFreelancer(
      { ...baseProject, stacks: ['AI_RAG_PIPELINES'], specialties: ['STATE_MACHINES'], skills: ['LlamaIndex'], budget: 1000 },
      { ...baseFreelancer, supportedStacks: ['NODE'], debuggingSpecialties: ['DB_MIGRATIONS'], skills: ['JavaScript'], minBudget: 20000, availability: 'BOOKED' }
    );
    expect(lowScore.score).toBeLessThan(50);
    expect(lowScore.label).toBe('partial');
  });

  it('12. rankFreelancers ranks mock developers deterministically and returns top 10', () => {
    const ranked = rankFreelancers(baseProject, mockFreelancers);
    expect(ranked.length).toBeLessThanOrEqual(10);
    expect(ranked.length).toBeGreaterThan(0);
    // Highest score first
    for (let i = 0; i < ranked.length - 1; i++) {
      expect(ranked[i].score).toBeGreaterThanOrEqual(ranked[i + 1].score);
    }
    // Top freelancer for Python FastAPI webhook bug should be f-2 (Rohan Mehta) or f-1 / f-6
    expect(['f-1', 'f-2', 'f-6']).toContain(ranked[0].freelancer.id);
  });

  it('13. rankFreelancers falls back gracefully when fewer than 3 meet 50 points', () => {
    const obscureProj: ProjectDetail = {
      ...baseProject,
      stacks: ['UNKNOWN_STACK'],
      budget: 500,
    };
    const ranked = rankFreelancers(obscureProj, mockFreelancers);
    expect(ranked.length).toBeGreaterThan(0);
    expect(ranked[0].warnings).toContain('No overlap with the stacks you need');
  });
});
