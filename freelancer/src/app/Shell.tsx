import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
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
  Menu as MenuIcon,
} from "lucide-react";
import { env } from "../lib/env";
import { sessionStore, User } from "../session/session";
import { projectApi } from "../services/project/api";
import type { ProjectScope } from "../services/project/types";
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [devDrawerOpen, setDevDrawerOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  // Real backend query for projects list to auto-select real active project
  const { data: projects } = useQuery<ProjectScope[]>({
    queryKey: ["projects", "realtime-list"],
    queryFn: async () => {
      try {
        return await projectApi.getProjects();
      } catch {
        return [];
      }
    },
    staleTime: 30_000,
  });

  // Automatically select the real project from backend when loaded
  useEffect(() => {
    if (projects && projects.length > 0) {
      if (!currentTaskId || selectedProjectId === "proj_1024") {
        const found = currentTaskId
          ? projects.find((p: ProjectScope) => p.id === currentTaskId)
          : undefined;
        const target = found || projects[0];
        if (target && target.id !== selectedProjectId) {
          setSelectedProjectId(target.id);
        }
      }
    }
  }, [projects, currentTaskId, selectedProjectId]);

  // Sync currentTaskId if provided
  useEffect(() => {
    if (currentTaskId) {
      setSelectedProjectId(currentTaskId);
    }
  }, [currentTaskId]);

  // Keyboard shortcut listener for Ctrl+Shift+D and Escape for sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isSidebarOpen && typeof window !== "undefined" && window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      }
      if (env.devTools && e.ctrlKey && e.shiftKey && (e.key === "D" || e.key === "d")) {
        e.preventDefault();
        setDevDrawerOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSidebarOpen]);

  const handleOpenWorkspace = (projectId: string) => {
    setSelectedProjectId(projectId);
    onSelectTask(projectId);
    setActiveView("workspace");
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  const navItems = [
    {
      key: "radar" as const,
      label: "Tasks",
      icon: Radio,
      description: "Inspect & accept scopes",
    },
    {
      key: "workspace" as const,
      label: "Workspace",
      icon: Server,
      description: "Docker test runner & submit",
    },
    {
      key: "portfolio" as const,
      label: "Portfolio",
      icon: Award,
      description: "Verified proofs & earnings",
    },
  ];

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

  const sidebarNavigation = (
    <nav aria-label="Freelancer sidebar navigation" className="space-y-1">
      {navItems.map((item) => {
        const isActive = activeView === item.key;
        const IconComponent = item.icon;
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => {
              setActiveView(item.key);
              if (typeof window !== "undefined" && window.innerWidth < 1024) {
                setIsSidebarOpen(false);
              }
            }}
            aria-current={isActive ? "page" : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs rounded-lg transition-all text-left ${
              isActive
                ? "bg-primary/15 text-primary font-bold border-l-2 border-primary shadow-sm"
                : "text-muted hover:text-ink hover:bg-raised font-medium"
            }`}
          >
            <IconComponent
              className={`h-4 w-4 shrink-0 ${isActive ? "text-primary" : "text-muted"}`}
              aria-hidden="true"
            />
            <div className="flex-1 min-w-0">
              <span className="block truncate">{item.label}</span>
              <span className="block text-[10px] text-muted truncate font-normal">
                {item.description}
              </span>
            </div>
          </button>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-canvas text-ink">
      {/* Skip to Content */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-on-primary focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
      >
        Skip to main content
      </a>

      {/* Mobile Backdrop (< 1024px) */}
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-overlay backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sliding Collapsible Sidebar */}
      <aside
        aria-label="Freelancer Sidebar Navigation"
        className={`fixed inset-y-0 left-0 z-40 lg:z-30 w-64 flex flex-col border-r border-line bg-surface shadow-2xl lg:shadow-none transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header / Logo with three-line toggle */}
        <div className="flex h-14 items-center justify-between px-4 border-b border-line">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-info-bg border border-info-border flex items-center justify-center text-primary">
              <Code2 className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-ink block leading-none">
                CodeBridge
              </span>
              <span className="text-[10px] font-mono text-muted uppercase tracking-wider block mt-1">
                Freelancer Portal
              </span>
            </div>
          </div>

          {/* Three-line toggle button inside sidebar header to slide/hide */}
          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Hide sidebar"
            className="p-1.5 rounded-lg border border-line bg-surface text-muted hover:text-ink hover:bg-raised transition-colors"
          >
            <MenuIcon className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Sidebar Navigation Items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-muted font-bold">
            Navigation
          </div>
          {sidebarNavigation}
        </div>
      </aside>

      {/* Main Application Layout (Smoothly shifts when sidebar opens/closes) */}
      <div
        className={`flex flex-col min-h-screen transition-all duration-300 ease-in-out ${
          isSidebarOpen ? "lg:pl-64" : "lg:pl-0"
        }`}
      >
        {/* Top Header Navbar */}
        <header className="h-14 sticky top-0 z-20 border-b border-line bg-surface/95 px-4 sm:px-6 backdrop-blur flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            {/* Three-line toggle button to show/hide sidebar */}
            <button
              type="button"
              onClick={() => setIsSidebarOpen((prev) => !prev)}
              className="p-1.5 rounded-lg border border-line bg-surface text-muted hover:text-ink hover:bg-raised transition-colors"
              aria-label={isSidebarOpen ? "Hide sidebar" : "Show sidebar"}
            >
              <MenuIcon className="h-5 w-5" aria-hidden="true" />
            </button>
            <h1 className="text-sm sm:text-base font-bold text-ink">
              {activeView === "radar" && "Tasks Radar"}
              {activeView === "workspace" && "Controlled Workspace"}
              {activeView === "portfolio" && "Verified Portfolio"}
            </h1>
          </div>

          {/* Right Section: Status Pill, Theme Toggle, Profile Menu */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
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
        <main id="main-content" className="flex-1 flex flex-col min-h-0 overflow-y-auto">
          {activeView === "radar" && (
            <ErrorBoundary fallbackTitle="Task Radar Error">
              <TaskRadarView onOpenWorkspace={handleOpenWorkspace} />
            </ErrorBoundary>
          )}

          {activeView === "workspace" && (
            <ErrorBoundary fallbackTitle="Controlled Workspace Error">
              <ControlledWorkspaceView
                projectId={selectedProjectId}
                projects={projects || []}
                onSelectProject={(id) => {
                  setSelectedProjectId(id);
                  onSelectTask(id);
                }}
                onNavigateToPortfolio={() => setActiveView("portfolio")}
                onNavigateToRadar={() => setActiveView("radar")}
              />
            </ErrorBoundary>
          )}

          {activeView === "portfolio" && (
            <ErrorBoundary fallbackTitle="Verified Portfolio Error">
              <VerifiedPortfolioView onNavigateToRadar={() => setActiveView("radar")} />
            </ErrorBoundary>
          )}
        </main>
      </div>

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

      {/* Developer Diagnostics Drawer */}
      {env.devTools && (
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
