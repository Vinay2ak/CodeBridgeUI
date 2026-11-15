import { request } from "../../lib/http";
import {
  FileContentResponse,
  FileSaveResponse,
  FileTreeResponse,
  Task,
  TaskSummary,
  Workspace,
} from "./types";

export const workspaceApi = {
  getMyTasks(): Promise<{ items: TaskSummary[] }> {
    return request<{ items: TaskSummary[] }>("/tasks/mine");
  },

  getTask(id: string): Promise<Task> {
    return request<Task>(`/tasks/${id}`);
  },

  getWorkspace(taskId: string): Promise<Workspace> {
    return request<Workspace>(`/workspaces/${taskId}`);
  },

  startWorkspace(taskId: string): Promise<void> {
    return request<void>(`/workspaces/${taskId}/start`, {
      method: "POST",
    });
  },

  stopWorkspace(taskId: string): Promise<void> {
    return request<void>(`/workspaces/${taskId}/stop`, {
      method: "POST",
    });
  },

  resetWorkspace(taskId: string): Promise<void> {
    return request<void>(`/workspaces/${taskId}/reset`, {
      method: "POST",
    });
  },

  getFiles(taskId: string): Promise<FileTreeResponse> {
    return request<FileTreeResponse>(`/workspaces/${taskId}/files`);
  },

  getFileContent(taskId: string, path: string): Promise<FileContentResponse> {
    return request<FileContentResponse>(
      `/workspaces/${taskId}/files/content?path=${encodeURIComponent(path)}`
    );
  },

  saveFileContent(
    taskId: string,
    path: string,
    content: string
  ): Promise<FileSaveResponse> {
    return request<FileSaveResponse>(`/workspaces/${taskId}/files/content`, {
      method: "PUT",
      body: JSON.stringify({ path, content }),
    });
  },
};

