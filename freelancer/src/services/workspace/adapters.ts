import type {
  Task,
  TaskSummary,
  TaskStatus,
  Workspace,
  WorkspaceStatus,
  FileTreeResponse,
  FileContentResponse,
  FileSaveResponse,
  FileItem,
} from "./types";

/**
 * Maps backend task status to internal TaskStatus
 */
export function adaptTaskStatus(rawStatus?: string): TaskStatus {
  const status = (rawStatus || "").toLowerCase();
  if (status === "in_review" || status === "under_review" || status === "submitted") {
    return "in_review";
  }
  if (status === "completed" || status === "approved") {
    return "completed";
  }
  return "in_progress";
}

/**
 * Adapts task summary item from GET /api/v1/tasks/mine
 */
export function adaptTaskSummary(raw: any): TaskSummary {
  const id = String(raw?.id || `task_${Date.now()}`);
  const title = String(raw?.title || "Task");
  const projectTitle = String(raw?.projectTitle || raw?.project_title || raw?.title || "Project");
  const status = adaptTaskStatus(raw?.status);
  const reward = typeof raw?.reward === "number" ? raw.reward : typeof raw?.budget === "number" ? raw.budget : 4500;
  const dueAt = String(raw?.dueAt || raw?.due_at || raw?.deadline || new Date(Date.now() + 86400000 * 3).toISOString());

  return {
    id,
    title,
    projectTitle,
    status,
    reward,
    dueAt,
  };
}

/**
 * Adapts full task details from GET /api/v1/tasks/{id}
 */
export function adaptTask(raw: any): Task {
  const summary = adaptTaskSummary(raw);
  const ownerName = String(raw?.ownerName || raw?.owner_name || "CodeBridge FinTech Team");
  const stack = Array.isArray(raw?.stack)
    ? raw.stack.map(String)
    : Array.isArray(raw?.required_skills)
    ? raw.required_skills.map(String)
    : ["Python", "FastAPI"];

  const repoRaw = raw?.repo || {};
  const repo = {
    name: String(repoRaw.name || raw?.repo_name || "codebridge/payments-service"),
    branch: String(repoRaw.branch || raw?.default_branch || "main"),
    commit: String(repoRaw.commit || raw?.commit_hash || "c8f492b"),
  };

  const brief: string[] = Array.isArray(raw?.brief)
    ? raw.brief.map(String)
    : raw?.description
    ? [String(raw.description)]
    : ["Investigate and fix payment webhook race condition."];

  const rawCriteria = Array.isArray(raw?.criteria)
    ? raw.criteria
    : Array.isArray(raw?.acceptance_criteria)
    ? raw.acceptance_criteria
    : [];

  const criteria = rawCriteria.map((c: any, idx: number) => ({
    id: String(c.id || `crit_${idx + 1}`),
    text: String(typeof c === "string" ? c : c.text || c.description || "Pass criteria"),
    testIds: Array.isArray(c.testIds) ? c.testIds.map(String) : Array.isArray(c.test_ids) ? c.test_ids.map(String) : [],
    required: Boolean(c.required ?? true),
  }));

  const history = Array.isArray(raw?.history)
    ? raw.history.map((h: any) => ({
        at: String(h.at || h.created_at || new Date().toISOString()),
        type: String(h.type || "update"),
        text: String(h.text || h.message || ""),
      }))
    : [];

  return {
    ...summary,
    ownerName,
    stack,
    repo,
    brief,
    criteria,
    history,
  };
}

/**
 * Maps backend workspace status to internal WorkspaceStatus
 */
export function adaptWorkspaceStatus(rawStatus?: string): WorkspaceStatus {
  const status = (rawStatus || "").toLowerCase();
  switch (status) {
    case "running":
    case "active":
      return "running";
    case "stopped":
      return "stopped";
    case "provisioning":
    case "creating":
      return "provisioning";
    case "starting":
    case "ready":
      return "starting";
    case "idle":
      return "idle";
    default:
      return "stopped";
  }
}

/**
 * Adapts backend workspace payload (GET /api/v1/workspaces/{task_id})
 */
export function adaptWorkspace(raw: any): Workspace {
  const status = adaptWorkspaceStatus(raw?.status);
  const image = String(raw?.image || raw?.image_tag || "codebridge/runner:python3.11");
  const template = String(raw?.template || "python-fastapi");
  const cpu = String(raw?.cpu || "2 vCPU");
  const memory = String(raw?.memory || "4 GB");
  const expiresAt = raw?.expiresAt || raw?.expires_at || null;
  const commit = String(raw?.commit || raw?.commit_hash || "c8f492b");

  return {
    status,
    image,
    template,
    cpu,
    memory,
    expiresAt,
    repoAccess: "read-only snapshot",
    commit,
  };
}

/**
 * Adapts file tree response (GET /api/v1/workspaces/{task_id}/files)
 */
export function adaptFileTree(raw: any): FileTreeResponse {
  const commit = String(raw?.commit || "c8f492b");
  const rawItems = Array.isArray(raw?.items) ? raw.items : [];

  const items: FileItem[] = rawItems.map((f: any) => ({
    path: String(f.path || ""),
    type: f.type === "dir" ? "dir" : "file",
    size: typeof f.size === "number" ? f.size : 0,
  }));

  return { commit, items };
}

/**
 * Adapts file content response (GET /api/v1/workspaces/{task_id}/files/content)
 */
export function adaptFileContent(raw: any): FileContentResponse {
  return {
    path: String(raw?.path || ""),
    language: String(raw?.language || "python"),
    content: String(raw?.content || ""),
  };
}

/**
 * Adapts file save response (PUT /api/v1/workspaces/{task_id}/files/content)
 */
export function adaptFileSave(raw: any): FileSaveResponse {
  return {
    savedAt: String(raw?.savedAt || raw?.saved_at || new Date().toISOString()),
  };
}
