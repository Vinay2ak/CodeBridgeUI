import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Code2,
  User as UserIcon,
  Settings,
  LogOut,
  Menu as MenuIcon,
  X,
} from "lucide-react";
import { env } from "../lib/env";
import { sessionStore, User } from "../session/session";
import { projectApi } from "../services/project/api";
import type { ProjectScope } from "../services/project/types";
import { DeveloperDashboardView } from "../features/dashboard/DeveloperDashboardView";
import { TaskRadarView } from "../features/radar/TaskRadarView";
import { ControlledWorkspaceView } from "../features/workspace/ControlledWorkspaceView";
import { VerifiedPortfolioView } from "../features/portfolio/VerifiedPortfolioView";
import { ThemeToggle } from "../components/ui/ThemeToggle";
import { Menu, MenuItem } from "../components/ui/Menu";
import { Chip } from "../components/ui/Chip";
import { Dialog } from "../components/ui/Dialog";
import { Button } from "../components/ui/Button";
import { ErrorBoundary } from "./ErrorBoundary";

const DevDrawer = React.lazy(() =>
  import("../components/dev/DevDrawer").then((m) => ({ default: m.DevDrawer }))
);

type ActiveView = "dashboard" | "radar" | "workspace" | "portfolio" | "settings";

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
  const [activeView, setActiveView] = useState<ActiveView>("dashboard");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    currentTaskId || null
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 1024;
    }
    return false;
  });
  const [devDrawerOpen, setDevDrawerOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  // Resize listener to adapt sidebar state when crossing breakpoints
  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== "undefined") {
        if (window.innerWidth < 1024) {
          setIsSidebarOpen(false);
        } else {
          setIsSidebarOpen(true);
        }
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
      if (!selectedProjectId) {
        const found = currentTaskId
          ? projects.find((p: ProjectScope) => p.id === currentTaskId)
          : undefined;
        const target = found || projects[0];
        if (target) {
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

  // Handle responsive resize when toggling device toolbar or changing viewports
  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== "undefined" && window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
      key: "dashboard" as const,
      label: "Overview",
    },
    {
      key: "radar" as const,
      label: "Projects",
    },
    {
      key: "workspace" as const,
      label: "Workspace",
    },
    {
      key: "portfolio" as const,
      label: "Profile",
    },
    {
      key: "settings" as const,
      label: "Settings",
    },
  ];

  const userMenuItems: MenuItem[] = [
    {
      label: "Profile",
      icon: <UserIcon className="h-4 w-4" aria-hidden="true" />,
      onClick: () => setActiveView("portfolio"),
    },
    {
      label: "Settings",
      icon: <Settings className="h-4 w-4" aria-hidden="true" />,
      onClick: () => setActiveView("settings"),
    },
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
    <nav aria-label="Freelancer sidebar navigation" className="flex flex-col gap-1">
      {navItems.map((item) => {
        const isActive = activeView === item.key;
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
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors text-left focus-visible:outline-2 focus-visible:outline-primary ${
              isActive
                ? "bg-primary/15 text-primary font-bold border-l-2 border-primary"
                : "text-muted hover:text-ink hover:bg-raised"
            }`}
          >
            {item.label}
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
        className={`fixed inset-y-0 left-0 z-40 lg:z-30 w-64 max-w-xs flex flex-col border-r border-line bg-surface shadow-2xl lg:shadow-none transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header / Logo with clean CodeBridge and X close button (Matches Picture 2!) */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-line">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-primary" aria-hidden="true" />
            <span className="font-bold text-base text-ink tracking-tight">CodeBridge</span>
          </div>

          {/* Clean X button to close navigation menu */}
          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close navigation menu"
            className="p-1.5 rounded-md text-muted hover:text-ink hover:bg-raised transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Sidebar Navigation Items */}
        <div className="flex-1 overflow-y-auto py-2">
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
        <header className="h-14 sticky top-0 z-20 border-b border-line bg-surface/95 px-3 sm:px-6 backdrop-blur flex items-center justify-between gap-2 sm:gap-4 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Three-line toggle button to reopen sidebar when collapsed */}
            {!isSidebarOpen && (
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                className="p-1.5 rounded-lg border border-line bg-surface text-muted hover:text-ink hover:bg-raised transition-colors shrink-0"
                aria-label="Show sidebar"
              >
                <MenuIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            )}
            <h1 className="text-sm sm:text-base font-bold text-ink truncate">
              {activeView === "dashboard" && "Overview"}
              {activeView === "radar" && "Projects"}
              {activeView === "workspace" && "Controlled Workspace"}
              {activeView === "portfolio" && "Profile"}
              {activeView === "settings" && "Settings"}
            </h1>
          </div>

          {/* Right Section: Theme Toggle, Profile Menu */}
          <div className="flex items-center gap-2 sm:gap-3.5 shrink-0">
            <ThemeToggle />

            <Menu
              triggerLabel={
                <span className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4 sm:hidden text-ink" aria-hidden="true" />
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
          {activeView === "dashboard" && (
            <ErrorBoundary fallbackTitle="Dashboard Error">
              <DeveloperDashboardView
                user={user}
                onNavigateToRadar={() => setActiveView("radar")}
                onNavigateToWorkspace={(id) => handleOpenWorkspace(id)}
                onNavigateToProfile={() => setActiveView("portfolio")}
              />
            </ErrorBoundary>
          )}

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
              <VerifiedPortfolioView
                user={user}
                initialTab="profile"
                onNavigateToRadar={() => setActiveView("radar")}
              />
            </ErrorBoundary>
          )}

          {activeView === "settings" && (
            <ErrorBoundary fallbackTitle="Settings Error">
              <VerifiedPortfolioView
                user={user}
                initialTab="settings"
                onNavigateToRadar={() => setActiveView("radar")}
              />
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
            taskId={selectedProjectId || ""}
          />
        </React.Suspense>
      )}
    </div>
  );
};
