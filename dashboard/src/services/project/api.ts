import { http } from '../../lib/http';
import { ProjectsResponse, Project, CreateProjectPayload, ProjectStatus } from './types';

function normalizeProject(raw: any): Project {
  let status: ProjectStatus = 'in_progress';
  const rawStatus = (raw.status || '').toLowerCase();
  if (rawStatus === 'draft' || rawStatus === 'open') {
    status = 'draft';
  } else if (rawStatus === 'in_progress' || rawStatus === 'assigned') {
    status = 'in_progress';
  } else if (rawStatus === 'in_review' || rawStatus === 'submitted') {
    status = 'in_review';
  } else if (rawStatus === 'completed' || rawStatus === 'closed') {
    status = 'completed';
  }

  return {
    id: raw.id,
    title: raw.title || 'Untitled Project',
    repo: raw.repo || (raw.title ? `codebridge/${raw.title.toLowerCase().replace(/\s+/g, '-')}` : 'codebridge/project'),
    freelancerName: raw.freelancerName ?? raw.freelancer_name ?? null,
    status,
    budget: typeof raw.budget === 'number' ? raw.budget : Number(raw.budget) || 0,
    updatedAt: raw.updatedAt || raw.updated_at || raw.created_at || new Date().toISOString(),
    description: raw.description,
    tags: raw.tags || raw.required_skills,
  };
}

export const projectApi = {
  getProjects: async (): Promise<ProjectsResponse> => {
    try {
      const res = await http.get<any>('/projects');
      const items = Array.isArray(res) ? res : res.items || [];
      return {
        items: items.map(normalizeProject),
      };
    } catch {
      // Graceful fallback to initial projects if backend is offline or returns 401/500
      try {
        const { initialProjects } = await import('../../mocks/data');
        return {
          items: initialProjects.map(normalizeProject),
        };
      } catch {
        return { items: [] };
      }
    }
  },
  createProject: async (payload: CreateProjectPayload): Promise<Project> => {
    // Include both mock and backend expected fields
    const body: any = {
      title: payload.title,
      description: payload.description || `Deliverables for ${payload.title}`,
      budget: payload.budget,
      repo: payload.repo,
      expected_result: 'Verified code delivery matching requirements',
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      required_skills: payload.tags && payload.tags.length > 0 ? payload.tags : ['TypeScript', 'React'],
      status: payload.status,
    };
    const res = await http.post<any>('/projects', body);
    return normalizeProject(res);
  },
};
