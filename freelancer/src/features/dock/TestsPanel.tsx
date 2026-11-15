import React, { useEffect, useState, useRef } from "react";
import {
  Play,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
  FileCode,
  Save,
  AlertTriangle,
} from "lucide-react";
import { Run, TestStatus } from "../../services/submission/types";
import { TEST_RULES } from "../../mocks/data/rules";
import { Button } from "../../components/ui/Button";
import { Chip } from "../../components/ui/Chip";
import { Alert } from "../../components/ui/Alert";

interface TestsPanelProps {
  taskId: string;
  isWorkspaceRunning: boolean;
  hasUnsavedChanges: boolean;
  isStale: boolean;
  latestRun: Run | null;
  isRunningTests: boolean;
  onRunTests: () => void;
  onSaveAll: () => Promise<void>;
  onOpenFile: (path: string) => void;
}

export const TestsPanel: React.FC<TestsPanelProps> = ({
  isWorkspaceRunning,
  hasUnsavedChanges,
  isStale,
  latestRun,
  isRunningTests,
  onRunTests,
  onSaveAll,
  onOpenFile,
}) => {
  const [announcedSummary, setAnnouncedSummary] = useState<string | null>(null);
  const prevRunStatusRef = useRef<string | undefined>(latestRun?.status);

  // Announce completion summary once per completed run
  useEffect(() => {
    if (
      latestRun &&
      latestRun.status === "completed" &&
      prevRunStatusRef.current !== "completed"
    ) {
      const passed = latestRun.results.filter((r) => r.status === "passed").length;
      const total = latestRun.results.length;

      const rulesMap = new Map(TEST_RULES.map((r) => [r.testId, r]));
      const requiredTests = latestRun.results.filter((r) => rulesMap.get(r.testId)?.required);
      const requiredPassed = requiredTests.filter((r) => r.status === "passed").length;

      const summary = `${passed} of ${total} passed · ${requiredPassed} required of ${requiredTests.length}`;
      setAnnouncedSummary(summary);
    }
    prevRunStatusRef.current = latestRun?.status;
  }, [latestRun]);

  const rulesMap = new Map(TEST_RULES.map((r) => [r.testId, r]));

  const results = latestRun ? latestRun.results : [];
  const totalTests = TEST_RULES.length;
  const completedCount = results.filter((r) => r.status === "passed" || r.status === "failed").length;
  const progressPercent = totalTests > 0 ? Math.round((completedCount / totalTests) * 100) : 0;

  const getStatusItem = (status: TestStatus) => {
    switch (status) {
      case "passed":
        return {
          icon: <CheckCircle2 className="h-4 w-4 text-success" aria-hidden="true" />,
          label: "Passed",
          colorClass: "text-success",
        };
      case "failed":
        return {
          icon: <AlertCircle className="h-4 w-4 text-danger" aria-hidden="true" />,
          label: "Failed",
          colorClass: "text-danger",
        };
      case "running":
        return {
          icon: <Loader2 className="h-4 w-4 text-primary animate-spin" aria-hidden="true" />,
          label: "Running",
          colorClass: "text-primary",
        };
      case "pending":
      default:
        return {
          icon: <Clock className="h-4 w-4 text-muted" aria-hidden="true" />,
          label: "Pending",
          colorClass: "text-muted",
        };
    }
  };

  return (
    <div className="h-full flex flex-col bg-canvas overflow-hidden text-xs">
      {/* Polite Live Region for completion summary */}
      <div className="sr-only" aria-live="polite">
        {announcedSummary || ""}
      </div>

      {/* Action Header */}
      <div className="flex items-center justify-between p-3 border-b border-line bg-surface shrink-0">
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={onRunTests}
            disabled={!isWorkspaceRunning || isRunningTests || hasUnsavedChanges}
          >
            {isRunningTests ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Play className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            <span>Run tests (Ctrl+Enter)</span>
          </Button>

          {hasUnsavedChanges && (
            <div className="flex items-center gap-2 text-warning bg-warning-bg border border-warning-border px-2.5 py-1 rounded">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>Save your changes first</span>
              <button
                type="button"
                onClick={() => onSaveAll()}
                className="underline font-semibold ml-1 hover:text-ink flex items-center gap-1"
              >
                <Save className="h-3 w-3" aria-hidden="true" />
                <span>Save all</span>
              </button>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {latestRun && (
          <div className="flex items-center gap-3">
            <span className="font-mono text-muted">
              {completedCount} / {totalTests} completed
            </span>
            <div
              className="w-32 h-2 bg-raised rounded-full overflow-hidden border border-line"
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Test run progress ${progressPercent}%`}
            >
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Stale Warning Banner */}
      {isStale && (
        <div className="p-3 border-b border-line">
          <Alert tone="warning" title="Stale Test Results">
            Code changed since this run. Run the tests again to update verification.
          </Alert>
        </div>
      )}

      {/* Results List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {!latestRun ? (
          <div className="py-12 text-center text-muted">
            <p>No test runs executed yet for this task.</p>
            <p className="mt-1">Click "Run tests" above or press Ctrl+Enter to begin.</p>
          </div>
        ) : (
          results.map((res) => {
            const rule = rulesMap.get(res.testId);
            const statusInfo = getStatusItem(res.status);
            const isRequired = rule?.required ?? true;
            const owningFile = rule?.file || "app/main.py";

            return (
              <div
                key={res.testId}
                className="rounded-lg border border-line bg-surface p-3 space-y-2 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {statusInfo.icon}
                    <span className="font-mono font-semibold text-ink truncate">
                      {res.testId}
                    </span>
                    <span className={`font-medium ${statusInfo.colorClass}`}>
                      {statusInfo.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {res.durationMs !== undefined && (
                      <span className="font-mono text-muted text-[11px]">
                        {res.durationMs}ms
                      </span>
                    )}
                    <Chip tone={isRequired ? "warning" : "neutral"}>
                      {isRequired ? "Required" : "Optional"}
                    </Chip>
                  </div>
                </div>

                {/* Error message block with file button */}
                {res.status === "failed" && res.message && (
                  <div className="rounded border border-danger-border bg-danger-bg p-2.5 space-y-2 mt-1">
                    <pre className="font-mono text-danger text-[11px] whitespace-pre-wrap leading-relaxed">
                      {res.message}
                    </pre>
                    <div className="flex items-center justify-between pt-1 border-t border-danger-border/40">
                      <span className="text-[11px] text-muted">Occurred in:</span>
                      <button
                        type="button"
                        onClick={() => onOpenFile(owningFile)}
                        className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold text-primary hover:underline"
                      >
                        <FileCode className="h-3 w-3" aria-hidden="true" />
                        <span>{owningFile}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

