import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Bot, FileCode, CheckCircle2, RefreshCw } from "lucide-react";
import { aiApi } from "../../services/ai/api";
import { Chip } from "../../components/ui/Chip";
import { ApiError } from "../../lib/errors";

interface AiContextTabProps {
  taskId: string;
  onOpenFile?: (path: string) => void;
}

export const AiContextTab: React.FC<AiContextTabProps> = ({ taskId, onOpenFile }) => {
  const { data: aiContext, isLoading, error, refetch } = useQuery({
    queryKey: ["ai", taskId],
    queryFn: () => aiApi.getContext(taskId),
    enabled: Boolean(taskId),
  });

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-6 w-1/3 bg-raised rounded" />
        <div className="h-20 bg-raised rounded-xl" />
        <div className="h-28 bg-raised rounded-xl" />
      </div>
    );
  }

  if (error) {
    const apiError = error instanceof ApiError ? error : null;
    if (apiError?.status === 404) {
      return (
        <div className="py-12 text-center">
          <Bot className="h-10 w-10 text-muted mx-auto mb-3" aria-hidden="true" />
          <h4 className="text-sm font-semibold text-ink mb-1">No AI context for this task</h4>
          <p className="text-xs text-muted max-w-xs mx-auto">
            AI code analysis has not been generated or requested for this repository snapshot.
          </p>
        </div>
      );
    }

    const correlationId = apiError?.correlationId || "err_ai";
    return (
      <div className="rounded-lg border border-line bg-raised p-4 text-center">
        <p className="text-sm text-ink mb-1">Failed to load AI code context.</p>
        <p className="text-xs text-muted mb-3 font-mono">Reference: {correlationId}</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-line-strong px-3 py-1.5 text-xs font-medium text-ink hover:bg-surface transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  if (!aiContext) {
    return (
      <div className="py-12 text-center text-muted text-sm">
        No AI context for this task
      </div>
    );
  }

  return (
    <div className="space-y-6 text-sm">
      {/* Header Banner */}
      <div className="flex items-center justify-between pb-2 border-b border-line">
        <Chip
          tone="info"
          icon={<Bot className="h-3.5 w-3.5 text-primary" aria-hidden="true" />}
        >
          AI context · simulated
        </Chip>
        <span className="text-xs text-muted">Analysis generated from commit</span>
      </div>

      {/* Summary */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
          Diagnostic Summary
        </h4>
        <div className="rounded-lg border border-line bg-raised p-3.5 text-muted leading-relaxed">
          {aiContext.summary}
        </div>
      </div>

      {/* Key Findings */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
          Key Findings
        </h4>
        <ul className="space-y-2">
          {aiContext.findings.map((finding, idx) => (
            <li
              key={idx}
              className="flex items-start gap-2.5 text-xs text-muted leading-relaxed"
            >
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
              <span>{finding}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Relevant Files */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
          Relevant Files & Attention Weights
        </h4>
        <div className="space-y-2.5">
          {aiContext.relevantFiles.map((file) => {
            const percent = Math.round(file.score * 100);
            return (
              <div
                key={file.path}
                className="rounded-lg border border-line bg-surface p-3 space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0 font-mono text-xs text-ink font-medium">
                    <FileCode className="h-3.5 w-3.5 text-primary shrink-0" aria-hidden="true" />
                    <span className="truncate">{file.path}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-semibold text-primary">
                      {percent}%
                    </span>
                    {onOpenFile && (
                      <button
                        type="button"
                        onClick={() => onOpenFile(file.path)}
                        className="inline-flex items-center rounded border border-line-strong bg-raised px-2 py-0.5 text-[11px] font-mono text-ink hover:bg-surface focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                      >
                        Open
                      </button>
                    )}
                  </div>
                </div>

                {/* Relevance Bar */}
                <div className="w-full h-1.5 bg-raised rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${percent}%` }}
                    role="progressbar"
                    aria-valuenow={percent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Relevance score ${percent}%`}
                  />
                </div>

                <p className="text-xs text-muted pt-0.5">{file.reason}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recommended Approach */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
          Recommended Implementation Steps
        </h4>
        <ol className="space-y-2">
          {aiContext.approach.map((step, idx) => (
            <li
              key={idx}
              className="rounded-lg border border-line bg-surface p-3 text-xs text-muted leading-relaxed font-mono"
            >
              {step}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
};
