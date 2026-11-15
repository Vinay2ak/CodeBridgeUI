import React, { useState, useRef } from "react";
import { ShieldCheck, RefreshCw, FolderX } from "lucide-react";
import { useFiles } from "./useFiles";
import { FileExplorer } from "./FileExplorer";
import { CodeTabs } from "./CodeTabs";
import { CodeView } from "./CodeView";
import { CodeEditor } from "./CodeEditor";
import { Skeleton } from "../../components/ui/Skeleton";
import { ApiError } from "../../lib/errors";

interface CodePaneProps {
  taskId: string;
  workspaceStatus: string;
}

export const CodePane: React.FC<CodePaneProps> = ({ taskId, workspaceStatus }) => {
  const {
    files,
    commit,
    treeLoading,
    treeError,
    refetchTree,
    openTabs,
    activePath,
    activeContent,
    contentLoading,
    contentError,
    openFile,
    closeTab,
    updateDraft,
    saveFile,
    isDirty,
    changedFiles,
    isSaving,
  } = useFiles(taskId);

  const [isEditing, setIsEditing] = useState(false);
  const editButtonRef = useRef<HTMLButtonElement>(null);

  const isWorkspaceRunning = workspaceStatus === "running";

  if (treeLoading) {
    return (
      <div className="h-full flex bg-surface">
        <div className="w-56 border-r border-line p-3 space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="flex-1 p-4 space-y-3">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-full w-full" />
        </div>
      </div>
    );
  }

  if (treeError) {
    const apiErr = treeError instanceof ApiError ? treeError : null;
    const corrId = apiErr?.correlationId || "err_tree";

    if (taskId === "t2" || taskId === "t3") {
      return (
        <div className="h-full flex items-center justify-center p-8 bg-canvas">
          <div className="max-w-md w-full rounded-xl border border-line bg-surface p-6 text-center shadow-sm">
            <FolderX className="h-10 w-10 text-muted mx-auto mb-3" aria-hidden="true" />
            <h3 className="text-base font-semibold text-ink mb-1">No workspace for this task</h3>
            <p className="text-xs text-muted leading-relaxed">
              This task is currently locked and its codebase snapshot is archived.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="h-full flex items-center justify-center p-8 bg-canvas">
        <div className="max-w-md w-full rounded-xl border border-line bg-surface p-6 text-center shadow-sm">
          <p className="text-sm text-ink mb-1">Failed to load repository files.</p>
          <p className="text-xs text-muted mb-4 font-mono">Reference: {corrId}</p>
          <button
            type="button"
            onClick={() => refetchTree()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line-strong px-3 py-1.5 text-xs font-medium text-ink hover:bg-raised transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Retry</span>
          </button>
        </div>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-8 bg-canvas text-center">
        <p className="text-sm text-muted">No workspace for this task</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-canvas overflow-hidden">
      {/* Top Header Breadcrumb Bar */}
      <div className="h-10 border-b border-line bg-surface px-3 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2 min-w-0 font-mono text-xs">
          <span className="text-muted">workspace</span>
          <span className="text-muted">/</span>
          <span className="text-ink font-semibold truncate">{activePath || "No file opened"}</span>
        </div>

        <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] bg-raised border border-line text-muted font-mono">
          <ShieldCheck className="h-3 w-3 text-primary" aria-hidden="true" />
          <span>Read-only snapshot @ {commit}</span>
        </span>
      </div>

      {/* Main Split: Explorer Sidebar + Editor Area */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left: Explorer */}
        <div className="w-56 shrink-0 h-full overflow-hidden">
          <FileExplorer
            files={files}
            activePath={activePath}
            changedFiles={changedFiles}
            onSelectFile={(path) => {
              openFile(path);
              setIsEditing(false);
            }}
          />
        </div>

        {/* Right: Tabs + Code Area */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          <CodeTabs
            openTabs={openTabs}
            activePath={activePath}
            isDirty={isDirty}
            onSelectTab={(path) => {
              openFile(path);
              setIsEditing(false);
            }}
            onCloseTab={closeTab}
          />

          <div className="flex-1 min-h-0 relative flex flex-col">
            {contentLoading ? (
              <div className="p-4 space-y-3">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            ) : contentError ? (
              <div className="m-auto p-6 text-center text-xs text-muted">
                <p className="text-danger mb-2">Error loading file content.</p>
                <button
                  type="button"
                  onClick={() => openFile(activePath || "")}
                  className="rounded border border-line px-2.5 py-1 text-ink hover:bg-raised"
                >
                  Retry
                </button>
              </div>
            ) : !activePath ? (
              <div className="m-auto text-xs text-muted text-center">
                Select a file from the explorer to view its content
              </div>
            ) : isEditing && isWorkspaceRunning ? (
              <CodeEditor
                content={activeContent}
                path={activePath}
                onChange={(newText) => updateDraft(activePath, newText)}
                onSave={() => saveFile(activePath)}
                onExit={() => {
                  setIsEditing(false);
                  setTimeout(() => editButtonRef.current?.focus(), 50);
                }}
                isSaving={isSaving}
              />
            ) : (
              <CodeView
                content={activeContent}
                path={activePath}
                isWorkspaceRunning={isWorkspaceRunning}
                onEnterEdit={() => setIsEditing(true)}
                editButtonRef={editButtonRef}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

