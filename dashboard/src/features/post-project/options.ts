import {
  Bug,
  Wrench,
  Plug,
  FlaskConical,
  type LucideIcon,
} from 'lucide-react';

export interface OptionItem<T extends string = string> {
  value: T;
  label: string;
  hint?: string;
  icon?: LucideIcon;
}

export const BLOCKER_TYPES: OptionItem[] = [
  {
    value: 'HARD_BUG',
    label: 'Stuck on a critical bug',
    icon: Bug,
  },
  {
    value: 'UNFINISHED_FEATURE',
    label: 'Unfinished feature',
    icon: Wrench,
  },
  {
    value: 'MISSING_INTEGRATION',
    label: 'Broken third-party API or payment integration',
    icon: Plug,
  },
  {
    value: 'TEST_CI_FAILURE',
    label: 'Failing automated tests or CI',
    icon: FlaskConical,
  },
];

export const STACKS: OptionItem[] = [
  { value: 'PYTHON_FASTAPI', label: 'Python / FastAPI' },
  { value: 'REACT_TS', label: 'React / TypeScript' },
  { value: 'POSTGRES_SQL', label: 'PostgreSQL / SQL' },
  { value: 'NODE', label: 'Node.js' },
  { value: 'DOCKER_WORKFLOWS', label: 'Docker container workflows' },
  { value: 'REST_WEBHOOKS', label: 'REST APIs & webhooks' },
  { value: 'AI_RAG_PIPELINES', label: 'AI / RAG pipelines' },
];

export const SPECIALTIES: OptionItem[] = [
  { value: 'AUTH_RBAC', label: 'Auth & RBAC' },
  { value: 'PAYMENT_WEBHOOKS', label: 'Payment / webhook callbacks' },
  { value: 'DB_MIGRATIONS', label: 'Database schema & migrations' },
  { value: 'STATE_MACHINES', label: 'State machines' },
  { value: 'WEBSOCKET_EVENTS', label: 'WebSocket real-time events' },
  { value: 'TESTING', label: 'Unit / integration testing (Pytest, Vitest)' },
];

export const URGENCY: OptionItem[] = [
  { value: 'ASAP', label: 'ASAP · within 24 hours' },
  { value: 'THIS_WEEK', label: 'This week · 3-7 days' },
  { value: 'FLEXIBLE', label: 'Flexible · 2+ weeks' },
];

export const VERIFICATION_MODES: OptionItem[] = [
  {
    value: 'AUTO_TESTS_AND_REVIEW',
    label: 'Automated tests + my review',
    hint: 'recommended',
  },
  {
    value: 'MANUAL_REVIEW_ONLY',
    label: 'Manual review only',
  },
];

export const DEFAULT_SPECIALTIES_BY_BLOCKER: Record<string, string[]> = {
  HARD_BUG: ['TESTING', 'STATE_MACHINES'],
  UNFINISHED_FEATURE: ['DB_MIGRATIONS', 'AUTH_RBAC'],
  MISSING_INTEGRATION: ['PAYMENT_WEBHOOKS', 'AUTH_RBAC'],
  TEST_CI_FAILURE: ['TESTING'],
};

export const SKILL_SUGGESTIONS: string[] = [
  'Python',
  'FastAPI',
  'Django',
  'Flask',
  'JavaScript',
  'TypeScript',
  'React',
  'Next.js',
  'Node.js',
  'Express',
  'PostgreSQL',
  'SQL',
  'MongoDB',
  'Redis',
  'Docker',
  'Git',
  'REST APIs',
  'GraphQL',
  'WebSockets',
  'Pytest',
  'Jest',
  'Vitest',
  'GitHub Actions',
  'AWS',
  'Linux',
  'Tailwind CSS',
  'LLM / RAG',
];
