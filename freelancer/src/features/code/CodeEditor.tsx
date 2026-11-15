import React, { useEffect, useRef, useState } from "react";
import { Save, Check, CornerDownLeft } from "lucide-react";
import { Button } from "../../components/ui/Button";

interface CodeEditorProps {
  content: string;
  path: string;
  onChange: (newContent: string) => void;
  onSave: () => Promise<void>;
  onExit: () => void;
  isSaving: boolean;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  content,
  path,
  onChange,
  onSave,
  onExit,
  isSaving,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const [saveStatusMessage, setSaveStatusMessage] = useState<string | null>(null);

  const lines = content.split("\n");
  const lineCount = Math.max(1, lines.length);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (gutterRef.current) {
      gutterRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onExit();
    } else if (e.key === "Tab") {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;

      const updated = content.substring(0, start) + "  " + content.substring(end);
      onChange(updated);

      requestAnimationFrame(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      });
    } else if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      handleTriggerSave();
    }
  };

  const handleTriggerSave = async () => {
    await onSave();
    setSaveStatusMessage("Saved");
    setTimeout(() => setSaveStatusMessage(null), 2500);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-canvas overflow-hidden">
      {/* Live announcement region for save */}
      <div className="sr-only" aria-live="polite">
        {saveStatusMessage || ""}
      </div>

      {/* Editor Action Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-line bg-surface shrink-0 text-xs">
        <span className="font-mono text-muted truncate">Editing: {path}</span>
        <div className="flex items-center gap-2">
          {saveStatusMessage && (
            <span className="flex items-center gap-1 text-success font-medium">
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Saved</span>
            </span>
          )}
          <Button
            variant="primary"
            size="sm"
            onClick={handleTriggerSave}
            disabled={isSaving}
          >
            <Save className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Save (Ctrl+S)</span>
          </Button>
          <Button variant="secondary" size="sm" onClick={onExit}>
            <CornerDownLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Done (Esc)</span>
          </Button>
        </div>
      </div>

      {/* Textarea with Line Numbers */}
      <div className="flex-1 flex overflow-hidden relative">
        <div
          ref={gutterRef}
          aria-hidden="true"
          className="w-12 py-3 bg-surface border-r border-line text-muted font-mono text-xs text-right pr-2 select-none overflow-hidden shrink-0 leading-6"
        >
          {Array.from({ length: lineCount }).map((_, i) => (
            <div key={i + 1}>{i + 1}</div>
          ))}
        </div>

        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          aria-label={`Code editor for ${path}`}
          className="flex-1 h-full p-3 bg-canvas text-ink font-mono text-xs leading-6 resize-none outline-none overflow-auto whitespace-pre font-normal"
        />
      </div>
    </div>
  );
};

