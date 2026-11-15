export const OWNER_TYPES = [
  { value: "STUDENT_PROJECT", label: "Student / capstone owner" },
  { value: "INDIE_DEVELOPER", label: "Indie builder" },
  { value: "STARTUP_TEAM", label: "Startup engineering team" },
  { value: "ACADEMIC_LAB", label: "College / research lab" },
] as const satisfies ReadonlyArray<{ value: string; label: string; hint?: string }>;

export const OWNER_STACKS = [
  { value: "PYTHON_FASTAPI", label: "Python (FastAPI)" },
  { value: "REACT_TS", label: "React / TypeScript" },
  { value: "NODE_EXPRESS", label: "Node.js / Express" },
  { value: "POSTGRESQL", label: "PostgreSQL" },
  { value: "DOCKER", label: "Docker" },
  { value: "WEBSOCKETS", label: "WebSockets" },
  { value: "AI_RAG", label: "AI / RAG" },
] as const satisfies ReadonlyArray<{ value: string; label: string; hint?: string }>;

export const TYPICAL_BLOCKERS = [
  { value: "HARD_BUG", label: "Stuck on a critical bug" },
  { value: "UNFINISHED_FEATURE", label: "Unfinished feature" },
  { value: "MISSING_INTEGRATION", label: "Broken third-party API or payment integration" },
  { value: "TEST_CI_FAILURE", label: "Failing automated tests or CI" },
] as const satisfies ReadonlyArray<{ value: string; label: string; hint?: string }>;

export const BUDGET_RANGES = [
  { value: "MICRO_BUG", label: "₹1,000 – ₹3,000 · Micro-bug" },
  { value: "FEATURE_INTEGRATION", label: "₹3,000 – ₹7,500 · Feature or integration" },
  { value: "COMPLEX_MODULE", label: "₹7,500+ · Complex module" },
] as const satisfies ReadonlyArray<{ value: string; label: string; hint?: string }>;

export const VERIFICATION_MODES = [
  { value: "AUTO_TESTS_AND_REVIEW", label: "Automated tests + my review", hint: "recommended" },
  { value: "MANUAL_REVIEW_ONLY", label: "Manual review only" },
] as const satisfies ReadonlyArray<{ value: string; label: string; hint?: string }>;

export const EXPERIENCE_LEVELS = [
  {
    value: "STUDENT_EMERGING",
    label: "Student / emerging developer",
    hint: "completed tasks create official Verified Work records you can show to recruiters",
  },
  { value: "JUNIOR", label: "Junior · 1-2 years" },
  { value: "MID_LEVEL", label: "Mid-level · 2-4 years" },
  { value: "SENIOR", label: "Senior · 4+ years" },
] as const satisfies ReadonlyArray<{ value: string; label: string; hint?: string }>;

export const FREELANCER_STACKS = [
  { value: "PYTHON_FASTAPI", label: "Python / FastAPI" },
  { value: "REACT_TS", label: "React / TypeScript" },
  { value: "POSTGRES_SQL", label: "PostgreSQL / SQL" },
  { value: "NODE", label: "Node.js" },
  { value: "DOCKER_WORKFLOWS", label: "Docker container workflows" },
  { value: "REST_WEBHOOKS", label: "REST APIs & webhooks" },
  { value: "AI_RAG_PIPELINES", label: "AI / RAG pipelines" },
] as const satisfies ReadonlyArray<{ value: string; label: string; hint?: string }>;

export const SPECIALTIES = [
  { value: "AUTH_RBAC", label: "Auth & RBAC" },
  { value: "PAYMENT_WEBHOOKS", label: "Payment / webhook callbacks" },
  { value: "DB_MIGRATIONS", label: "Database schema & migrations" },
  { value: "STATE_MACHINES", label: "State machines" },
  { value: "WEBSOCKET_EVENTS", label: "WebSocket real-time events" },
  { value: "TESTING", label: "Unit / integration testing (Pytest, Vitest)" },
] as const satisfies ReadonlyArray<{ value: string; label: string; hint?: string }>;

export const AVAILABILITY_OPTIONS = [
  { value: "IMMEDIATE", label: "Available immediately" },
  { value: "HOURS_10_20", label: "10-20 hours per week" },
  { value: "WEEKEND_SPRINTS", label: "Weekend sprints only" },
  { value: "BOOKED", label: "Currently booked" },
] as const satisfies ReadonlyArray<{ value: string; label: string; hint?: string }>;

export const SKILL_SUGGESTIONS: readonly string[] = [
  "Python",
  "FastAPI",
  "Django",
  "Flask",
  "JavaScript",
  "TypeScript",
  "React",
  "Next.js",
  "Node.js",
  "Express",
  "PostgreSQL",
  "SQL",
  "MongoDB",
  "Redis",
  "Docker",
  "Git",
  "REST APIs",
  "GraphQL",
  "WebSockets",
  "Pytest",
  "Jest",
  "Vitest",
  "GitHub Actions",
  "AWS",
  "Linux",
  "Tailwind CSS",
  "LLM / RAG",
];

export const ORG_NAME_LABEL: Record<string, string> = {
  STUDENT_PROJECT: "College or university name",
  INDIE_DEVELOPER: "Personal workspace name",
  STARTUP_TEAM: "Startup name",
  ACADEMIC_LAB: "Lab or institute name",
};
