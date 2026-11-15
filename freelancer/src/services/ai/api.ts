import { request } from "../../lib/http";
import { AiContext } from "./types";

export const aiApi = {
  getContext(taskId: string): Promise<AiContext> {
    return request<AiContext>(`/ai/context/${taskId}`);
  },
};

