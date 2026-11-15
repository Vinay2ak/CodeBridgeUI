import React, { useMemo } from "react";
import { Edit3, Lock } from "lucide-react";
import { highlightCode, getLanguageForFile } from "./highlight";
import { Button } from "../../components/ui/Button";

interface CodeViewProps {
  content: string;
  path: string;
  isWorkspaceRunning: boolean;
  onEnterEdit: () => void;
  editButtonRef?: React.RefObject<HTMLButtonElement>;
}

export const CodeView: React.FC<CodeViewProps> = ({
  content,
  path,
  isWorkspaceRunning,
  onEnterEdit,
  editButtonRef,
}) => {
  const language = useMemo(() => getLanguageForFile(path), [path]);
  const highlighted = useMemo(() => highlightCode(content, language), [content, language]);

  const lines = useMemo(() => highlighted.split("\n"), [highlighted]);
  const lineCount = lines.length;

  return (
    <div className="flex-1 flex flex-col h-full bg-canvas overflow-hidden">
      {/* Viewer Action Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-line bg-surface shrink-0 text-xs">
        <span className="font-mono text-muted truncate">
          Language: <span className="text-primary font-semibold">{language}</span>
        </span>
        <div className="flex items-center gap-2">
          {!isWorkspaceRunning ? (
            <span className="flex items-center gap-1.5 text-muted bg-raised px-2.5 py-1 rounded border border-line">
              <Lock className="h-3 w-3" aria-hidden="true" />
              <span>Start the workspace to edit</span>
            </span>
          ) : (
            <Button
              ref={editButtonRef}
              variant="primary"
              size="sm"
              onClick={onEnterEdit}
            >
              <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Edit file</span>
            </Button>
          )}
        </div>
      </div>

      {/* Code Container with Line Numbers */}
      <div className="flex-1 flex overflow-auto">
        <div
          aria-hidden="true"
          className="w-12 py-3 bg-surface border-r border-line text-muted font-mono text-xs text-right pr-2 select-none shrink-0 leading-6"
        >
          {Array.from({ length: lineCount }).map((_, i) => (
            <div key={i + 1}>{i + 1}</div>
          ))}
        </div>

        <pre className="flex-1 p-3 font-mono text-xs leading-6 overflow-auto whitespace-pre">
          <code
            className={`hljs language-${language}`}
            dangerouslySetInnerHTML={{ __html: highlighted }}
          />
        </pre>
      </div>
    </div>
  );
};

