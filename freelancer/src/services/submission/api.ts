import { request } from "../../lib/http";
import {
  CurrentSubmissionResponse,
  Run,
  RunStartResponse,
  SubmissionResponse,
} from "./types";

export const submissionApi = {
  startRun(taskId: string): Promise<RunStartResponse> {
    return request<RunStartResponse>("/submissions/runs", {
      method: "POST",
      body: JSON.stringify({ taskId }),
    });
  },

  getRun(runId: string): Promise<Run> {
    return request<Run>(`/submissions/runs/${runId}`);
  },

  submit(taskId: string, notes: string): Promise<SubmissionResponse> {
    return request<SubmissionResponse>("/submissions", {
      method: "POST",
      body: JSON.stringify({ taskId, notes }),
    });
  },

  getCurrentSubmission(taskId: string): Promise<CurrentSubmissionResponse> {
    return request<CurrentSubmissionResponse>(
      `/submissions/current?taskId=${encodeURIComponent(taskId)}`
    );
  },
};

