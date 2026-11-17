import { PostProjectFormData } from './schema';
import { DEFAULT_SPECIALTIES_BY_BLOCKER } from './options';

export interface OwnerProfile {
  ownerType?: string;
  organizationName?: string;
  roleTitle?: string;
  timezone?: string;
  primaryStack?: string[];
  typicalBlocker?: string;
  defaultBudgetRange?: 'MICRO_BUG' | 'FEATURE_INTEGRATION' | 'COMPLEX_MODULE';
  preferredVerificationMode?: string;
}

const STACK_MAP: Record<string, string | null> = {
  PYTHON_FASTAPI: 'PYTHON_FASTAPI',
  REACT_TS: 'REACT_TS',
  NODE_EXPRESS: 'NODE',
  POSTGRESQL: 'POSTGRES_SQL',
  DOCKER: 'DOCKER_WORKFLOWS',
  AI_RAG: 'AI_RAG_PIPELINES',
  WEBSOCKETS: null,
};

const BUDGET_MAP: Record<string, number> = {
  MICRO_BUG: 1500,
  FEATURE_INTEGRATION: 5000,
  COMPLEX_MODULE: 10000,
};

export function prefillFromProfile(profile: OwnerProfile): Partial<PostProjectFormData> {
  const defaults: Partial<PostProjectFormData> = {};

  if (profile.primaryStack && Array.isArray(profile.primaryStack)) {
    const mappedStacks: string[] = [];
    for (const s of profile.primaryStack) {
      const mapped = STACK_MAP[s];
      if (mapped && !mappedStacks.includes(mapped) && mappedStacks.length < 4) {
        mappedStacks.push(mapped);
      }
    }
    if (mappedStacks.length > 0) {
      defaults.stacks = mappedStacks;
    }
  }

  if (profile.typicalBlocker) {
    defaults.blockerType = profile.typicalBlocker;
    const suggested = DEFAULT_SPECIALTIES_BY_BLOCKER[profile.typicalBlocker];
    if (suggested && suggested.length > 0) {
      defaults.specialties = suggested.slice(0, 3);
    }
  }

  if (profile.defaultBudgetRange && BUDGET_MAP[profile.defaultBudgetRange]) {
    defaults.budget = BUDGET_MAP[profile.defaultBudgetRange];
  }

  if (profile.preferredVerificationMode) {
    defaults.verificationMode = profile.preferredVerificationMode;
  }

  return defaults;
}
