import {
  Project,
  ProjectDetail,
  ProjectsResponse,
  CreateProjectPayload,
  ProjectStatus,
} from './types';

export function adaptProjectStatus(rawStatus?: string): ProjectStatus {
  const s = (rawStatus || '').toUpperCase();
  if (s === 'OPEN') return 'open';
  if (s === 'DRAFT') return 'draft';
  if (s === 'ASSIGNED' || s === 'IN_PROGRESS') return 'in_progress';
  if (s === 'CHANGES_REQUESTED' || s === 'IN_REVIEW' || s === 'SUBMITTED') return 'in_review';
  if (s === 'COMPLETED' || s === 'CLOSED' || s === 'CANCELLED') return 'completed';
  return 'in_progress';
}

export function adaptProject(raw: any): Project {
  if (!raw) {
    return {
      id: '',
      title: 'Untitled Project',
      repo: 'Not linked yet',
      freelancerName: null,
      status: 'open',
      budget: 0,
      updatedAt: new Date().toISOString(),
    };
  }

  let repo = raw.repo;
  if (!repo) {
    if (raw.repo_url || raw.repoUrl) {
      const url = raw.repo_url || raw.repoUrl;
      repo = url.replace(/^https:\/\/github\.com\//, '').replace(/\.git$/, '').replace(/\/$/, '');
    } else {
      repo = 'Not linked yet';
    }
  }

  const budget = typeof raw.budget === 'number' ? raw.budget : Number(raw.budget) || 0;
  const status = adaptProjectStatus(raw.status);
  const updatedAt = raw.updated_at || raw.updatedAt || raw.created_at || raw.createdAt || new Date().toISOString();
  const tags = raw.required_skills || raw.skills || raw.tags || [];

  return {
    id: raw.id,
    title: raw.title || 'Untitled Project',
    repo,
    freelancerName: raw.freelancer_name ?? raw.freelancerName ?? null,
    status,
    budget,
    updatedAt,
    description: raw.description,
    tags: Array.isArray(tags) ? tags : [],
  };
}

export function adaptProjectDetail(raw: any): ProjectDetail {
  const base = adaptProject(raw);
  const skills = Array.isArray(raw?.required_skills)
    ? raw.required_skills
    : Array.isArray(raw?.skills)
    ? raw.skills
    : [];

  const stacks = Array.isArray(raw?.stacks)
    ? raw.stacks
    : skills;

  const size =
    raw?.size ||
    (base.budget < 3000
      ? 'MICRO_BUG'
      : base.budget <= 7500
      ? 'FEATURE_INTEGRATION'
      : 'COMPLEX_MODULE');

  return {
    ...base,
    description: raw?.description || '',
    blockerType: raw?.blocker_type || raw?.blockerType || 'HARD_BUG',
    stacks,
    specialties: Array.isArray(raw?.specialties) ? raw.specialties : [],
    skills,
    urgency: raw?.urgency || 'ASAP',
    size,
    repoUrl: raw?.repo_url ?? raw?.repoUrl ?? null,
    verificationMode:
      raw?.verification_mode || raw?.verificationMode || 'AUTO_TESTS_AND_REVIEW',
    createdAt: raw?.created_at || raw?.createdAt || base.updatedAt,
    matchingStatus: raw?.matching_status || raw?.matchingStatus || 'ready',
  };
}

export function adaptProjectsResponse(raw: any): ProjectsResponse {
  if (!raw) return { items: [] };
  const list = Array.isArray(raw) ? raw : raw.items || [];
  return {
    items: list.map(adaptProject),
  };
}

export function adaptCreateProjectRequest(payload: CreateProjectPayload): any {
  const skills =
    payload.stacks && payload.stacks.length > 0
      ? payload.stacks
      : payload.skills && payload.skills.length > 0
      ? payload.skills
      : payload.tags || [];

  const defaultDeadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  return {
    title: payload.title,
    description: payload.description,
    budget: payload.budget,
    currency: 'INR',
    deadline: payload.deadline || defaultDeadline,
    required_skills: skills,
    expected_result: payload.expectedResult || payload.description,
  };
}
