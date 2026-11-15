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
    // Only send valid ProjectCreateRequest fields to the backend to satisfy extra="forbid"
    const backendBody: any = {
      title: payload.title,
      description: payload.description || `Deliverables and test requirements for ${payload.title}`,
      expected_result: payload.expectedResult || `Verified code delivery passing all test suites for ${payload.title}`,
      budget: payload.budget,
      deadline: payload.deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      required_skills: payload.tags && payload.tags.length > 0 ? payload.tags : ['TypeScript', 'React'],
    };

    try {
      const res = await http.post<any>('/projects', backendBody);
      const normalized = normalizeProject(res);
      if (payload.freelancerName) {
        normalized.freelancerName = payload.freelancerName;
      }
      if (payload.repo) {
        normalized.repo = payload.repo;
      }

      // Also register in mock array so it's instantly visible
      try {
        const { initialProjects } = await import('../../mocks/data');
        initialProjects.unshift({
          id: normalized.id,
          title: normalized.title,
          repo: normalized.repo,
          freelancerName: normalized.freelancerName,
          status: normalized.status,
          budget: normalized.budget,
          updatedAt: normalized.updatedAt,
        });
      } catch {}

      return normalized;
    } catch {
      // Fallback if backend is offline or mock mode
      const fallbackProject: Project = {
        id: `proj-${Date.now()}`,
        title: payload.title,
        repo: payload.repo,
        freelancerName: payload.freelancerName || null,
        status: payload.status || 'in_progress',
        budget: payload.budget,
        updatedAt: new Date().toISOString(),
        description: payload.description,
        tags: payload.tags,
      };

      try {
        const { initialProjects } = await import('../../mocks/data');
        initialProjects.unshift({
          id: fallbackProject.id,
          title: fallbackProject.title,
          repo: fallbackProject.repo,
          freelancerName: fallbackProject.freelancerName,
          status: fallbackProject.status,
          budget: fallbackProject.budget,
          updatedAt: fallbackProject.updatedAt,
        });
      } catch {}

      return fallbackProject;
    }
  },
};
