import React, { useRef } from "react";
import { X, FileCode } from "lucide-react";

interface CodeTabsProps {
  openTabs: string[];
  activePath: string | null;
  isDirty: (path: string) => boolean;
  onSelectTab: (path: string) => void;
  onCloseTab: (path: string) => void;
}

export const CodeTabs: React.FC<CodeTabsProps> = ({
  openTabs,
  activePath,
  isDirty,
  onSelectTab,
  onCloseTab,
}) => {
  const tabListRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let targetIndex = -1;
    if (e.key === "ArrowRight") {
      targetIndex = (index + 1) % openTabs.length;
    } else if (e.key === "ArrowLeft") {
      targetIndex = (index - 1 + openTabs.length) % openTabs.length;
    }

    if (targetIndex >= 0) {
      e.preventDefault();
      const buttons = tabListRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
      if (buttons && buttons[targetIndex]) {
        buttons[targetIndex].focus();
        onSelectTab(openTabs[targetIndex]);
      }
    }
  };

  if (openTabs.length === 0) {
    return <div className="h-10 border-b border-line bg-surface" />;
  }

  return (
    <div
      ref={tabListRef}
      role="tablist"
      aria-label="Open code files"
      className="flex items-center border-b border-line bg-surface overflow-x-auto min-h-[40px] px-1"
    >
      {openTabs.map((path, idx) => {
        const isActive = path === activePath;
        const dirty = isDirty(path);
        const fileName = path.split("/").pop() || path;

        return (
          <div
            key={path}
            className={`group inline-flex items-center gap-2 h-9 px-3 border-r border-line text-xs font-mono select-none transition-colors ${
              isActive
                ? "bg-canvas text-primary border-t-2 border-t-primary font-medium"
                : "bg-surface text-muted hover:text-ink hover:bg-raised"
            }`}
          >
            <button
              role="tab"
              type="button"
              id={`editor-tab-${path}`}
              aria-controls={`editor-panel-${path}`}
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onSelectTab(path)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              className="inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary truncate max-w-[140px]"
            >
              <FileCode className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{fileName}</span>
              {dirty && (
                <span className="flex items-center">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  <span className="sr-only">unsaved</span>
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCloseTab(path);
              }}
              aria-label={`Close ${fileName}`}
              className="rounded p-0.5 text-muted hover:text-ink hover:bg-raised focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
            >
              <X className="h-3 w-3" aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

