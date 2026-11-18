import React, { useState, useEffect, useRef } from "react";
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
type NavKey = "overview" | "projects" | "payments" | "activity" | "settings";

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
  const [activeNavKey, setActiveNavKey] = useState<NavKey>("overview");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    currentTaskId || null
  );
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const [devDrawerOpen, setDevDrawerOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  // Escape listener closes the navigation drawer and returns focus to menu button
  useEffect(() => {
    if (!isMenuOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setIsMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isMenuOpen]);

  // Dev tools shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (env.devTools && e.ctrlKey && e.shiftKey && (e.key === "D" || e.key === "d")) {
        e.preventDefault();
        setDevDrawerOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
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

  const navItems: { key: NavKey; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "projects", label: "Projects" },
    { key: "payments", label: "Payments" },
    { key: "activity", label: "Activity" },
    { key: "settings", label: "Settings" },
  ];

  const handleNavSelect = (key: NavKey) => {
    setActiveNavKey(key);
    setIsMenuOpen(false);
    menuButtonRef.current?.focus();

    if (key === "overview") {
      setActiveView("dashboard");
    } else if (key === "projects") {
      setActiveView("radar");
    } else if (key === "payments") {
      setActiveView("dashboard");
      setTimeout(() => {
        const el = document.getElementById("performance-metrics") || document.getElementById("analytics");
        el?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    } else if (key === "activity") {
      setActiveView("workspace");
    } else if (key === "settings") {
      setActiveView("settings");
    }
  };

  const handleOpenWorkspace = (projectId: string) => {
    setSelectedProjectId(projectId);
    onSelectTask(projectId);
    setActiveView("workspace");
    setActiveNavKey("activity");
    setIsMenuOpen(false);
  };

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
    <nav aria-label="Section navigation" className="flex flex-col gap-1 p-3">
      {navItems.map((item) => {
        const isActive = activeNavKey === item.key;
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => handleNavSelect(item.key)}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors text-left focus-visible:outline-2 focus-visible:outline-primary cursor-pointer ${
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

      {/* Slide-over navigation drawer (Matches reference image!) */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={`fixed inset-0 z-50 flex transition-opacity duration-200 ${
          isMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Backdrop */}
        <div
          className={`fixed inset-0 bg-overlay/80 backdrop-blur-sm transition-opacity duration-200 ${
            isMenuOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => {
            setIsMenuOpen(false);
            menuButtonRef.current?.focus();
          }}
        />

        {/* Drawer content */}
        <div
          ref={drawerRef}
          className={`relative flex flex-col w-64 max-w-xs bg-surface border-r border-line shadow-2xl z-10 transform transition-transform duration-200 ease-in-out ${
            isMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex h-16 items-center justify-between px-4 border-b border-line">
            <div className="flex items-center gap-2">
              <Code2 className="w-5 h-5 text-primary" aria-hidden="true" />
              <span className="font-bold text-base text-ink tracking-tight">CodeBridge</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(false);
                menuButtonRef.current?.focus();
              }}
              aria-label="Close navigation menu"
              className="p-1.5 rounded-md text-muted hover:text-ink hover:bg-raised transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-2">
            {sidebarNavigation}
          </div>
        </div>
      </div>

      {/* Main Application Layout (Full width, not permanently pushed by sidebar) */}
      <div className="flex flex-col min-h-screen w-full">
        {/* Semantic Header / Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 sm:gap-4 border-b border-line bg-surface/95 px-3.5 sm:px-6 backdrop-blur shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            {/* Hamburger menu button (3-line menu) */}
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setIsMenuOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={isMenuOpen}
              className="p-2 rounded-md border border-line bg-surface text-muted hover:text-ink hover:bg-raised transition-colors shrink-0 cursor-pointer"
            >
              <MenuIcon className="w-5 h-5" aria-hidden="true" />
            </button>
            <div className="flex items-center gap-2 shrink-0">
              <Code2 className="w-6 h-6 text-primary" aria-hidden="true" />
              <span className="font-bold text-lg tracking-tight text-ink">CodeBridge</span>
            </div>
            <span className="hidden sm:inline-block text-line mx-1 shrink-0">|</span>
            <h1 className="hidden sm:inline-block text-base sm:text-lg font-semibold truncate text-ink">
              Freelancer Portal
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
