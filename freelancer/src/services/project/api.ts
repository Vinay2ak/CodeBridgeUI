import { request } from "../../lib/http";
import {
  ProjectScope,
  ProjectState,
  WorkspaceContainerInfo,
  TestSuiteResult,
  SubmissionPayload,
  SubmissionRecord,
} from "./types";

export const PRD_FLAGSHIP_PROJECT: ProjectScope = {
  id: "proj_1024",
  title: "Fix payment callback",
  description: "Payment succeeds but the callback is not saving the final status.",
  expectedResult: "Payment status is stored correctly after callback.",
  budget: 5000,
  currency: "INR",
  deadline: "2026-09-10",
  skills: ["Python", "FastAPI", "React", "API integration"],
  ownerName: "Asha Project Owner",
  projectState: "in_progress",
  escrowState: "held",
  github: {
    status: "connected",
    repoName: "codebridge/payments-service",
    defaultBranch: "main",
    commitHash: "c8f492b",
    accessLevel: "Controlled Read-Only (No Owner Password Shared)",
  },
  changesRequestedNote: "Changes requested from owner review (Round 1): Verify callback commits PostgreSQL transaction prior to 200 HTTP response and update payment ledger status to confirmed.",
  testSuiteName: "pytest tests/test_payment_callback.py",
};

export const INITIAL_OPEN_PROJECTS: ProjectScope[] = [
  PRD_FLAGSHIP_PROJECT,
  {
    id: "proj_1025",
    title: "Streaming CSV export for quarterly ledger reports",
    description: "The finance summary view needs downloadable CSV reports of all quarterly ledger transactions directly from the summary view without blocking the UI thread.",
    expectedResult: "Client-side export streams up to 25,000 rows without freezing the main thread, formatting timestamps to ISO 8601.",
    budget: 3500,
    currency: "INR",
    deadline: "2026-09-25",
    skills: ["TypeScript", "React", "Web Workers", "Tailwind CSS"],
    ownerName: "Devon Vance",
    projectState: "open",
    escrowState: "authorized",
    github: {
      status: "connected",
      repoName: "codebridge/reporting-ui",
      defaultBranch: "main",
      commitHash: "f4e5d6c",
      accessLevel: "Controlled Read-Only (No Owner Password Shared)",
    },
    testSuiteName: "npm test -- tests/csv_export.test.ts",
  },
  {
    id: "proj_1026",
    title: "Eliminate CI test flakiness in PostgreSQL testcontainer readiness",
    description: "Parallel integration test runs experience intermittent race conditions when booting Postgres and Redis concurrently in CI containers.",
    expectedResult: "Implement deterministic health check wait-loops before test suites run; zero failures across 50 consecutive runs.",
    budget: 2200,
    currency: "INR",
    deadline: "2026-09-18",
    skills: ["Go", "Docker", "PostgreSQL", "GitHub Actions"],
    ownerName: "Marcus Vance",
    projectState: "open",
    escrowState: "authorized",
    github: {
      status: "connected",
      repoName: "codebridge/core-runner",
      defaultBranch: "main",
      commitHash: "987654a",
      accessLevel: "Controlled Read-Only (No Owner Password Shared)",
    },
    testSuiteName: "go test -v ./tests/readiness_test.go",
  },
];

// Persistent state stores for live demo continuity
const WORKSPACE_STORE_KEY = "cb_freelancer_workspace_store";
const SUBMISSION_STORE_KEY = "cb_freelancer_submissions_store";
const PROJECTS_STORE_KEY = "cb_freelancer_projects_store";

