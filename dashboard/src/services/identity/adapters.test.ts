import { describe, it, expect } from 'vitest';
import {
  adaptUser,
  adaptLoginResponse,
  adaptRegisterRequest,
  adaptOwnerProfileResponse,
} from './adapters';

describe('Identity Service Adapters', () => {
  // Fixture from FRONTEND_CONTRACT.md Section 5.1 & 1.2
  const contractUserFixture = {
    id: 'c1f7b8c2-2849-4177-bb89-7cf1f7823f66',
    email: 'owner@startup.io',
    full_name: 'Asha Owner',
    role: 'OWNER',
    status: 'active',
    created_at: '2026-11-13T10:00:00Z',
  };

  const contractLoginFixture = {
    access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy',
    token_type: 'bearer',
    expires_in: 900,
    refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refresh',
    user: contractUserFixture,
  };

  it('adapts backend user fixture from contract into internal User shape', () => {
    const user = adaptUser(contractUserFixture);

    expect(user.id).toBe('c1f7b8c2-2849-4177-bb89-7cf1f7823f66');
    expect(user.email).toBe('owner@startup.io');
    expect(user.displayName).toBe('Asha Owner');
    expect(user.role).toBe('owner');
    expect(user.status).toBe('active');
    expect(user.createdAt).toBe('2026-11-13T10:00:00Z');
  });

  it('adapts backend login response fixture from contract', () => {
    const adapted = adaptLoginResponse(contractLoginFixture);

    expect(adapted.accessToken).toBe('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy');
    expect(adapted.refreshToken).toBe('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refresh');
    expect(adapted.user.displayName).toBe('Asha Owner');
    expect(adapted.user.role).toBe('owner');
    expect(adapted.expiresIn).toBe(900);
  });

  it('adapts internal register request to backend schema', () => {
    const payload = adaptRegisterRequest({
      email: 'owner@startup.io',
      password: 'StrongPassword123!',
      displayName: 'Asha Owner',
      role: 'owner',
    });

    expect(payload).toEqual({
      email: 'owner@startup.io',
      password: 'StrongPassword123!',
      full_name: 'Asha Owner',
      role: 'OWNER',
    });
  });

  it('adapts owner profile response envelope', () => {
    const envelope = {
      profile: {
        owner_type: 'INDIVIDUAL',
        organization_name: 'Startup Inc',
        role_title: 'CTO',
      },
      onboardingCompleted: true,
    };

    const adapted = adaptOwnerProfileResponse(envelope);
    expect(adapted.ownerType).toBe('INDIVIDUAL');
    expect(adapted.organizationName).toBe('Startup Inc');
    expect(adapted.roleTitle).toBe('CTO');
  });
});
