export type TaskStatus = 'open' | 'in_progress' | 'in_review' | 'verified';

export interface Task {
  id: string;
  title: string;
  projectTitle: string;
  status: TaskStatus;
  dueAt: string;
  reward: number;
}

export interface TasksResponse {
  items: Task[];
}

