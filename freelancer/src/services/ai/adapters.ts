import type { AiContext, RelevantFile } from "./types";

/**
 * Adapts backend AI context payload (GET /api/v1/ai/context/{task_id})
 * Handles both camelCase and snake_case backend keys (e.g. relevant_files vs relevantFiles).
 */
export function adaptAiContext(raw: any): AiContext {
  if (!raw || typeof raw !== "object") {
    return {
      summary: "",
      findings: [],
      relevantFiles: [],
      approach: [],
    };
  }

  const rawFiles = raw.relevantFiles || raw.relevant_files || [];
  const relevantFiles: RelevantFile[] = Array.isArray(rawFiles)
    ? rawFiles.map((f: any) => ({
        path: String(f.path || f.file_path || ""),
        score: typeof f.score === "number" ? f.score : 0,
        reason: String(f.reason || f.description || ""),
      }))
    : [];

  return {
    summary: String(raw.summary || ""),
    findings: Array.isArray(raw.findings) ? raw.findings.map(String) : [],
    relevantFiles,
    approach: Array.isArray(raw.approach) ? raw.approach.map(String) : [],
  };
}
