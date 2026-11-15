import React, { useEffect, useState, useSyncExternalStore } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Play,
  Square,
  RotateCcw,
  Coins,
  CheckCircle,
  FileCheck2,
  RefreshCw,
} from "lucide-react";
import { workspaceApi } from "../../services/workspace/api";
import { eventStore } from "../../realtime/store";
import { formatRelativeTime } from "../../lib/format";
import { ApiError } from "../../lib/errors";

interface TimelineTabProps {
  taskId: string;
}

interface TimelineItem {
  id: string;
  at: string;
  type: string;
  text: string;
}

export const TimelineTab: React.FC<TimelineTabProps> = ({ taskId }) => {
  // Tick every 30s to update relative timestamps
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const { data: task, isLoading, error, refetch } = useQuery({
    queryKey: ["task", taskId],
    queryFn: () => workspaceApi.getTask(taskId),
    enabled: Boolean(taskId),
  });

  // Subscribe to live events
  const liveEvents = useSyncExternalStore(
    (cb) => eventStore.subscribeAll(cb),
    () => eventStore.getEvents()
  );

  const getEventDescription = (type: string, data: any): string => {
    switch (type) {
      case "workspace.status_changed":
        return `Workspace status transitioned to ${data.status}`;
      case "test.run.progress":
        return `Test ${data.testId} is ${data.status}`;
      case "test.run.completed":
        return `Test run completed: ${data.passed} passed, ${data.failed} failed`;
      case "submission.status_changed":
        return `Submission status updated to ${data.status}${data.note ? `: ${data.note}` : ""}`;
      case "payment.state_changed":
        return `Payment escrow transitioned to ${data.state}`;
      case "task.assigned":
        return `Task assigned: ${data.title || "New task"}`;
      default:
        return `System event: ${type}`;
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case "workspace.status_changed":
      case "workspace.created":
        return <Play className="h-3.5 w-3.5 text-primary" aria-hidden="true" />;
      case "workspace.stopped":
        return <Square className="h-3.5 w-3.5 text-muted" aria-hidden="true" />;
      case "workspace.reset":
        return <RotateCcw className="h-3.5 w-3.5 text-warning" aria-hidden="true" />;
      case "test.run.progress":
      case "test.run.completed":
        return <CheckCircle className="h-3.5 w-3.5 text-success" aria-hidden="true" />;
      case "submission.created":
      case "submission.status_changed":
        return <FileCheck2 className="h-3.5 w-3.5 text-primary" aria-hidden="true" />;
      case "payment.state_changed":
      case "escrow.held":
      case "payment.released":
        return <Coins className="h-3.5 w-3.5 text-money-text" aria-hidden="true" />;
      default:
        return <Activity className="h-3.5 w-3.5 text-muted" aria-hidden="true" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 bg-raised rounded" />
        <div className="h-10 bg-raised rounded" />
        <div className="h-10 bg-raised rounded" />
      </div>
    );
  }

  if (error) {
    const apiError = error instanceof ApiError ? error : null;
    const correlationId = apiError?.correlationId || "err_timeline";

    return (
      <div className="rounded-lg border border-line bg-raised p-4 text-center">
        <p className="text-sm text-ink mb-1">Failed to load timeline activity.</p>
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

  // Merge static task history and live events for this taskId
  const historyItems: TimelineItem[] = (task?.history || []).map((h, i) => ({
    id: `hist_${i}_${h.at}`,
    at: h.at,
    type: h.type,
    text: h.text,
  }));

  const liveItems: TimelineItem[] = liveEvents
    .filter((e) => {
      const d = e.data as any;
      return d && d.taskId === taskId;
    })
    .map((e) => ({
      id: e.id,
      at: e.occurredAt,
      type: e.type,
      text: getEventDescription(e.type, e.data),
    }));

  const merged = [...liveItems, ...historyItems].sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()
  );

  if (merged.length === 0) {
    return (
      <div className="py-12 text-center text-muted text-sm">
        No activity yet
      </div>
    );
  }

  return (
    <div className="relative pl-4 space-y-4 text-sm">
      <div
        aria-hidden="true"
        className="absolute left-1.5 top-2 bottom-2 w-0.5 bg-line"
      />

      {merged.map((item) => (
        <div key={item.id} className="relative flex items-start gap-3">
          <div className="h-6 w-6 rounded-full bg-surface border border-line flex items-center justify-center shrink-0 z-10 -ml-5">
            {getEventIcon(item.type)}
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <p className="text-xs text-ink leading-snug">{item.text}</p>
            <time className="text-[11px] text-muted block mt-0.5" dateTime={item.at}>
              {formatRelativeTime(item.at)}
            </time>
          </div>
        </div>
      ))}
    </div>
  );
};
