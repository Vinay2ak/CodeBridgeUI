import { request } from "../../lib/http";
import { AiContext } from "./types";
import { MOCK_AI_CONTEXTS } from "../../mocks/data/ai";

export const aiApi = {
  async getContext(taskId: string): Promise<AiContext> {
    try {
      return await request<AiContext>(`/ai/context/${taskId}`);
    } catch {
      const key = taskId === "task-1" ? "t1" : taskId;
      return MOCK_AI_CONTEXTS[key] || MOCK_AI_CONTEXTS.t1;
    }
  },
};
