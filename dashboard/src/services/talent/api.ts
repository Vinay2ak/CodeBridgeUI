import { http } from '../../lib/http';
import { MatchesResponse, FreelancerProfile } from './types';
import { adaptMatchesResponse, adaptFreelancerProfile } from './adapters';

export const talentApi = {
  getMatches: async (projectId: string): Promise<MatchesResponse> => {
    const raw = await http.get<any>(`/api/v1/talent/matches/${projectId}`);
    return adaptMatchesResponse(raw);
  },

  getFreelancer: async (id: string): Promise<FreelancerProfile> => {
    try {
      const raw = await http.get<any>(`/api/v1/freelancers/${id}`);
      return adaptFreelancerProfile(raw);
    } catch {
      const raw = await http.get<any>(`/api/v1/talent/freelancers/${id}`);
      return adaptFreelancerProfile(raw);
    }
  },
};

export const getMatches = talentApi.getMatches;
export const getFreelancer = talentApi.getFreelancer;
