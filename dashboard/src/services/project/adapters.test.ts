import { describe, it, expect } from 'vitest';
import {
  adaptProject,
  adaptProjectDetail,
  adaptProjectsResponse,
  adaptCreateProjectRequest,
  adaptProjectStatus,
} from './adapters';

describe('Project Service Adapters', () => {
  // Fixture from FRONTEND_CONTRACT.md Section 3 & 5.2
  const contractProjectFixture = {
    id: 'proj-uuid-1',
    owner_id: 'usr-uuid-1',
    title: 'Fix Stripe webhook signature verification',
    description: 'The webhook endpoint intermittently fails signature checks under high concurrency.',
    budget: 5000,
    currency: 'INR',
    deadline: '2026-11-20T18:30:00Z',
    required_skills: ['python', 'stripe', 'fastapi'],
    expected_result: 'Webhook handles signature verification failures gracefully.',
    status: 'OPEN',
    created_at: '2026-11-13T10:00:00Z',
    updated_at: '2026-11-13T10:00:00Z',
  };

  const contractProjectsListFixture = {
    items: [contractProjectFixture],
    total: 1,
    page: 1,
  };

  it('maps backend ProjectResponse fixture to internal Project shape', () => {
    const project = adaptProject(contractProjectFixture);

    expect(project.id).toBe('proj-uuid-1');
    expect(project.title).toBe('Fix Stripe webhook signature verification');
    expect(project.status).toBe('open');
    expect(project.budget).toBe(5000);
    expect(project.tags).toEqual(['python', 'stripe', 'fastapi']);
    expect(project.updatedAt).toBe('2026-11-13T10:00:00Z');
  });

  it('maps backend ProjectResponse to ProjectDetail shape', () => {
    const detail = adaptProjectDetail(contractProjectFixture);

    expect(detail.id).toBe('proj-uuid-1');
    expect(detail.description).toBe(contractProjectFixture.description);
    expect(detail.skills).toEqual(['python', 'stripe', 'fastapi']);
    expect(detail.stacks).toEqual(['python', 'stripe', 'fastapi']);
    expect(detail.size).toBe('FEATURE_INTEGRATION');
    expect(detail.matchingStatus).toBe('ready');
  });

  it('adapts list envelope from contract', () => {
    const list = adaptProjectsResponse(contractProjectsListFixture);

    expect(list.items).toHaveLength(1);
    expect(list.items[0].id).toBe('proj-uuid-1');
  });

  it('adapts internal CreateProjectPayload to backend request schema', () => {
    const internalPayload = {
      title: 'Fix Stripe webhook signature verification',
      description: 'The webhook endpoint intermittently fails signature checks under high concurrency.',
      budget: 5000,
      stacks: ['python', 'stripe', 'fastapi'],
      expectedResult: 'Webhook handles signature verification failures gracefully.',
    };

    const backendPayload = adaptCreateProjectRequest(internalPayload);

    expect(backendPayload.title).toBe(internalPayload.title);
    expect(backendPayload.description).toBe(internalPayload.description);
    expect(backendPayload.budget).toBe(5000);
    expect(backendPayload.currency).toBe('INR');
    expect(backendPayload.required_skills).toEqual(['python', 'stripe', 'fastapi']);
    expect(backendPayload.expected_result).toBe(internalPayload.expectedResult);
    expect(backendPayload.deadline).toBeDefined();
    expect(backendPayload.deadline).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('formats deadline as exact YYYY-MM-DD date based on urgency or custom deadline', () => {
    const withIsoDeadline = adaptCreateProjectRequest({
      title: 'T',
      description: 'D',
      budget: 1000,
      deadline: '2026-12-25T14:30:00.000Z',
    });
    expect(withIsoDeadline.deadline).toBe('2026-12-25');

    const withDateDeadline = adaptCreateProjectRequest({
      title: 'T',
      description: 'D',
      budget: 1000,
      deadline: '2026-12-31',
    });
    expect(withDateDeadline.deadline).toBe('2026-12-31');

    const withAsap = adaptCreateProjectRequest({
      title: 'T',
      description: 'D',
      budget: 1000,
      urgency: 'ASAP',
    });
    expect(withAsap.deadline).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('normalizes uppercase backend statuses to lowercase enum', () => {
    expect(adaptProjectStatus('OPEN')).toBe('open');
    expect(adaptProjectStatus('ASSIGNED')).toBe('in_progress');
    expect(adaptProjectStatus('IN_PROGRESS')).toBe('in_progress');
    expect(adaptProjectStatus('CHANGES_REQUESTED')).toBe('in_review');
    expect(adaptProjectStatus('COMPLETED')).toBe('completed');
  });
});
