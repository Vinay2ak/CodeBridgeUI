import React, { useEffect, useRef, useState } from "react";
import { Terminal as TerminalIcon } from "lucide-react";
import { executeTerminalCommand, TerminalContext } from "./commands";
import { FileItem } from "../../services/workspace/types";

interface TerminalProps {
  files: FileItem[];
  fileContents: Record<string, string>;
  initialSnapshot: Record<string, string>;
  commit: string;
  latestHistoryLine: string;
  isWorkspaceRunning: boolean;
  onRunTests: () => void;
  terminalInputRef?: React.RefObject<HTMLInputElement>;
}

interface LogLine {
  id: string;
  type: "stdout" | "stderr" | "input" | "system";
  text: string;
}

export const Terminal: React.FC<TerminalProps> = ({
  files,
  fileContents,
  initialSnapshot,
  commit,
  latestHistoryLine,
  isWorkspaceRunning,
  onRunTests,
  terminalInputRef: externalInputRef,
}) => {
  const [logs, setLogs] = useState<LogLine[]>([
    {
      id: "init_1",
      type: "system",
      text: "CodeBridge Workspace Terminal (isolated Docker environment)",
    },
  ]);
  const [inputVal, setInputVal] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  const localInputRef = useRef<HTMLInputElement>(null);
  const inputRef = externalInputRef || localInputRef;
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevRunningRef = useRef<boolean>(isWorkspaceRunning);

  // Auto-scroll on new log entries
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  // Workspace boot logs
  useEffect(() => {
    if (isWorkspaceRunning && !prevRunningRef.current) {
      setLogs((prev) => [
        ...prev,
        { id: `boot_${Date.now()}_1`, type: "system", text: "Pulling python:3.12-slim" },
        {
          id: `boot_${Date.now()}_2`,
          type: "system",
          text: `Mounting read-only repository snapshot @ ${commit}`,
        },
        { id: `boot_${Date.now()}_3`, type: "system", text: "Workspace ready" },
      ]);
    }
    prevRunningRef.current = isWorkspaceRunning;
  }, [isWorkspaceRunning, commit]);

  const handleClear = () => {
    setLogs([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() || !isWorkspaceRunning) return;

    const commandStr = inputVal;
    setInputVal("");
    setHistory((prev) => [...prev, commandStr]);
    setHistoryIndex(-1);

    const inputLine: LogLine = {
      id: `in_${Date.now()}`,
      type: "input",
      text: commandStr,
    };

    const ctxFiles = files.map((f) => ({
      path: f.path,
      content: fileContents[f.path] || "",
    }));

    const ctx: TerminalContext = {
      files: ctxFiles,
      initialSnapshot,
      commit,
      latestHistoryLine,
      onRunTests,
      onClear: handleClear,
    };

    const result = executeTerminalCommand(commandStr, ctx);

    if (result.clear) {
      return;
    }

    const outputLines: LogLine[] = result.output
      ? [
          inputLine,
          {
            id: `out_${Date.now()}`,
            type: "stdout",
            text: result.output,
          },
        ]
      : [inputLine];

    setLogs((prev) => [...prev, ...outputLines]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.length === 0) return;
      const nextIdx =
        historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIdx);
      setInputVal(history[nextIdx]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex === -1) return;
      const nextIdx = historyIndex + 1;
      if (nextIdx >= history.length) {
        setHistoryIndex(-1);
        setInputVal("");
      } else {
        setHistoryIndex(nextIdx);
        setInputVal(history[nextIdx]);
      }
    }
  };

  return (
    <div className="h-full flex flex-col bg-canvas font-mono text-xs overflow-hidden">
      {/* Scrollback Log */}
      <div
        ref={scrollRef}
        role="log"
        aria-live="off"
        className="flex-1 p-3 overflow-y-auto space-y-1"
      >
        {logs.map((log) => {
          if (log.type === "input") {
            return (
              <div key={log.id} className="flex items-start gap-2 text-ink">
                <span className="text-primary font-semibold select-none">
                  dev@workspace:~$
                </span>
                <span>{log.text}</span>
              </div>
            );
          }
          if (log.type === "system") {
            return (
              <div key={log.id} className="text-muted italic">
                {log.text}
              </div>
            );
          }
          return (
            <div key={log.id} className="text-ink whitespace-pre-wrap leading-relaxed">
              {log.text}
            </div>
          );
        })}
      </div>

      {/* Input Prompt Form */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 px-3 py-2 border-t border-line bg-surface shrink-0"
      >
        <span className="text-primary font-semibold select-none flex items-center gap-1.5 shrink-0">
          <TerminalIcon className="h-3.5 w-3.5" aria-hidden="true" />
          <span>dev@workspace:~$</span>
        </span>
        <input
          ref={inputRef}
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={!isWorkspaceRunning}
          placeholder={
            isWorkspaceRunning
              ? "Type command (help, ls, cat, git status, run-tests)..."
              : "Workspace is not running. Start it first."
          }
          aria-label="Terminal input prompt"
          className="flex-1 bg-transparent text-ink outline-none placeholder:text-muted disabled:cursor-not-allowed"
        />
      </form>
    </div>
  );
};

