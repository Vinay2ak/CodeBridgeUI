import { request } from "../../lib/http";
import {
  CurrentSubmissionResponse,
  Run,
  RunStartResponse,
  SubmissionResponse,
} from "./types";
import {
  getSubmissionState,
  getMockRun,
  startMockTestRun,
  submitMockSolution,
} from "../../mocks/simulator";

export const submissionApi = {
  async startRun(taskId: string): Promise<RunStartResponse> {
    try {
      return await request<RunStartResponse>("/submissions/runs", {
        method: "POST",
        body: JSON.stringify({ taskId }),
      });
    } catch {
      const runId = startMockTestRun(taskId);
      return { runId };
    }
  },

  async getRun(runId: string): Promise<Run> {
    try {
      return await request<Run>(`/submissions/runs/${runId}`);
    } catch {
      const run = getMockRun(runId);
      return run || {
        runId,
        taskId: "task-1",
        status: "completed",
        results: [],
      };
    }
  },

  async submit(taskId: string, notes: string): Promise<SubmissionResponse> {
    try {
      return await request<SubmissionResponse>("/submissions", {
        method: "POST",
        body: JSON.stringify({ taskId, notes }),
      });
    } catch {
      const submissionId = submitMockSolution(taskId, notes);
      return { submissionId, status: "in_review" };
    }
  },

  async getCurrentSubmission(taskId: string): Promise<CurrentSubmissionResponse> {
    try {
      return await request<CurrentSubmissionResponse>(
        `/submissions/current?taskId=${encodeURIComponent(taskId)}`
      );
    } catch {
      return getSubmissionState(taskId);
    }
  },
};
