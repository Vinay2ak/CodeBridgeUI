export type ProjectStatus = 'draft' | 'in_progress' | 'in_review' | 'completed';

export interface Project {
  id: string;
  title: string;
  repo: string;
  freelancerName: string | null;
  status: ProjectStatus;
  budget: number;
  updatedAt: string;
  description?: string;
  tags?: string[];
}

export interface CreateProjectPayload {
  title: string;
  repo: string;
  budget: number;
  description?: string;
  tags?: string[];
  status?: ProjectStatus;
}

export interface ProjectsResponse {
  items: Project[];
}