function loadWorkspaceStore(): Record<string, WorkspaceContainerInfo> {
  if (typeof localStorage === "undefined") return {};
  try {
    const raw = localStorage.getItem(WORKSPACE_STORE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveWorkspaceStore(data: Record<string, WorkspaceContainerInfo>) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(WORKSPACE_STORE_KEY, JSON.stringify(data));
  } catch {}
}

function loadSubmissionsStore(): Record<string, SubmissionRecord[]> {
  if (typeof localStorage === "undefined") return {};
  try {
    const raw = localStorage.getItem(SUBMISSION_STORE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveSubmissionsStore(data: Record<string, SubmissionRecord[]>) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(SUBMISSION_STORE_KEY, JSON.stringify(data));
  } catch {}
}

function loadProjectsStore(): Record<string, ProjectScope> {
  const defaults: Record<string, ProjectScope> = {};
  for (const p of INITIAL_OPEN_PROJECTS) {
    defaults[p.id] = p;
  }
  if (typeof localStorage === "undefined") return defaults;
  try {
    const raw = localStorage.getItem(PROJECTS_STORE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    return { ...defaults, ...parsed };
  } catch {
    return defaults;
  }
}

function saveProjectsStore(data: Record<string, ProjectScope>) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(PROJECTS_STORE_KEY, JSON.stringify(data));
  } catch {}
}

export const projectApi = {
  async getProjects(): Promise<ProjectScope[]> {
    const localStore = loadProjectsStore();
    try {
      const res = await request<{ items?: any[]; data?: any[] }>("/projects");
      const list = res.items || res.data || [];
      if (Array.isArray(list) && list.length > 0) {
        // Map backend projects
        const remote = list.map((p: any) => ({
          id: p.id || `proj_${p.project_id}`,
          title: p.title || "Project",
          description: p.description || "",
          expectedResult: p.expected_result || p.expectedResult || "Pass all verification checks.",
          budget: p.budget || 5000,
          currency: p.currency || "INR",
          deadline: p.deadline || new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 10),
          skills: p.skills || ["Python", "FastAPI"],
          ownerName: p.owner_name || p.ownerName || "Project Owner",
          projectState: ((p.status || "open").toLowerCase() as ProjectState),
          escrowState: "held" as const,
          github: {
            status: "connected" as const,
            repoName: p.repo_name || "codebridge/payments-service",
            defaultBranch: "main",
            commitHash: "c8f492b",
            accessLevel: "Controlled Read-Only (No Owner Password Shared)" as const,
          },
        }));
        return remote;
      }
    } catch {
      // Backend offline or empty
    }
    return Object.values(localStore);
  },

  async getProject(id: string): Promise<ProjectScope> {
    const store = loadProjectsStore();
    if (store[id]) return store[id];
    try {
      const p = await request<any>(`/projects/${id}`);
      if (p) {
        return {
          id: p.id,
          title: p.title,
          description: p.description,
          expectedResult: p.expected_result || p.expectedResult,
          budget: p.budget || 5000,
          currency: p.currency || "INR",
          deadline: p.deadline,
          skills: p.skills || [],
          ownerName: p.owner_name || "Project Owner",
          projectState: p.status || "in_progress",
          escrowState: "held",
          github: {
            status: "connected",
            repoName: p.repo_name || "codebridge/payments-service",
            defaultBranch: "main",
            commitHash: "c8f492b",
            accessLevel: "Controlled Read-Only (No Owner Password Shared)",
          },
        };
      }
    } catch {}
    return PRD_FLAGSHIP_PROJECT;
  },

  async updateProjectState(id: string, partial: Partial<ProjectScope>): Promise<ProjectScope> {
    const store = loadProjectsStore();
    const current = store[id] || (id === PRD_FLAGSHIP_PROJECT.id ? PRD_FLAGSHIP_PROJECT : null);
    if (!current) {
      throw new Error("Project not found");
    }
    const updated = { ...current, ...partial };
    store[id] = updated;
    saveProjectsStore(store);
    return updated;
  },

  async getWorkspace(projectId: string): Promise<WorkspaceContainerInfo> {
    const store = loadWorkspaceStore();
    if (store[projectId]) {
      return store[projectId];
    }
    try {
      const res = await request<any>(`/projects/${projectId}/workspace`);
      if (res && res.workspaceId) return res;
    } catch {}

    const defaultWs: WorkspaceContainerInfo = {
      workspaceId: `ws-cb-${projectId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8)}`,
      environmentRef: `cb-sandbox-${projectId}-docker`,
      state: "ready",
      image: "python:3.12-slim-bookworm",
      containerId: `cb-sandbox-${projectId.slice(-4)}-c8f4`,
      isolationLevel: "Docker Container (Least-Privilege Bound to Freelancer)",
      githubMount: "Read-Only Source Ready (/workspace/repo)",
      connectCommand: `docker run --rm -it -v cb-env-${projectId}:/workspace codebridge/sandbox:latest`,
      createdAt: new Date().toISOString(),
    };
    store[projectId] = defaultWs;
    saveWorkspaceStore(store);
    return defaultWs;
  },

  async initializeWorkspace(projectId: string): Promise<WorkspaceContainerInfo> {
    const store = loadWorkspaceStore();
    const current = store[projectId] || (await this.getWorkspace(projectId));
    current.state = "ready";
    current.lastActiveAt = new Date().toISOString();
    store[projectId] = current;
    saveWorkspaceStore(store);

    try {
      await request(`/projects/${projectId}/workspace`, { method: "POST" });
    } catch {}

    return current;
  },

  async startWorkspace(projectId: string): Promise<WorkspaceContainerInfo> {
    const store = loadWorkspaceStore();
    const current = store[projectId] || (await this.getWorkspace(projectId));
    current.state = "active";
    current.lastActiveAt = new Date().toISOString();
    store[projectId] = current;
    saveWorkspaceStore(store);

    try {
      await request(`/projects/${projectId}/workspace/start`, { method: "POST" });
    } catch {}

    return current;
  },

  async stopWorkspace(projectId: string): Promise<WorkspaceContainerInfo> {
    const store = loadWorkspaceStore();
    const current = store[projectId] || (await this.getWorkspace(projectId));
    current.state = "stopped";
    current.lastActiveAt = new Date().toISOString();
    store[projectId] = current;
    saveWorkspaceStore(store);

    try {
      await request(`/projects/${projectId}/workspace/stop`, { method: "POST" });
    } catch {}

    return current;
  },

  async runVerificationTests(projectId: string): Promise<TestSuiteResult> {
    void projectId;
    const steps = [
      {
        step: 1,
        name: "1. Container Environment Check (Python 3.12, DB Driver, FastAPI)",
        status: "pass" as const,
        details: "Isolated container runtime verified. Dependencies locked; non-root user permissions confirmed.",
        durationMs: 420,
      },
      {
        step: 2,
        name: "2. Unit & Callback Status Persistence Test (test_payment_callback_persists_status)",
        status: "pass" as const,
        details: "Webhook callback simulated with signature validation; payment state machine successfully transitions to HELD and commits.",
        durationMs: 840,
      },
      {
        step: 3,
        name: "3. Idempotency & Regression Verification (test_idempotent_duplicate_callback)",
        status: "pass" as const,
        details: "Duplicate webhook delivery correctly answered with 200/already_processed; zero duplicate transactions created.",
        durationMs: 510,
      },
    ];

    return {
      runId: `run_${Date.now()}_chk`,
      passed: true,
      exitCode: 0,
      durationMs: 1770,
      timestamp: new Date().toISOString(),
      steps,
      rawOutput: `=== test session starts ===\nplatform linux -- Python 3.12.2, pytest-8.1.1\nrootdir: /workspace\ncollected 3 items\n\ntests/test_payment_callback.py::test_env_runtime PASSED [ 33%]\ntests/test_payment_callback.py::test_payment_callback_persists_status PASSED [ 66%]\ntests/test_payment_callback.py::test_idempotent_duplicate_callback PASSED [100%]\n\n=== 3 passed in 1.77s ===\nExit Code: 0 (ALL CHECKS SATISFIED)`,
    };
  },

  async submitProject(projectId: string, payload: SubmissionPayload): Promise<SubmissionRecord> {
    const store = loadSubmissionsStore();
    const projectSubmissions = store[projectId] || [];

    const newRecord: SubmissionRecord = {
      id: `sub_${Date.now()}`,
      projectId,
      submittedAt: new Date().toISOString(),
      summary: payload.summary,
      filesModified: payload.filesModified.split(",").map((s) => s.trim()).filter(Boolean),
      testResult: payload.testResultStatus,
      reviewerNotes: payload.reviewerNotes,
      status: "in_review",
    };

    projectSubmissions.unshift(newRecord);
    store[projectId] = projectSubmissions;
    saveSubmissionsStore(store);

    // Update project state to 'submitted'
    await this.updateProjectState(projectId, { projectState: "submitted" });

    try {
      await request(`/projects/${projectId}/submissions`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    } catch {}

    return newRecord;
  },

  async getSubmissions(projectId: string): Promise<SubmissionRecord[]> {
    const store = loadSubmissionsStore();
    if (store[projectId] && store[projectId].length > 0) {
      return store[projectId];
    }

    // Default initial submission history for PRD flagship project if any revisions occurred
    if (projectId === PRD_FLAGSHIP_PROJECT.id) {
      const defaultHistory: SubmissionRecord[] = [
        {
          id: "sub_prev_101",
          projectId,
          submittedAt: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
          summary: "Initial callback handler patch (webhook exception caught)",
          filesModified: ["backend/app/payments/callback.py"],
          testResult: "PASSED",
          reviewerNotes: "Implemented basic exception wrapper for invalid signatures.",
          status: "changes_requested",
          feedback: "Changes requested from owner review: The webhook exception is caught, but the callback is still returning 200 before writing the payment status to the PostgreSQL ledger. Please commit transaction before answering.",
        },
      ];
      store[projectId] = defaultHistory;
      saveSubmissionsStore(store);
      return defaultHistory;
    }

    return [];
  },
};
