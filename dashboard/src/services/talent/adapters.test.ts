import { describe, it, expect } from 'vitest';
import {
  adaptFreelancerProfile,
  adaptMatchesResponse,
} from './adapters';

describe('Talent Service Adapters', () => {
  // Fixture from FRONTEND_CONTRACT.md Section 5.1 & Section 8
  const contractFreelancerFixture = {
    id: 'usr-uuid-2',
    full_name: 'Priya Sharma',
    bio: 'Full-stack developer with 5+ years experience in Python and React.',
    skills: ['python', 'react', 'fastapi', 'docker'],
    experience_years: 5,
    availability: 'AVAILABLE',
  };

  it('adapts backend freelancer fixture from contract to FreelancerProfile', () => {
    const profile = adaptFreelancerProfile(contractFreelancerFixture);

    expect(profile.id).toBe('usr-uuid-2');
    expect(profile.displayName).toBe('Priya Sharma');
    expect(profile.headline).toBe('Full-stack developer with 5+ years experience in Python and React.');
    expect(profile.bio).toBe('Full-stack developer with 5+ years experience in Python and React.');
    expect(profile.skills).toEqual(['python', 'react', 'fastapi', 'docker']);
    expect(profile.experience).toBe('MID_LEVEL');
    expect(profile.availability).toBe('IMMEDIATE');
  });

  it('adapts matches response envelope', () => {
    const mockEnvelope = {
      status: 'ready' as const,
      computedAt: '2026-11-13T10:00:00Z',
      totalCandidates: 1,
      items: [],
    };

    const res = adaptMatchesResponse(mockEnvelope);
    expect(res.status).toBe('ready');
    expect(res.totalCandidates).toBe(1);
  });
});
