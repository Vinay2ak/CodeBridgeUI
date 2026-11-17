import { request } from "../../lib/http";
import type {
  CurrentSubmissionResponse,
  Run,
  RunStartResponse,
  SubmissionResponse,
} from "./types";
import {
  adaptRun,
  adaptRunStartResponse,
  adaptSubmissionResponse,
  adaptCurrentSubmissionResponse,
} from "./adapters";
import {
  getSubmissionState,
  getMockRun,
  startMockTestRun,
  submitMockSolution,
} from "../../mocks/simulator";

export const submissionApi = {
  async startRun(taskId: string): Promise<RunStartResponse> {
    try {
      // Contract line 445: POST /api/v1/submissions/runs
      const raw = await request<any>("/api/v1/submissions/runs", {
        method: "POST",
        body: JSON.stringify({ taskId }),
      });
      return adaptRunStartResponse(raw);
    } catch {
      const runId = startMockTestRun(taskId);
      return adaptRunStartResponse({ runId });
    }
  },

  async getRun(runId: string): Promise<Run> {
    try {
      // Contract line 446: GET /api/v1/submissions/runs/{run_id}
      const raw = await request<any>(`/api/v1/submissions/runs/${runId}`);
      return adaptRun(raw);
    } catch {
      const run = getMockRun(runId);
      return adaptRun(
        run || {
          runId,
          taskId: "task-1",
          status: "completed",
          results: [],
        }
      );
    }
  },

  async submit(taskId: string, notes: string): Promise<SubmissionResponse> {
    try {
      // Contract line 447: POST /api/v1/submissions
      const raw = await request<any>("/api/v1/submissions", {
        method: "POST",
        body: JSON.stringify({ taskId, notes }),
      });
      return adaptSubmissionResponse(raw);
    } catch {
      const submissionId = submitMockSolution(taskId, notes);
      return adaptSubmissionResponse({ submissionId, status: "in_review" });
    }
  },

  async getCurrentSubmission(taskId: string): Promise<CurrentSubmissionResponse> {
    try {
      // Contract line 448: GET /api/v1/submissions/current?taskId=...
      const raw = await request<any>(
        `/api/v1/submissions/current?taskId=${encodeURIComponent(taskId)}`
      );
      return adaptCurrentSubmissionResponse(raw);
    } catch {
      const mockState = getSubmissionState(taskId);
      return adaptCurrentSubmissionResponse(mockState);
    }
  },
};
