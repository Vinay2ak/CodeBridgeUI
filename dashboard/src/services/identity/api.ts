import { http } from '../../lib/http';
import { User, OwnerProfileResponse } from './types';
import {
  adaptUser,
  adaptLoginResponse,
  adaptRegisterRequest,
  adaptOwnerProfileResponse,
  adaptOwnerProfileRequest,
} from './adapters';

export const normalizeUser = adaptUser;

export const identityApi = {
  getMe: async (): Promise<User> => {
    try {
      const data = await http.get<any>('/api/v1/users/me');
      return adaptUser(data);
    } catch {
      const data = await http.get<any>('/api/v1/auth/me');
      return adaptUser(data);
    }
  },

  refresh: async (refreshToken?: string) => {
    const data = await http.post<any>(
      '/api/v1/auth/refresh',
      refreshToken ? { refresh_token: refreshToken } : {},
      { skipAuth: true }
    );
    return adaptLoginResponse(data);
  },

  logout: () => http.post<void>('/api/v1/auth/logout', {}),

  login: async (credentials: { email: string; password: string }) => {
    const data = await http.post<any>('/api/v1/auth/login', credentials, {
      skipAuth: true,
    });
    return adaptLoginResponse(data);
  },

  register: async (payload: {
    email: string;
    password: string;
    displayName?: string;
    role?: 'owner' | 'freelancer' | 'admin';
  }) => {
    const reqBody = adaptRegisterRequest(payload);
    const data = await http.post<any>('/api/v1/auth/register', reqBody, {
      skipAuth: true,
    });
    return adaptLoginResponse(data);
  },

  getOwnerProfile: async (): Promise<OwnerProfileResponse> => {
    const data = await http.get<any>('/api/v1/users/me/owner-profile');
    return adaptOwnerProfileResponse(data);
  },

  updateOwnerProfile: async (
    payload: OwnerProfileResponse
  ): Promise<OwnerProfileResponse> => {
    const reqBody = adaptOwnerProfileRequest(payload);
    const data = await http.put<any>('/api/v1/users/me/owner-profile', reqBody);
    return adaptOwnerProfileResponse(data);
  },
};

export const getOwnerProfile = identityApi.getOwnerProfile;
