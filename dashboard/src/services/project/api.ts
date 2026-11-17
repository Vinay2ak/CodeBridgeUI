import { http } from '../../lib/http';
import {
  ProjectsResponse,
  ProjectDetail,
  CreateProjectPayload,
} from './types';
import {
  adaptProjectDetail,
  adaptProjectsResponse,
  adaptCreateProjectRequest,
} from './adapters';

export const projectApi = {
  getProjects: async (): Promise<ProjectsResponse> => {
    const res = await http.get<any>('/api/v1/projects');
    return adaptProjectsResponse(res);
  },

  getProject: async (id: string): Promise<ProjectDetail> => {
    const res = await http.get<any>(`/api/v1/projects/${id}`);
    return adaptProjectDetail(res);
  },

  createProject: async (
    payload: CreateProjectPayload,
    idempotencyKey?: string
  ): Promise<ProjectDetail> => {
    const headers: Record<string, string> = {};
    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }

    const reqBody = adaptCreateProjectRequest(payload);
    const res = await http.post<any>('/api/v1/projects', reqBody, { headers });
    return adaptProjectDetail(res);
  },

  addShortlist: async (projectId: string, freelancerId: string): Promise<void> => {
    await http.put(`/api/v1/projects/${projectId}/shortlist/${freelancerId}`);
  },

  removeShortlist: async (projectId: string, freelancerId: string): Promise<void> => {
    await http.delete(`/api/v1/projects/${projectId}/shortlist/${freelancerId}`);
  },

  deleteProject: async (id: string): Promise<void> => {
    try {
      await http.delete(`/api/v1/projects/${id}`);
    } catch (err: any) {
      // Fall back to cancel endpoint if DELETE is not supported by gateway route
      try {
        await http.post(`/api/v1/projects/${id}/cancel`);
      } catch {
        throw err;
      }
    }
  },
};

export const getProjects = projectApi.getProjects;
export const getProject = projectApi.getProject;
export const createProject = projectApi.createProject;
export const deleteProject = projectApi.deleteProject;
export const addShortlist = projectApi.addShortlist;
export const removeShortlist = projectApi.removeShortlist;
