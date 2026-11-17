import { request } from "../../lib/http";
import { env } from "../../lib/env";
import type {
  FileContentResponse,
  FileSaveResponse,
  FileTreeResponse,
  Task,
  TaskSummary,
  Workspace,
} from "./types";
import {
  adaptTaskSummary,
  adaptTask,
  adaptWorkspace,
  adaptFileTree,
  adaptFileContent,
  adaptFileSave,
} from "./adapters";
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
      // Contract line 371 & 697: GET /api/v1/tasks/mine
      const res = await request<{ items?: any[] }>("/api/v1/tasks/mine");
      if (res && Array.isArray(res.items) && res.items.length > 0) {
        return { items: res.items.map(adaptTaskSummary) };
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
        .map(adaptTaskSummary);

      if (items.length > 0) {
        return { items };
      }
    }

    if (env.useMocks) {
      return { items: MOCK_TASK_SUMMARIES.map(adaptTaskSummary) };
    }
    return { items: [] };
  },

  async getAvailableTasks(): Promise<TaskSummary[]> {
    try {
      // Contract line 364 & 689: GET /api/v1/projects?status=OPEN
      const res = await request<{ items?: any[]; data?: any[] }>("/api/v1/projects?status=OPEN");
      const list = res.items || res.data || [];
      if (Array.isArray(list) && list.length > 0) {
        return list.map(adaptTaskSummary);
      }
    } catch {
      // Fallback
    }
    return MOCK_TASK_SUMMARIES.map(adaptTaskSummary);
  },

  async getTask(id: string): Promise<Task> {
    try {
      // Contract line 372: GET /api/v1/tasks/{id}
      const raw = await request<any>(`/api/v1/tasks/${id}`);
      return adaptTask(raw);
    } catch (err) {
      if (env.useMocks) {
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
        return adaptTask(fallback);
      }
      throw err;
    }
  },

  async getWorkspace(taskId: string): Promise<Workspace> {
    try {
      // Contract line 427 & 698: GET /api/v1/workspaces/{task_id}
      const raw = await request<any>(`/api/v1/workspaces/${taskId}`);
      return adaptWorkspace(raw);
    } catch {
      return adaptWorkspace(getMockWorkspace(taskId));
    }
  },

  async startWorkspace(taskId: string): Promise<void> {
    try {
      // Contract line 428 & 698: POST /api/v1/workspaces/{task_id}/start
      await request<void>(`/api/v1/workspaces/${taskId}/start`, {
        method: "POST",
      });
    } catch {
      startMockWorkspace(taskId);
    }
  },

  async stopWorkspace(taskId: string): Promise<void> {
    try {
      // Contract line 429 & 698: POST /api/v1/workspaces/{task_id}/stop
      await request<void>(`/api/v1/workspaces/${taskId}/stop`, {
        method: "POST",
      });
    } catch {
      stopMockWorkspace(taskId);
    }
  },

  async resetWorkspace(taskId: string): Promise<void> {
    try {
      // Contract line 430 & 698: POST /api/v1/workspaces/{task_id}/reset
      await request<void>(`/api/v1/workspaces/${taskId}/reset`, {
        method: "POST",
      });
    } catch {
      resetMockWorkspace(taskId);
    }
  },

  async getFiles(taskId: string): Promise<FileTreeResponse> {
    try {
      // Contract line 431 & 699: GET /api/v1/workspaces/{task_id}/files
      const raw = await request<any>(`/api/v1/workspaces/${taskId}/files`);
      return adaptFileTree(raw);
    } catch {
      const ws = getMockWorkspace(taskId);
      const mockFiles = getMockFiles(taskId);
      return adaptFileTree({
        commit: ws.commit || "a1b2c3d",
        items: mockFiles.map((f) => ({
          path: f.path,
          type: "file" as const,
          size: f.content.length,
        })),
      });
    }
  },

  async getFileContent(taskId: string, path: string): Promise<FileContentResponse> {
    try {
      // Contract line 432 & 699: GET /api/v1/workspaces/{task_id}/files/content?path=...
      const raw = await request<any>(
        `/api/v1/workspaces/${taskId}/files/content?path=${encodeURIComponent(path)}`
      );
      return adaptFileContent(raw);
    } catch {
      const snap = getMockFileContent(taskId, path);
      return adaptFileContent(snap || { path, language: "plaintext", content: "" });
    }
  },

  async saveFileContent(
    taskId: string,
    path: string,
    content: string
  ): Promise<FileSaveResponse> {
    try {
      // Contract line 433 & 699: PUT /api/v1/workspaces/{task_id}/files/content
      const raw = await request<any>(`/api/v1/workspaces/${taskId}/files/content`, {
        method: "PUT",
        body: JSON.stringify({ path, content }),
      });
      return adaptFileSave(raw);
    } catch {
      saveMockFileContent(taskId, path, content);
      return adaptFileSave({ savedAt: new Date().toISOString() });
    }
  },
};
