import React, { useState, useMemo, useRef } from "react";
import {
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  File,
  ChevronRight,
  ChevronDown,
  GitCommit,
  CheckCircle2,
} from "lucide-react";
import { FileItem } from "../../services/workspace/types";
import { FileChangeInfo } from "./useFiles";
import { Dialog } from "../../components/ui/Dialog";
import { Button } from "../../components/ui/Button";

interface FileExplorerProps {
  files: FileItem[];
  activePath: string | null;
  changedFiles: FileChangeInfo[];
  onSelectFile: (path: string) => void;
}

interface TreeNode {
  name: string;
  path: string;
  isDir: boolean;
  children: TreeNode[];
}

function buildTree(files: FileItem[]): TreeNode[] {
  const root: TreeNode = { name: "", path: "", isDir: true, children: [] };

  for (const item of files) {
    const parts = item.path.split("/");
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;
      const currentPath = parts.slice(0, i + 1).join("/");

      let existing = current.children.find((c) => c.name === part);
      if (!existing) {
        existing = {
          name: part,
          path: currentPath,
          isDir: !isLast || item.type === "dir",
          children: [],
        };
        current.children.push(existing);
      }
      current = existing;
    }
  }

  // Sort folders first, then alphabetically
  function sortNodes(nodes: TreeNode[]) {
    nodes.sort((a, b) => {
      if (a.isDir && !b.isDir) return -1;
      if (!a.isDir && b.isDir) return 1;
      return a.name.localeCompare(b.name);
    });
    for (const n of nodes) {
      if (n.children.length > 0) {
        sortNodes(n.children);
      }
    }
  }

  sortNodes(root.children);
  return root.children;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  files,
  activePath,
  changedFiles,
  onSelectFile,
}) => {
  const [collapsedDirs, setCollapsedDirs] = useState<Set<string>>(new Set());
  const [changesDialogOpen, setChangesDialogOpen] = useState(false);
  const treeContainerRef = useRef<HTMLDivElement>(null);

  const tree = useMemo(() => buildTree(files), [files]);
  const changedPathsSet = useMemo(
    () => new Set(changedFiles.map((c) => c.path)),
    [changedFiles]
  );

  const toggleDir = (dirPath: string) => {
    setCollapsedDirs((prev) => {
      const next = new Set(prev);
      if (next.has(dirPath)) {
        next.delete(dirPath);
      } else {
        next.add(dirPath);
      }
      return next;
    });
  };

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith(".py")) {
      return <FileCode className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />;
    }
    if (fileName.endsWith(".md") || fileName.endsWith(".txt")) {
      return <FileText className="h-4 w-4 text-muted shrink-0" aria-hidden="true" />;
    }
    return <File className="h-4 w-4 text-muted shrink-0" aria-hidden="true" />;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!treeContainerRef.current) return;
    const items = Array.from(
      treeContainerRef.current.querySelectorAll<HTMLElement>('[role="treeitem"]')
    );
    const currentIndex = items.indexOf(document.activeElement as HTMLElement);

    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = currentIndex < items.length - 1 ? items[currentIndex + 1] : items[0];
      next?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prev = currentIndex > 0 ? items[currentIndex - 1] : items[items.length - 1];
      prev?.focus();
    }
  };

  const renderNode = (node: TreeNode, depth = 0) => {
    const isDir = node.isDir;
    const isCollapsed = collapsedDirs.has(node.path);
    const isActive = !isDir && activePath === node.path;
    const isChanged = !isDir && changedPathsSet.has(node.path);

    if (isDir) {
      return (
        <div key={node.path} role="none">
          <div
            role="treeitem"
            tabIndex={0}
            aria-expanded={!isCollapsed}
            onClick={() => toggleDir(node.path)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggleDir(node.path);
              } else if (e.key === "ArrowRight" && isCollapsed) {
                e.preventDefault();
                toggleDir(node.path);
              } else if (e.key === "ArrowLeft" && !isCollapsed) {
                e.preventDefault();
                toggleDir(node.path);
              }
            }}
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
            className="flex items-center gap-1.5 py-1 px-2 rounded-md text-xs font-medium text-muted hover:text-ink hover:bg-surface cursor-pointer select-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {isCollapsed ? (
              <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            )}
            {isCollapsed ? (
              <Folder className="h-4 w-4 text-muted shrink-0" aria-hidden="true" />
            ) : (
              <FolderOpen className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
            )}
            <span className="truncate">{node.name}</span>
          </div>

          {!isCollapsed && (
            <div role="group">
              {node.children.map((child) => renderNode(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div
        key={node.path}
        role="treeitem"
        tabIndex={isActive ? 0 : -1}
        aria-selected={isActive}
        onClick={() => onSelectFile(node.path)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelectFile(node.path);
          }
        }}
        style={{ paddingLeft: `${depth * 12 + 20}px` }}
        className={`flex items-center justify-between py-1 px-2 rounded-md text-xs font-mono cursor-pointer select-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
          isActive
            ? "bg-selected text-primary font-medium"
            : "text-ink hover:bg-surface"
        }`}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          {getFileIcon(node.name)}
          <span className="truncate">{node.name}</span>
        </div>

        {isChanged && (
          <span
            title="Modified since snapshot"
            aria-label="Modified since snapshot"
            className="h-2 w-2 rounded-full bg-primary shrink-0"
          />
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-surface border-r border-line select-none">
      {/* Explorer Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-line shrink-0">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted">
          Explorer
        </span>
        <button
          type="button"
          onClick={() => setChangesDialogOpen(true)}
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
            changedFiles.length > 0
              ? "bg-info-bg text-primary border border-info-border hover:bg-surface"
              : "text-muted hover:text-ink"
          }`}
        >
          <GitCommit className="h-3 w-3" aria-hidden="true" />
          <span>Changes ({changedFiles.length})</span>
        </button>
      </div>

      {/* File Tree */}
      <div
        ref={treeContainerRef}
        role="tree"
        aria-label="Workspace Files"
        onKeyDown={handleKeyDown}
        className="flex-1 overflow-y-auto p-1.5 space-y-0.5"
      >
        {tree.map((node) => renderNode(node, 0))}
      </div>

      {/* Changes Modal Dialog */}
      <Dialog
        open={changesDialogOpen}
        onClose={() => setChangesDialogOpen(false)}
        title={`Workspace Modifications (${changedFiles.length})`}
        description="List of files edited and saved against the read-only git snapshot."
      >
        {changedFiles.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted">
            <CheckCircle2 className="h-8 w-8 text-success mx-auto mb-2" aria-hidden="true" />
            <p>Working tree clean. No files have been modified.</p>
          </div>
        ) : (
          <div className="space-y-2 mt-4 max-h-64 overflow-y-auto">
            {changedFiles.map((file) => {
              const deltaPrefix = file.charDelta >= 0 ? `+${file.charDelta}` : `${file.charDelta}`;
              return (
                <div
                  key={file.path}
                  onClick={() => {
                    onSelectFile(file.path);
                    setChangesDialogOpen(false);
                  }}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-line bg-surface hover:bg-raised cursor-pointer transition-colors text-xs font-mono"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileCode className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
                    <span className="text-ink truncate">{file.path}</span>
                  </div>
                  <span
                    className={`shrink-0 font-semibold ${
                      file.charDelta >= 0 ? "text-success" : "text-danger"
                    }`}
                  >
                    {deltaPrefix} chars
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex justify-end mt-6">
          <Button variant="secondary" size="sm" onClick={() => setChangesDialogOpen(false)}>
            Close
          </Button>
        </div>
      </Dialog>
    </div>
  );
};

