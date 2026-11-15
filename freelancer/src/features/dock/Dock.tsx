import React, { useState } from "react";
import { Terminal as TerminalIcon, CheckSquare, ChevronUp, ChevronDown } from "lucide-react";
import { Tabs, TabItem } from "../../components/ui/Tabs";
import { Terminal } from "./Terminal";
import { TestsPanel } from "./TestsPanel";
import { FileItem } from "../../services/workspace/types";
import { Run } from "../../services/submission/types";
import { ErrorBoundary } from "../../app/ErrorBoundary";

interface DockProps {
  taskId: string;
  files: FileItem[];
  fileContents: Record<string, string>;
  initialSnapshot: Record<string, string>;
  commit: string;
  latestHistoryLine: string;
  isWorkspaceRunning: boolean;
  hasUnsavedChanges: boolean;
  isStale: boolean;
  latestRun: Run | null;
  isRunningTests: boolean;
  onRunTests: () => void;
  onSaveAll: () => Promise<void>;
  onOpenFile: (path: string) => void;
  terminalInputRef?: React.RefObject<HTMLInputElement>;
  activeDockTab?: "terminal" | "tests";
  onTabChange?: (tab: "terminal" | "tests") => void;
}

export const Dock: React.FC<DockProps> = ({
  taskId,
  files,
  fileContents,
  initialSnapshot,
  commit,
  latestHistoryLine,
  isWorkspaceRunning,
  hasUnsavedChanges,
  isStale,
  latestRun,
  isRunningTests,
  onRunTests,
  onSaveAll,
  onOpenFile,
  terminalInputRef,
  activeDockTab: controlledTab,
  onTabChange,
}) => {
  const [internalTab, setInternalTab] = useState<"terminal" | "tests">("terminal");
  const [collapsed, setCollapsed] = useState(false);

  const activeTab = controlledTab || internalTab;
  const setTab = (tab: "terminal" | "tests") => {
    setInternalTab(tab);
    onTabChange?.(tab);
  };

  const tabs: TabItem[] = [
    {
      id: "terminal",
      label: "Terminal",
      icon: <TerminalIcon className="h-3.5 w-3.5" aria-hidden="true" />,
    },
    {
      id: "tests",
      label: "Tests",
      icon: <CheckSquare className="h-3.5 w-3.5" aria-hidden="true" />,
    },
  ];

  return (
    <div
      className={`border-t border-line bg-surface flex flex-col transition-all duration-200 ${
        collapsed ? "h-10" : "h-72 xl:h-80"
      }`}
    >
      {/* Dock Header Bar */}
      <div className="h-10 px-3 border-b border-line flex items-center justify-between shrink-0 bg-surface">
        <div className="flex items-center gap-2">
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            onChange={(id) => {
              setTab(id as "terminal" | "tests");
              if (collapsed) setCollapsed(false);
            }}
            ariaLabel="Dock navigation tabs"
          />
        </div>

        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expand dock panel" : "Collapse dock panel"}
          title={collapsed ? "Expand dock" : "Collapse dock"}
          className="rounded p-1 text-muted hover:text-ink hover:bg-raised transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {collapsed ? (
            <ChevronUp className="h-4 w-4" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Dock Content Body */}
      {!collapsed && (
        <div className="flex-1 min-h-0 overflow-hidden">
          <ErrorBoundary fallbackTitle="Dock Service Error">
            {activeTab === "terminal" ? (
              <Terminal
                files={files}
                fileContents={fileContents}
                initialSnapshot={initialSnapshot}
                commit={commit}
                latestHistoryLine={latestHistoryLine}
                isWorkspaceRunning={isWorkspaceRunning}
                onRunTests={onRunTests}
                terminalInputRef={terminalInputRef}
              />
            ) : (
              <TestsPanel
                taskId={taskId}
                isWorkspaceRunning={isWorkspaceRunning}
                hasUnsavedChanges={hasUnsavedChanges}
                isStale={isStale}
                latestRun={latestRun}
                isRunningTests={isRunningTests}
                onRunTests={onRunTests}
                onSaveAll={onSaveAll}
                onOpenFile={onOpenFile}
              />
            )}
          </ErrorBoundary>
        </div>
      )}
    </div>
  );
};
