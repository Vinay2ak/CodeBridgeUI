import React, { useEffect, useState, useSyncExternalStore } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { sessionStore } from "../session/session";
import { SuspendedScreen } from "../session/SuspendedScreen";
import { SessionExpiredModal } from "../session/SessionExpiredModal";
import { Providers } from "./providers";
import { Shell } from "./Shell";
import { getTaskId, setTaskId, subscribeTaskId } from "../lib/taskParam";
import { workspaceApi } from "../services/workspace/api";
import { Skeleton } from "../components/ui/Skeleton";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "../components/ui/Button";

const WorkspaceAppInner: React.FC = () => {
  const queryClient = useQueryClient();
  const session = useSyncExternalStore(
    (cb) => sessionStore.subscribe(cb),
    () => sessionStore.getState()
  );

  const [currentTaskId, setCurrentTaskIdState] = useState<string | null>(getTaskId());

  useEffect(() => {
    return subscribeTaskId((id) => {
      setCurrentTaskIdState(id);
    });
  }, []);

  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ["tasks", "mine"],
    queryFn: async () => {
      try {
        return await workspaceApi.getMyTasks();
      } catch {
        return { items: [] };
      }
    },
    enabled: session.status === "authenticated",
    staleTime: 60_000,
  });

  const tasks = tasksData?.items || [];

  // If no task selected yet in query param, default to the first in-progress task or first task
  useEffect(() => {
    if (!currentTaskId && tasks.length > 0) {
      const inProgress = tasks.find((t) => t.status === "in_progress") || tasks[0];
      setTaskId(inProgress.id);
      setCurrentTaskIdState(inProgress.id);
    }
  }, [currentTaskId, tasks]);

  if (session.status === "loading" || (tasksLoading && !tasksData)) {
    return (
      <div className="min-h-screen bg-canvas text-ink p-6 space-y-6">
        <div className="h-14 border-b border-line bg-surface rounded-xl p-4 flex items-center justify-between">
          <Skeleton className="h-8 w-44" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-7 w-20 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-8 w-28 rounded-lg" />
          </div>
        </div>
        <Skeleton className="h-12 w-full rounded-xl" />
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-[calc(100vh-12rem)]">
          <Skeleton className="xl:col-span-3 h-full rounded-xl" />
          <Skeleton className="xl:col-span-6 h-full rounded-xl" />
          <Skeleton className="xl:col-span-3 h-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (session.status === "suspended") {
    return <SuspendedScreen />;
  }

  if (session.status === "unavailable") {
    return (
      <div className="min-h-screen bg-canvas text-ink flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-xl border border-line bg-surface p-6 shadow-sm text-center">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-danger-bg border border-danger-border text-danger mb-4">
            <AlertCircle className="h-6 w-6" aria-hidden="true" />
          </div>
          <h2 className="text-lg font-bold mb-2">Service Unavailable</h2>
          <p className="text-sm text-muted mb-6 leading-relaxed">
            The CodeBridge Gateway or authentication service is temporarily unreachable. Please try again.
          </p>
          <Button
            variant="primary"
            onClick={() => sessionStore.restoreSession()}
            className="w-full"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            <span>Retry Connection</span>
          </Button>
        </div>
      </div>
    );
  }

  if (!session.user) {
    return null;
  }

  return (
    <>
      <Shell
        user={session.user}
        currentTaskId={currentTaskId}
        onSelectTask={(id) => {
          setTaskId(id);
          setCurrentTaskIdState(id);
          queryClient.invalidateQueries({ queryKey: ["tasks", "mine"] });
        }}
        hasTasks={tasks.length > 0}
      />
      {session.status === "expired" && <SessionExpiredModal />}
    </>
  );
};

export const App: React.FC = () => {
  useEffect(() => {
    sessionStore.restoreSession();
  }, []);

  return (
    <Providers>
      <WorkspaceAppInner />
    </Providers>
  );
};
