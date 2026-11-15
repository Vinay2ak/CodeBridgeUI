import React, { useState, useEffect, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Code2,
  User as UserIcon,
  Settings,
  LogOut,
  Keyboard,
  Wrench,
  Briefcase,
} from "lucide-react";
import { env } from "../lib/env";
import { sessionStore, User } from "../session/session";
import { TaskSwitcher } from "../features/task/TaskSwitcher";
import { TaskMarketplace } from "../features/task/TaskMarketplace";
import { EscrowBar } from "../features/task/EscrowBar";
import { TaskPanel } from "../features/task/TaskPanel";
import { WorkspaceStatusCard } from "../features/task/WorkspaceStatusCard";
import { WorkspaceCenter } from "../features/code/WorkspaceCenter";
import { SubmissionPanel } from "../features/submission/SubmissionPanel";
import { useFiles } from "../features/code/useFiles";
import { workspaceApi } from "../services/workspace/api";
import { LivePill } from "../components/ui/LivePill";
import { ThemeToggle } from "../components/ui/ThemeToggle";
import { Menu, MenuItem } from "../components/ui/Menu";
import { Chip } from "../components/ui/Chip";
import { Tabs, TabItem } from "../components/ui/Tabs";
import { Dialog } from "../components/ui/Dialog";
import { Button } from "../components/ui/Button";
import { ErrorBoundary } from "./ErrorBoundary";
import { isRunStale } from "../features/submission/gate";
import { submissionApi } from "../services/submission/api";

const DevDrawer = React.lazy(() =>
  import("../components/dev/DevDrawer").then((m) => ({ default: m.DevDrawer }))
);

interface ShellProps {
  user: User;
  currentTaskId: string | null;
  onSelectTask: (taskId: string) => void;
  hasTasks: boolean;
}

