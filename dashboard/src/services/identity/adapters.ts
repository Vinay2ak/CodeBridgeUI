import { User } from './types';
import { OwnerProfileResponse } from './types';

export function adaptUserRole(roleStr?: string): User['role'] {
  const normalized = (roleStr || 'owner').toLowerCase();
  if (normalized === 'admin') return 'admin';
  if (normalized === 'freelancer') return 'freelancer';
  return 'owner';
}

export function adaptUser(raw: any): User {
  if (!raw) {
    return {
      id: 'anonymous',
      email: '',
      displayName: 'User',
      role: 'owner',
      status: 'active',
      createdAt: new Date().toISOString(),
    };
  }

  const role = adaptUserRole(raw.role);
  const displayName =
    raw.displayName ||
    raw.full_name ||
    (raw.email ? raw.email.split('@')[0] : 'User');
  const createdAt = raw.createdAt || raw.created_at || new Date().toISOString();
  const status =
    raw.status || (raw.is_active === false ? 'suspended' : 'active');

  return {
    id: raw.id || 'anonymous',
    email: raw.email || '',
    displayName,
    role,
    status,
    createdAt,
  };
}

export function adaptLoginResponse(raw: any): {
  accessToken: string;
  refreshToken?: string;
  user: User;
  expiresIn?: number;
} {
  const accessToken = raw?.access_token || raw?.accessToken || '';
  const refreshToken = raw?.refresh_token || raw?.refreshToken;
  const user = adaptUser(raw?.user);
  const expiresIn = raw?.expires_in || raw?.expiresIn;

  return {
    accessToken,
    refreshToken,
    user,
    expiresIn,
  };
}

export function adaptRegisterRequest(payload: {
  email: string;
  password: string;
  displayName?: string;
  role?: 'owner' | 'freelancer' | 'admin';
}): {
  email: string;
  password: string;
  full_name: string;
  role: 'OWNER' | 'FREELANCER' | 'ADMIN';
} {
  const roleUpper = (payload.role?.toUpperCase() || 'OWNER') as
    | 'OWNER'
    | 'FREELANCER'
    | 'ADMIN';

  return {
    email: payload.email,
    password: payload.password,
    full_name: payload.displayName || payload.email.split('@')[0],
    role: roleUpper,
  };
}

export function adaptOwnerProfileResponse(raw: any): OwnerProfileResponse {
  if (!raw) return {};
  const profile = raw.profile || raw;
  return {
    ownerType: profile.ownerType || profile.owner_type,
    organizationName: profile.organizationName || profile.organization_name,
    roleTitle: profile.roleTitle || profile.role_title,
    timezone: profile.timezone,
    primaryStack: profile.primaryStack || profile.primary_stack,
    typicalBlocker: profile.typicalBlocker || profile.typical_blocker,
    defaultBudgetRange:
      profile.defaultBudgetRange || profile.default_budget_range,
    preferredVerificationMode:
      profile.preferredVerificationMode || profile.preferred_verification_mode,
  };
}

export function adaptOwnerProfileRequest(payload: OwnerProfileResponse): any {
  return {
    owner_type: payload.ownerType,
    organization_name: payload.organizationName,
    role_title: payload.roleTitle,
    timezone: payload.timezone,
    primary_stack: payload.primaryStack,
    typical_blocker: payload.typicalBlocker,
    default_budget_range: payload.defaultBudgetRange,
    preferred_verification_mode: payload.preferredVerificationMode,
  };
}
