import { describe, it, expect } from 'vitest';
import { adaptTask, adaptTasksResponse, adaptTaskStatus } from './adapters';

describe('Workspace Service Adapters', () => {
  // Fixture from FRONTEND_CONTRACT.md Section 5.5
  const contractTasksMineFixture = {
    items: [
      {
        id: 'task-uuid-1',
        title: 'Verify webhook signature check',
        projectTitle: 'Fix Stripe webhook signature verification',
        status: 'in_progress',
        reward: 5000,
        dueAt: '2026-11-20T18:30:00Z',
      },
    ],
  };

  it('adapts backend task fixture from contract', () => {
    const raw = contractTasksMineFixture.items[0];
    const task = adaptTask(raw);

    expect(task.id).toBe('task-uuid-1');
    expect(task.title).toBe('Verify webhook signature check');
    expect(task.projectTitle).toBe('Fix Stripe webhook signature verification');
    expect(task.status).toBe('in_progress');
    expect(task.reward).toBe(5000);
    expect(task.dueAt).toBe('2026-11-20T18:30:00Z');
  });

  it('adapts tasks mine response envelope', () => {
    const response = adaptTasksResponse(contractTasksMineFixture);

    expect(response.items).toHaveLength(1);
    expect(response.items[0].id).toBe('task-uuid-1');
  });

  it('normalizes task status', () => {
    expect(adaptTaskStatus('in_progress')).toBe('in_progress');
    expect(adaptTaskStatus('completed')).toBe('verified');
    expect(adaptTaskStatus('other')).toBe('open');
  });
});
