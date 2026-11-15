export type TaskStatus = "in_progress" | "in_review" | "completed";

export interface TaskSummary {
  id: string;
  title: string;
  projectTitle: string;
  status: TaskStatus;
  reward: number;
  dueAt: string;
}

export interface AcceptanceCriterion {
  id: string;
  text: string;
  testIds: string[];
  required: boolean;
}

export interface TaskHistoryEntry {
  at: string;
  type: string;
  text: string;
}

export interface TaskRepo {
  name: string;
  branch: string;
  commit: string;
}

export interface Task extends TaskSummary {
  ownerName: string;
  stack: string[];
  repo: TaskRepo;
  brief: string[];
  criteria: AcceptanceCriterion[];
  history: TaskHistoryEntry[];
}

export type WorkspaceStatus = "stopped" | "provisioning" | "starting" | "running" | "idle" | "error";

export interface Workspace {
  status: WorkspaceStatus;
  image: string;
  template: string;
  cpu: string;
  memory: string;
  expiresAt: string | null;
  repoAccess: "read-only snapshot";
  commit: string;
}

export interface FileItem {
  path: string;
  type: "file" | "dir";
  size: number;
}

export interface FileTreeResponse {
  commit: string;
  items: FileItem[];
}

export interface FileContentResponse {
  path: string;
  language: string;
  content: string;
}

export interface FileSaveResponse {
  savedAt: string;
}

