export type ProjectStatus = 'open' | 'draft' | 'in_progress' | 'in_review' | 'completed';

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

export interface ProjectDetail extends Project {
  description: string;
  blockerType: string;
  stacks: string[];
  specialties: string[];
  skills: string[];
  urgency: string;
  size: 'MICRO_BUG' | 'FEATURE_INTEGRATION' | 'COMPLEX_MODULE';
  repoUrl: string | null;
  verificationMode: string;
  createdAt: string;
  matchingStatus: 'pending' | 'computing' | 'ready' | 'failed';
}

export interface CreateProjectPayload {
  title: string;
  description: string;
  blockerType?: string;
  stacks?: string[];
  specialties?: string[];
  skills?: string[];
  budget: number;
  urgency?: string;
  repoUrl?: string | null;
  verificationMode?: string;
  // Backward compatibility fields
  repo?: string;
  status?: ProjectStatus;
  freelancerName?: string | null;
  expectedResult?: string;
  deadline?: string;
  tags?: string[];
}

export interface ProjectsResponse {
  items: Project[];
}