export const Shell: React.FC<ShellProps> = ({
  user,
  currentTaskId,
  onSelectTask,
  hasTasks,
}) => {
  const [mobileColumn, setMobileColumn] = useState<"task" | "code" | "run" | "status">("task");
  const [devDrawerOpen, setDevDrawerOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [showMarketplace, setShowMarketplace] = useState(!hasTasks);

  // If tasks become available or empty, adjust marketplace visibility
  useEffect(() => {
    if (!hasTasks) {
      setShowMarketplace(true);
    }
  }, [hasTasks]);

  const activeId = hasTasks && !showMarketplace ? currentTaskId : null;
  const filesState = useFiles(activeId || "");

  const { data: wsData } = useQuery({
    queryKey: ["workspace", activeId],
    queryFn: () => workspaceApi.getWorkspace(activeId!),
    enabled: Boolean(hasTasks && activeId),
  });

  const { data: subData } = useQuery({
    queryKey: ["submission", "current", activeId],
    queryFn: () => submissionApi.getCurrentSubmission(activeId!),
    enabled: Boolean(hasTasks && activeId),
  });

  const workspaceStatus = wsData?.status || "stopped";
  const isStale = isRunStale(
    subData?.lastRun?.status === "completed" ? 1 : null,
    filesState.lastSavedAt
  );

  // Keyboard shortcut listener for Ctrl+Shift+D
  useEffect(() => {
    if (!env.devTools) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && (e.key === "D" || e.key === "d")) {
        e.preventDefault();
        setDevDrawerOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const userMenuItems: MenuItem[] = [
    {
      label: "Task Marketplace",
      icon: <Briefcase className="h-4 w-4" aria-hidden="true" />,
      onClick: () => setShowMarketplace(true),
    },
    {
      label: "Account",
      icon: <Settings className="h-4 w-4" aria-hidden="true" />,
      href: env.accountUrl,
    },
    {
      label: "Keyboard shortcuts",
      icon: <Keyboard className="h-4 w-4" aria-hidden="true" />,
      onClick: () => setShortcutsOpen(true),
    },
    ...(env.devTools
      ? [
          {
            label: "Dev Diagnostics (Ctrl+Shift+D)",
            icon: <Wrench className="h-4 w-4" aria-hidden="true" />,
            onClick: () => setDevDrawerOpen(true),
          },
        ]
      : []),
    {
      label: "Sign out",
      icon: <LogOut className="h-4 w-4" aria-hidden="true" />,
      danger: true,
      onClick: () => {
        sessionStore.logout();
      },
    },
  ];

  const mobileTabs: TabItem[] = [
    { id: "task", label: "Task" },
    { id: "code", label: "Code" },
    { id: "run", label: "Run" },
    { id: "status", label: "Status" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink">
      {/* Skip to Content */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-on-primary focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
      >
        Skip to main content
      </a>

      {/* Header */}
      <header className="h-14 border-b border-line bg-surface px-4 flex items-center justify-between gap-4 shrink-0 z-30">
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex items-center gap-2 shrink-0">
            <div className="h-8 w-8 rounded-lg bg-info-bg border border-info-border flex items-center justify-center text-primary">
              <Code2 className="h-5 w-5" aria-hidden="true" />
            </div>
            <span className="font-bold text-base tracking-tight text-ink">CodeBridge</span>
          </div>

          <div className="h-4 w-px bg-line shrink-0 hidden sm:block" aria-hidden="true" />

          <h1 className="text-sm font-semibold text-muted hidden md:block shrink-0">
            Developer workspace
          </h1>

          {hasTasks && (
            <div className="flex items-center gap-2 min-w-0">
              <TaskSwitcher
                currentTaskId={currentTaskId}
                onSelectTask={(id) => {
                  onSelectTask(id);
                  setShowMarketplace(false);
                }}
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowMarketplace((prev) => !prev)}
                className="text-xs h-8 px-2.5 text-muted hover:text-ink shrink-0"
              >
                <Briefcase className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden lg:inline">
                  {showMarketplace ? "Active Workspace" : "Browse Tasks"}
                </span>
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <LivePill />
          <ThemeToggle />

          <Menu
            triggerLabel={
              <span className="flex items-center gap-2">
                <span className="font-medium text-xs text-ink hidden sm:inline">
                  {user.displayName}
                </span>
                <Chip
                  tone="neutral"
                  icon={<UserIcon className="h-3 w-3" aria-hidden="true" />}
                  className="hidden md:inline-flex"
                >
                  Freelancer
                </Chip>
              </span>
            }
            items={userMenuItems}
          />
        </div>
      </header>

      {/* Main Content Area */}
      {!hasTasks || showMarketplace ? (
        <main id="main-content" className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <TaskMarketplace
            onSelectTask={(taskId) => {
              onSelectTask(taskId);
              setShowMarketplace(false);
            }}
            hasExistingTasks={hasTasks}
            onBack={hasTasks ? () => setShowMarketplace(false) : undefined}
          />
        </main>
      ) : (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Escrow Bar */}
          {currentTaskId && (
            <ErrorBoundary fallbackTitle="Escrow Bar Error">
              <EscrowBar taskId={currentTaskId} />
            </ErrorBoundary>
          )}

          {/* Mobile Column Navigation (< 1280px) */}
          <div className="xl:hidden border-b border-line bg-surface p-2 flex justify-center shrink-0">
            <Tabs
              tabs={mobileTabs}
              activeTab={mobileColumn}
              onChange={(id) => setMobileColumn(id as "task" | "code" | "run" | "status")}
              ariaLabel="Workspace column switcher"
            />
          </div>

          {/* 3-Column Layout */}
          <main id="main-content" className="flex-1 flex min-h-0 overflow-hidden">
            {/* Left Column: TaskPanel (22rem) */}
            <section
              aria-label="Task Specification and Context"
              className={`w-full xl:w-[22rem] shrink-0 h-full flex flex-col overflow-hidden ${
                mobileColumn === "task" ? "flex" : "hidden xl:flex"
              }`}
            >
              {currentTaskId && (
                <ErrorBoundary fallbackTitle="Task Panel Error">
                  <TaskPanel
                    taskId={currentTaskId}
                    onOpenFile={(path) => {
                      filesState.openFile(path);
                      setMobileColumn("code");
                    }}
                  />
                </ErrorBoundary>
              )}
            </section>

            {/* Center Column: Code Workspace + Dock */}
            <section
              aria-label="Code Workspace and Terminal"
              className={`flex-1 h-full min-w-0 bg-canvas overflow-hidden ${
                mobileColumn === "code" || mobileColumn === "run" ? "flex" : "hidden xl:flex"
              } flex-col`}
            >
              {currentTaskId && (
                <ErrorBoundary fallbackTitle="Code Workspace Error">
                  <WorkspaceCenter
                    taskId={currentTaskId}
                    workspaceStatus={workspaceStatus}
                    filesState={filesState}
                    mobileView={mobileColumn === "run" ? "run" : "code"}
                    onOpenMobileRun={() => setMobileColumn("run")}
                  />
                </ErrorBoundary>
              )}
            </section>

            {/* Right Column: Workspace Status Card & Submission Panel (21rem) */}
            <section
              aria-label="Workspace Runtime and Submission"
              className={`w-full xl:w-[21rem] shrink-0 h-full border-l border-line bg-surface p-4 overflow-y-auto space-y-4 ${
                mobileColumn === "status" ? "block" : "hidden xl:block"
              }`}
            >
              {currentTaskId && (
                <>
                  <ErrorBoundary fallbackTitle="Workspace Status Error">
                    <WorkspaceStatusCard taskId={currentTaskId} />
                  </ErrorBoundary>
                  <ErrorBoundary fallbackTitle="Submission Panel Error">
                    <SubmissionPanel
                      taskId={currentTaskId}
                      workspaceStatus={workspaceStatus}
                      changedCount={filesState.changedFiles.length}
                      isStale={isStale}
                    />
                  </ErrorBoundary>
                </>
              )}
            </section>
          </main>
        </div>
      )}

      {/* Keyboard Shortcuts Dialog */}
      <Dialog
        open={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
        title="Keyboard Shortcuts"
        description="Global and local workspace keyboard combinations for rapid engineering."
      >
        <div className="space-y-3 font-mono text-xs my-4">
          <div className="flex items-center justify-between p-2 rounded bg-raised border border-line">
            <span className="text-muted">Save active file in editor</span>
            <kbd className="px-2 py-0.5 rounded bg-surface border border-line font-bold text-primary">
              Ctrl + S
            </kbd>
          </div>
          <div className="flex items-center justify-between p-2 rounded bg-raised border border-line">
            <span className="text-muted">Trigger test verification run</span>
            <kbd className="px-2 py-0.5 rounded bg-surface border border-line font-bold text-primary">
              Ctrl + Enter
            </kbd>
          </div>
          <div className="flex items-center justify-between p-2 rounded bg-raised border border-line">
            <span className="text-muted">Focus workspace terminal</span>
            <kbd className="px-2 py-0.5 rounded bg-surface border border-line font-bold text-primary">
              Ctrl + `
            </kbd>
          </div>
          <div className="flex items-center justify-between p-2 rounded bg-raised border border-line">
            <span className="text-muted">Toggle developer diagnostics drawer</span>
            <kbd className="px-2 py-0.5 rounded bg-surface border border-line font-bold text-primary">
              Ctrl + Shift + D
            </kbd>
          </div>
        </div>
        <div className="flex justify-end">
          <Button variant="secondary" size="sm" onClick={() => setShortcutsOpen(false)}>
            Close
          </Button>
        </div>
      </Dialog>

      {/* Developer Diagnostics Drawer */}
      {env.devTools && devDrawerOpen && (
        <ErrorBoundary fallbackTitle="Dev Drawer Error">
          <Suspense fallback={null}>
            <DevDrawer
              open={devDrawerOpen}
              onClose={() => setDevDrawerOpen(false)}
              taskId={activeId || ""}
            />
          </Suspense>
        </ErrorBoundary>
      )}
    </div>
  );
};
