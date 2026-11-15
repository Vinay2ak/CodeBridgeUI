import { http } from '../../lib/http';
import { User } from './types';

export function normalizeUser(raw: any): User {
  const roleStr = ((raw.role || 'owner') as string).toLowerCase();
  const validRole: User['role'] =
    roleStr === 'admin' ? 'admin' : roleStr === 'freelancer' ? 'freelancer' : 'owner';

  return {
    id: raw.id || 'anonymous',
    email: raw.email || '',
    displayName: raw.displayName || raw.full_name || raw.email?.split('@')[0] || 'User',
    role: validRole,
    status: raw.status || (raw.is_active === false ? 'suspended' : 'active'),
    createdAt: raw.createdAt || raw.created_at || new Date().toISOString(),
  };
}

export const identityApi = {
  getMe: async (): Promise<User> => {
    try {
      const data = await http.get<any>('/auth/me');
      return normalizeUser(data);
    } catch {
      const data = await http.get<any>('/users/me');
      return normalizeUser(data);
    }
  },
  refresh: (refreshToken?: string) =>
    http.post<{
      accessToken?: string;
      access_token?: string;
      expiresIn?: number;
      expires_in?: number;
      refresh_token?: string;
      user?: any;
      data?: any;
    }>(
      '/auth/refresh',
      refreshToken ? { refresh_token: refreshToken } : {},
      { skipAuth: true }
    ),
  logout: () => http.post<void>('/auth/logout', {}),
  login: (credentials: { email: string; password: string }) =>
    http.post<any>('/auth/login', credentials, { skipAuth: true }),
};
