// TODO: mount RepoHandoffCard on the Workspace page (ControlledWorkspaceView.tsx)
import React, { useState } from "react";
import { GitBranch, Terminal, Copy, Check } from "lucide-react";
import { Button } from "../../components/ui/Button";

export interface RepoHandoffCardProps {
  projectId: string;
  commitHash?: string;
  repoName?: string;
}

export const RepoHandoffCard: React.FC<RepoHandoffCardProps> = ({
  projectId,
  commitHash = "c4b2a8f",
  repoName = "codebridge/repo",
}) => {
  const [copiedClone, setCopiedClone] = useState(false);
  const cloneCommand = `git clone https://git.codebridge.dev/repos/${projectId}.git`;

  const handleCopyClone = () => {
    navigator.clipboard.writeText(cloneCommand);
    setCopiedClone(true);
    setTimeout(() => setCopiedClone(false), 2000);
  };

  return (
    <div className="p-5 rounded-md border border-line bg-surface space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <GitBranch className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
          <div>
            <h3 className="text-sm font-semibold text-ink">
              Repository handoff ({repoName})
            </h3>
            <p className="text-xs text-muted">
              Read-only clone via tokenless bridge.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted">commit: {commitHash}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 p-2.5 rounded-md bg-canvas border border-line font-mono text-xs text-ink overflow-x-auto">
        <Terminal className="h-4 w-4 text-muted shrink-0" aria-hidden="true" />
        <span className="flex-1 select-all min-w-0 truncate">{cloneCommand}</span>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleCopyClone}
          className="shrink-0 h-7 text-xs px-2.5"
          aria-label={copiedClone ? "Copied git clone command" : "Copy git clone command"}
        >
          {copiedClone ? (
            <>
              <Check className="h-3.5 w-3.5 text-success" aria-hidden="true" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Copy</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
