import { request } from "../../lib/http";
import type { AiContext } from "./types";
import { adaptAiContext } from "./adapters";
import { MOCK_AI_CONTEXTS } from "../../mocks/data/ai";

export const aiApi = {
  async getContext(taskId: string): Promise<AiContext> {
    try {
      const raw = await request<any>(`/api/v1/ai/context/${taskId}`);
      return adaptAiContext(raw);
    } catch {
      const key = taskId === "task-1" ? "t1" : taskId;
      const fallback = MOCK_AI_CONTEXTS[key] || MOCK_AI_CONTEXTS.t1;
      return adaptAiContext(fallback);
    }
  },
};
