import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { workspaceApi } from "../../services/workspace/api";
import { FileItem } from "../../services/workspace/types";

export interface FileChangeInfo {
  path: string;
  charDelta: number;
}

export function useFiles(taskId: string) {
  const queryClient = useQueryClient();

  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [activePath, setActivePath] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savedContents, setSavedContents] = useState<Record<string, string>>({});
  const [initialSnapshotContents, setInitialSnapshotContents] = useState<Record<string, string>>({});
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);

  // Load file tree
  const {
    data: treeData,
    isLoading: treeLoading,
    error: treeError,
    refetch: refetchTree,
  } = useQuery({
    queryKey: ["workspace", taskId, "files"],
    queryFn: () => workspaceApi.getFiles(taskId),
    enabled: Boolean(taskId),
  });

  const files: FileItem[] = treeData?.items || [];
  const commit = treeData?.commit || "HEAD";

  // Pre-load default initial active file if none opened yet
  useEffect(() => {
    if (files.length > 0 && openTabs.length === 0 && !activePath) {
      const defaultFile = files.find((f) => f.path === "app/webhooks.py") || files[0];
      if (defaultFile && defaultFile.type === "file") {
        openFile(defaultFile.path);
      }
    }
  }, [files, openTabs.length, activePath]);

  // Load content for active file if not loaded
  const activeContentQuery = useQuery({
    queryKey: ["workspace", taskId, "file", activePath],
    queryFn: async () => {
      if (!activePath) return null;
      return workspaceApi.getFileContent(taskId, activePath);
    },
    enabled: Boolean(taskId && activePath),
  });

  useEffect(() => {
    if (activePath && activeContentQuery.data) {
      const content = activeContentQuery.data.content;
      setSavedContents((prev) => {
        if (prev[activePath] === undefined) {
          return { ...prev, [activePath]: content };
        }
        return prev;
      });
      setInitialSnapshotContents((prev) => {
        if (prev[activePath] === undefined) {
          return { ...prev, [activePath]: content };
        }
        return prev;
      });
      setDrafts((prev) => {
        if (prev[activePath] === undefined) {
          return { ...prev, [activePath]: content };
        }
        return prev;
      });
    }
  }, [activePath, activeContentQuery.data]);

  const openFile = useCallback(
    async (path: string) => {
      setOpenTabs((prev) => {
        if (prev.includes(path)) {
          return prev;
        }
        // Max 6 tabs
        if (prev.length >= 6) {
          // Keep active or remove first
          const next = [...prev.slice(1), path];
          return next;
        }
        return [...prev, path];
      });

      setActivePath(path);

      if (savedContents[path] === undefined) {
        try {
          const res = await workspaceApi.getFileContent(taskId, path);
          setSavedContents((prev) => ({ ...prev, [path]: res.content }));
          setInitialSnapshotContents((prev) => ({
            ...prev,
            [path]: prev[path] ?? res.content,
          }));
          setDrafts((prev) => ({
            ...prev,
            [path]: prev[path] ?? res.content,
          }));
        } catch {
          // Query or caller will show error
        }
      }
    },
    [taskId, savedContents]
  );

  const closeTab = useCallback(
    (path: string) => {
      setOpenTabs((prev) => {
        const next = prev.filter((p) => p !== path);
        if (activePath === path) {
          const closedIndex = prev.indexOf(path);
          if (next.length > 0) {
            const newActive = next[Math.min(closedIndex, next.length - 1)];
            setActivePath(newActive);
          } else {
            setActivePath(null);
          }
        }
        return next;
      });
    },
    [activePath]
  );

  const updateDraft = useCallback((path: string, content: string) => {
    setDrafts((prev) => ({ ...prev, [path]: content }));
  }, []);

  const isDirty = useCallback(
    (path: string) => {
      const draft = drafts[path];
      const saved = savedContents[path];
      if (draft === undefined || saved === undefined) return false;
      return draft !== saved;
    },
    [drafts, savedContents]
  );

  const hasUnsavedChanges = openTabs.some((p) => isDirty(p));

  const saveMutation = useMutation({
    mutationFn: async ({ path, content }: { path: string; content: string }) => {
      return workspaceApi.saveFileContent(taskId, path, content);
    },
    onSuccess: (_, variables) => {
      setSavedContents((prev) => ({ ...prev, [variables.path]: variables.content }));
      setLastSavedAt(Date.now());
      queryClient.invalidateQueries({ queryKey: ["workspace", taskId, "files"] });
    },
  });

  const saveFile = useCallback(
    async (path: string) => {
      const currentDraft = drafts[path] ?? savedContents[path] ?? "";
      await saveMutation.mutateAsync({ path, content: currentDraft });
    },
    [drafts, savedContents, saveMutation]
  );

  const saveAll = useCallback(async () => {
    for (const tabPath of openTabs) {
      if (isDirty(tabPath)) {
        await saveFile(tabPath);
      }
    }
  }, [openTabs, isDirty, saveFile]);

  // Compute files changed since snapshot
  const changedFiles: FileChangeInfo[] = Object.keys(savedContents)
    .filter((path) => {
      const initial = initialSnapshotContents[path];
      const current = savedContents[path];
      return initial !== undefined && current !== undefined && initial !== current;
    })
    .map((path) => {
      const initial = initialSnapshotContents[path] || "";
      const current = savedContents[path] || "";
      return {
        path,
        charDelta: current.length - initial.length,
      };
    });

  return {
    files,
    commit,
    treeLoading,
    treeError,
    refetchTree,
    openTabs,
    activePath,
    activeContent: activePath ? drafts[activePath] ?? savedContents[activePath] ?? "" : "",
    contentLoading: activeContentQuery.isLoading,
    contentError: activeContentQuery.error,
    openFile,
    closeTab,
    updateDraft,
    saveFile,
    saveAll,
    isDirty,
    hasUnsavedChanges,
    changedFiles,
    initialSnapshot: initialSnapshotContents,
    lastSavedAt,
    isSaving: saveMutation.isPending,
  };
}

