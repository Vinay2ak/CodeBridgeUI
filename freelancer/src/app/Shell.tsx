import React, { useState, useEffect } from "react";
import {
  Code2,
  User as UserIcon,
  Settings,
  LogOut,
  Keyboard,
  Wrench,
  Radio,
  Server,
  Award,
} from "lucide-react";
import { env } from "../lib/env";
import { sessionStore, User } from "../session/session";
import { TaskRadarView } from "../features/radar/TaskRadarView";
import { ControlledWorkspaceView } from "../features/workspace/ControlledWorkspaceView";
import { VerifiedPortfolioView } from "../features/portfolio/VerifiedPortfolioView";
import { LivePill } from "../components/ui/LivePill";
import { ThemeToggle } from "../components/ui/ThemeToggle";
import { Menu, MenuItem } from "../components/ui/Menu";
import { Chip } from "../components/ui/Chip";
import { Dialog } from "../components/ui/Dialog";
import { Button } from "../components/ui/Button";
import { ErrorBoundary } from "./ErrorBoundary";

const DevDrawer = React.lazy(() =>
  import("../components/dev/DevDrawer").then((m) => ({ default: m.DevDrawer }))
);

type ActiveView = "radar" | "workspace" | "portfolio";

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
  void hasTasks;
  const [activeView, setActiveView] = useState<ActiveView>("radar");
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    currentTaskId || "proj_1024"
  );
  const [devDrawerOpen, setDevDrawerOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  // Sync currentTaskId if provided
  useEffect(() => {
    if (currentTaskId) {
      setSelectedProjectId(currentTaskId);
    }
  }, [currentTaskId]);

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

  const handleOpenWorkspace = (projectId: string) => {
    setSelectedProjectId(projectId);
    onSelectTask(projectId);
    setActiveView("workspace");
  };

  const userMenuItems: MenuItem[] = [
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

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink">
      {/* Skip to Content */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-on-primary focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
      >
        Skip to main content
      </a>

      {/* Top Header Navbar */}
      <header className="h-14 border-b border-line bg-surface px-4 flex items-center justify-between gap-4 shrink-0 z-30">
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex items-center gap-2 shrink-0">
            <div className="h-8 w-8 rounded-lg bg-info-bg border border-info-border flex items-center justify-center text-primary">
              <Code2 className="h-5 w-5" aria-hidden="true" />
            </div>
            <span className="font-bold text-base tracking-tight text-ink">CodeBridge</span>
          </div>

          <div className="h-4 w-px bg-line shrink-0 hidden sm:block" aria-hidden="true" />

          {/* Core 3-View Navigation Switcher */}
          <nav
            aria-label="Core Freelancer Navigation"
            className="flex items-center gap-1 bg-canvas p-1 rounded-lg border border-line"
          >
            <button
              onClick={() => setActiveView("radar")}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                activeView === "radar"
                  ? "bg-surface text-primary shadow-sm border border-line font-bold"
                  : "text-muted hover:text-ink"
              }`}
            >
              <Radio className="h-3.5 w-3.5" />
              <span>Task Radar</span>
            </button>

            <button
              onClick={() => setActiveView("workspace")}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                activeView === "workspace"
                  ? "bg-surface text-primary shadow-sm border border-line font-bold"
                  : "text-muted hover:text-ink"
              }`}
            >
              <Server className="h-3.5 w-3.5" />
              <span>Controlled Workspace</span>
            </button>

            <button
              onClick={() => setActiveView("portfolio")}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                activeView === "portfolio"
                  ? "bg-surface text-primary shadow-sm border border-line font-bold"
                  : "text-muted hover:text-ink"
              }`}
            >
              <Award className="h-3.5 w-3.5" />
              <span>Verified Portfolio</span>
            </button>
          </nav>
        </div>

        {/* Right Section: Status Pill, Theme Toggle, Profile Menu */}
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

      {/* Main View Display */}
      <main id="main-content" className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {activeView === "radar" && (
          <ErrorBoundary fallbackTitle="Task Radar Error">
            <TaskRadarView onOpenWorkspace={handleOpenWorkspace} />
          </ErrorBoundary>
        )}

        {activeView === "workspace" && (
          <ErrorBoundary fallbackTitle="Controlled Workspace Error">
            <ControlledWorkspaceView
              projectId={selectedProjectId}
              onNavigateToPortfolio={() => setActiveView("portfolio")}
            />
          </ErrorBoundary>
        )}

        {activeView === "portfolio" && (
          <ErrorBoundary fallbackTitle="Verified Portfolio Error">
            <VerifiedPortfolioView />
          </ErrorBoundary>
        )}
      </main>

      {/* Keyboard Shortcuts Dialog */}
      <Dialog
        open={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
        title="Keyboard Shortcuts"
        description="Global workspace keyboard combinations for rapid engineering."
      >
        <div className="space-y-3 font-mono text-xs my-4">
          <div className="flex items-center justify-between p-2 rounded bg-raised border border-line">
            <span className="text-muted">Run project checks</span>
            <kbd className="px-2 py-0.5 rounded bg-surface border border-line font-bold text-primary">
              Ctrl + Enter
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

      {/* Dev Diagnostics Drawer (Ctrl+Shift+D) */}
      {env.devTools && devDrawerOpen && (
        <React.Suspense fallback={null}>
          <DevDrawer
            open={devDrawerOpen}
            onClose={() => setDevDrawerOpen(false)}
            taskId={selectedProjectId}
          />
        </React.Suspense>
      )}
    </div>
  );
};
