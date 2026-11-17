import { Task, TasksResponse, TaskStatus } from './types';

export function adaptTaskStatus(rawStatus?: string): TaskStatus {
  const s = (rawStatus || '').toLowerCase();
  if (s === 'in_progress') return 'in_progress';
  if (s === 'in_review') return 'in_review';
  if (s === 'verified' || s === 'completed') return 'verified';
  return 'open';
}

export function adaptTask(raw: any): Task {
  return {
    id: raw?.id || '',
    title: raw?.title || 'Untitled Task',
    projectTitle: raw?.projectTitle || raw?.project_title || 'Project',
    status: adaptTaskStatus(raw?.status),
    dueAt: raw?.dueAt || raw?.due_at || raw?.deadline || new Date().toISOString(),
    reward: typeof raw?.reward === 'number' ? raw.reward : Number(raw?.reward ?? raw?.amount ?? 0),
  };
}

export function adaptTasksResponse(raw: any): TasksResponse {
  if (!raw) return { items: [] };
  const items = Array.isArray(raw) ? raw : raw.items || [];
  return {
    items: items.map(adaptTask),
  };
}
