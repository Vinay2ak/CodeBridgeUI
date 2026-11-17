import { User } from '../../features/session/session';

export type { User };

export interface OwnerProfileResponse {
  ownerType?: string;
  organizationName?: string;
  roleTitle?: string;
  timezone?: string;
  primaryStack?: string[];
  typicalBlocker?: string;
  defaultBudgetRange?: 'MICRO_BUG' | 'FEATURE_INTEGRATION' | 'COMPLEX_MODULE';
  preferredVerificationMode?: string;
}
