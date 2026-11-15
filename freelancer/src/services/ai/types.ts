export interface RelevantFile {
  path: string;
  score: number;
  reason: string;
}

export interface AiContext {
  summary: string;
  findings: string[];
  relevantFiles: RelevantFile[];
  approach: string[];
}

