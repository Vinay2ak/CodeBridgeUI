import { request } from "../../lib/http";
import {
  FileContentResponse,
  FileSaveResponse,
  FileTreeResponse,
  Task,
  TaskSummary,
  Workspace,
} from "./types";
import { MOCK_TASKS, MOCK_TASK_SUMMARIES } from "../../mocks/data/tasks";
import {
  getWorkspace as getMockWorkspace,
  getMockFiles,
  getMockFileContent,
  saveMockFileContent,
  startMockWorkspace,
  stopMockWorkspace,
  resetMockWorkspace,
} from "../../mocks/simulator";
import { getClaimedTaskIds } from "../../lib/claimedTasks";

export const workspaceApi = {
  async getMyTasks(): Promise<{ items: TaskSummary[] }> {
    try {
      const res = await request<{ items: TaskSummary[] }>("/tasks/mine");
      if (res && Array.isArray(res.items) && res.items.length > 0) {
        return res;
      }
    } catch {
      // Backend /tasks/mine endpoint unavailable or returns 404
    }

    // Check if user has claimed any starter tasks locally
    const claimedIds = getClaimedTaskIds();
    if (claimedIds.length > 0) {
      const items = claimedIds
        .map(
          (id) =>
            MOCK_TASKS[id] ||
            MOCK_TASKS[
              id === "task-1"
                ? "t1"
                : id === "task-2"
                ? "t2"
                : id === "task-3"
                ? "t3"
                : id
            ]
        )
        .filter(Boolean)
        .map((t) => ({
          id: t.id,
          title: t.title,
          projectTitle: t.projectTitle,
          status: t.status,
          reward: t.reward,
          dueAt: t.dueAt,
        }));

      if (items.length > 0) {
        return { items };
      }
    }

    return { items: [] };
  },

  async getAvailableTasks(): Promise<TaskSummary[]> {
    try {
      const res = await request<{ items?: any[]; data?: any[] }>("/projects?status=OPEN");
      const list = res.items || res.data || [];
      if (Array.isArray(list) && list.length > 0) {
        return list.map((p: any) => ({
          id: p.id || `proj-${p.project_id}`,
          title: p.title || "Project Task",
          projectTitle: p.title || "Open Project",
          status: "in_progress" as const,
          reward: p.budget || 3000,
          dueAt: p.deadline || new Date(Date.now() + 86400000 * 3).toISOString(),
        }));
      }
    } catch {
      // Fallback to flagship starter tasks
    }
    return MOCK_TASK_SUMMARIES;
  },

  async getTask(id: string): Promise<Task> {
    try {
      return await request<Task>(`/tasks/${id}`);
    } catch {
      const fallback =
        MOCK_TASKS[id] ||
        MOCK_TASKS[
          id === "task-1"
            ? "t1"
            : id === "task-2"
            ? "t2"
            : id === "task-3"
            ? "t3"
            : id
        ] ||
        MOCK_TASKS["t1"];
      return fallback;
    }
  },

  async getWorkspace(taskId: string): Promise<Workspace> {
    try {
      return await request<Workspace>(`/workspaces/${taskId}`);
    } catch {
      return getMockWorkspace(taskId);
    }
  },

  async startWorkspace(taskId: string): Promise<void> {
    try {
      await request<void>(`/workspaces/${taskId}/start`, {
        method: "POST",
      });
    } catch {
      startMockWorkspace(taskId);
    }
  },

  async stopWorkspace(taskId: string): Promise<void> {
    try {
      await request<void>(`/workspaces/${taskId}/stop`, {
        method: "POST",
      });
    } catch {
      stopMockWorkspace(taskId);
    }
  },

  async resetWorkspace(taskId: string): Promise<void> {
    try {
      await request<void>(`/workspaces/${taskId}/reset`, {
        method: "POST",
      });
    } catch {
      resetMockWorkspace(taskId);
    }
  },

  async getFiles(taskId: string): Promise<FileTreeResponse> {
    try {
      return await request<FileTreeResponse>(`/workspaces/${taskId}/files`);
    } catch {
      const ws = getMockWorkspace(taskId);
      const mockFiles = getMockFiles(taskId);
      return {
        commit: ws.commit || "a1b2c3d",
        items: mockFiles.map((f) => ({
          path: f.path,
          type: "file" as const,
          language: f.language,
          size: f.content.length,
          updatedAt: new Date().toISOString(),
        })),
      };
    }
  },

  async getFileContent(taskId: string, path: string): Promise<FileContentResponse> {
    try {
      return await request<FileContentResponse>(
        `/workspaces/${taskId}/files/content?path=${encodeURIComponent(path)}`
      );
    } catch {
      const snap = getMockFileContent(taskId, path);
      return snap || { path, language: "plaintext", content: "" };
    }
  },

  async saveFileContent(
    taskId: string,
    path: string,
    content: string
  ): Promise<FileSaveResponse> {
    try {
      return await request<FileSaveResponse>(`/workspaces/${taskId}/files/content`, {
        method: "PUT",
        body: JSON.stringify({ path, content }),
      });
    } catch {
      saveMockFileContent(taskId, path, content);
      return { savedAt: new Date().toISOString() };
    }
  },
};
