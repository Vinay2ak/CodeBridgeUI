import React, { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Play,
  Square,
  RotateCcw,
  Cpu,
  HardDrive,
  Clock,
  Lock,
  AlertCircle,
  Loader2,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { workspaceApi } from "../../services/workspace/api";
import { WorkspaceStatus } from "../../services/workspace/types";
import { Dialog } from "../../components/ui/Dialog";
import { Button } from "../../components/ui/Button";
import { Chip } from "../../components/ui/Chip";
import { eventStore } from "../../realtime/store";
import { formatCountdown } from "../../lib/format";
import { ApiError } from "../../lib/errors";

interface WorkspaceStatusCardProps {
  taskId: string;
}

export const WorkspaceStatusCard: React.FC<WorkspaceStatusCardProps> = ({ taskId }) => {
  const queryClient = useQueryClient();
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [, setNow] = useState(Date.now());

  const { data: ws, isLoading, error, refetch } = useQuery({
    queryKey: ["workspace", taskId],
    queryFn: () => workspaceApi.getWorkspace(taskId),
    enabled: Boolean(taskId),
    refetchInterval: 5000,
  });

  // Listen for realtime workspace status updates
  useEffect(() => {
    const unsubscribe = eventStore.subscribe("workspace.status_changed", (event) => {
      const data = event.data as { taskId: string; status: WorkspaceStatus };
      if (data && data.taskId === taskId) {
        queryClient.invalidateQueries({ queryKey: ["workspace", taskId] });
      }
    });
    return unsubscribe;
  }, [taskId, queryClient]);

  // Update countdown clock every second when running
  useEffect(() => {
    if (ws?.status === "running") {
      const timer = setInterval(() => setNow(Date.now()), 1000);
      return () => clearInterval(timer);
    }
  }, [ws?.status]);

  const startMutation = useMutation({
    mutationFn: () => workspaceApi.startWorkspace(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace", taskId] });
    },
  });

  const stopMutation = useMutation({
    mutationFn: () => workspaceApi.stopWorkspace(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace", taskId] });
    },
  });

  const resetMutation = useMutation({
    mutationFn: () => workspaceApi.resetWorkspace(taskId),
    onSuccess: () => {
      setResetDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["workspace", taskId] });
    },
  });

  if (isLoading) {
    return (
      <div className="rounded-xl border border-line bg-surface p-4 shadow-sm animate-pulse space-y-4">
        <div className="h-6 w-1/3 bg-raised rounded" />
        <div className="h-24 bg-raised rounded-lg" />
        <div className="h-10 bg-raised rounded-lg" />
      </div>
    );
  }

  if (error) {
    const apiError = error instanceof ApiError ? error : null;
    const correlationId = apiError?.correlationId || "err_ws";

    return (
      <div className="rounded-xl border border-line bg-surface p-5 shadow-sm text-center">
        <p className="text-sm text-ink mb-1">Failed to load workspace status.</p>
        <p className="text-xs text-muted mb-4 font-mono">Reference: {correlationId}</p>
        <Button variant="secondary" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Retry</span>
        </Button>
      </div>
    );
  }

  const status = ws?.status || "stopped";
  const isLocked = taskId === "t2" || taskId === "t3";
  const isRunning = status === "running";
  const isTransitioning = status === "provisioning" || status === "starting";

  const getStatusChip = (st: WorkspaceStatus) => {
    switch (st) {
      case "running":
        return (
          <Chip tone="success" icon={<Play className="h-3 w-3" aria-hidden="true" />}>
            Running
          </Chip>
        );
      case "provisioning":
        return (
          <Chip tone="info" icon={<Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />}>
            Provisioning
          </Chip>
        );
      case "starting":
        return (
          <Chip tone="warning" icon={<Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />}>
            Starting
          </Chip>
        );
      case "idle":
        return (
          <Chip tone="neutral" icon={<Clock className="h-3 w-3" aria-hidden="true" />}>
            Idle
          </Chip>
        );
      case "error":
        return (
          <Chip tone="danger" icon={<AlertCircle className="h-3 w-3" aria-hidden="true" />}>
            Error
          </Chip>
        );
      case "stopped":
      default:
        return (
          <Chip tone="neutral" icon={<Square className="h-3 w-3" aria-hidden="true" />}>
            Stopped
          </Chip>
        );
    }
  };

  return (
    <section className="rounded-xl border border-line bg-surface p-4 shadow-sm space-y-4">
      {/* Live announcement region for accessibility */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {`Workspace status is ${status}`}
      </div>

      <div className="flex items-center justify-between pb-3 border-b border-line">
        <h3 className="text-sm font-semibold text-ink">Isolated Workspace</h3>
        {getStatusChip(status)}
      </div>

      {isLocked && (
        <div className="rounded-lg border border-line bg-raised p-2.5 flex items-center gap-2 text-xs text-muted">
          <Lock className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
          <span>This task is locked. Workspace modifications are disabled.</span>
        </div>
      )}

      {/* Specifications */}
      <div className="space-y-2 text-xs">
        <div className="flex items-center justify-between py-1 border-b border-line">
          <span className="text-muted">Environment</span>
          <span className="font-mono text-ink">
            {ws?.image || "python:3.12-slim"} · {ws?.template || "FastAPI template"}
          </span>
        </div>

        <div className="flex items-center justify-between py-1 border-b border-line">
          <span className="text-muted">Resource Limits</span>
          <div className="flex items-center gap-3 font-mono text-ink">
            <span className="flex items-center gap-1">
              <Cpu className="h-3 w-3 text-muted" aria-hidden="true" />
              {ws?.cpu || "2 vCPU"}
            </span>
            <span className="flex items-center gap-1">
              <HardDrive className="h-3 w-3 text-muted" aria-hidden="true" />
              {ws?.memory || "4 GB"}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between py-1 border-b border-line">
          <span className="text-muted">Repository Access</span>
          <span className="flex items-center gap-1 text-ink font-mono">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            <span>read-only snapshot @ {ws?.commit || "a1b2c3d"}</span>
          </span>
        </div>

        {isRunning && ws?.expiresAt && (
          <div className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-info-bg border border-info-border">
            <span className="text-primary font-medium flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              Session expires in
            </span>
            <span className="font-mono font-bold text-primary">
              {formatCountdown(ws.expiresAt)}
            </span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-1">
        <Button
          variant="primary"
          size="sm"
          className="flex-1"
          disabled={isLocked || isRunning || isTransitioning || startMutation.isPending}
          onClick={() => startMutation.mutate()}
        >
          {startMutation.isPending || isTransitioning ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <Play className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          <span>Start</span>
        </Button>

        <Button
          variant="secondary"
          size="sm"
          className="flex-1"
          disabled={isLocked || !isRunning || isTransitioning || stopMutation.isPending}
          onClick={() => stopMutation.mutate()}
        >
          {stopMutation.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <Square className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          <span>Stop</span>
        </Button>

        <Button
          variant="secondary"
          size="sm"
          disabled={isLocked || !isRunning || isTransitioning || resetMutation.isPending}
          onClick={() => setResetDialogOpen(true)}
          title="Reset workspace"
          aria-label="Reset workspace"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Reset</span>
        </Button>
      </div>

      {/* Reset Confirmation Dialog */}
      <Dialog
        open={resetDialogOpen}
        onClose={() => setResetDialogOpen(false)}
        title="Reset workspace?"
        description="All uncommitted changes in this isolated workspace will be permanently discarded, and files will be restored to the initial git commit snapshot."
      >
        <div className="flex items-center justify-end gap-3 mt-6">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setResetDialogOpen(false)}
            disabled={resetMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => resetMutation.mutate()}
            disabled={resetMutation.isPending}
          >
            {resetMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            <span>Reset Workspace</span>
          </Button>
        </div>
      </Dialog>
    </section>
  );
};
