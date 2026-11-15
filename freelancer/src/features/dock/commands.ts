export interface TerminalContext {
  files: Array<{ path: string; content: string }>;
  initialSnapshot: Record<string, string>;
  commit: string;
  latestHistoryLine: string;
  onRunTests: () => void;
  onClear: () => void;
}

export interface CommandOutput {
  output: string;
  clear?: boolean;
}

export function executeTerminalCommand(
  rawInput: string,
  ctx: TerminalContext
): CommandOutput {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return { output: "" };
  }

  const parts = trimmed.split(/\s+/);
  const cmd = parts[0];
  const args = parts.slice(1);

  if (cmd === "help") {
    return {
      output: [
        "CodeBridge Terminal v1.0",
        "Available commands:",
        "  help              Show this reference manual",
        "  ls [path]         List directory contents",
        "  cat <path>        Print content of a file",
        "  git status        Show files modified against snapshot",
        "  git log -1        Show current snapshot commit and latest task event",
        "  run-tests         Trigger automated test verification suite",
        "  clear             Clear terminal scrollback buffer",
      ].join("\n"),
    };
  }

  if (cmd === "clear") {
    ctx.onClear();
    return { output: "", clear: true };
  }

  if (cmd === "ls") {
    const targetDir = args[0] ? args[0].replace(/\/$/, "") : "";
    const items = new Set<string>();

    for (const f of ctx.files) {
      if (!targetDir) {
        const topLevel = f.path.split("/")[0];
        items.add(topLevel);
      } else {
        if (f.path.startsWith(targetDir + "/")) {
          const sub = f.path.substring(targetDir.length + 1);
          const topInSub = sub.split("/")[0];
          items.add(topInSub);
        }
      }
    }

    if (items.size === 0 && targetDir) {
      return { output: `ls: cannot access '${targetDir}': No such file or directory` };
    }

    return { output: Array.from(items).sort().join("  ") };
  }

  if (cmd === "cat") {
    if (!args[0]) {
      return { output: "cat: missing file operand" };
    }
    const targetPath = args[0];
    const file = ctx.files.find((f) => f.path === targetPath);
    if (!file) {
      return { output: `cat: ${targetPath}: No such file or directory` };
    }
    return { output: file.content };
  }

  if (cmd === "git") {
    const subCmd = args[0];
    if (subCmd === "status") {
      const modified: string[] = [];
      for (const f of ctx.files) {
        const original = ctx.initialSnapshot[f.path];
        if (original !== undefined && original !== f.content) {
          modified.push(f.path);
        }
      }

      if (modified.length === 0) {
        return {
          output: "On branch main\nnothing to commit, working tree clean",
        };
      }

      return {
        output: [
          "On branch main",
          "Changes not staged for commit:",
          ...modified.map((p) => `  modified: ${p}`),
        ].join("\n"),
      };
    }

    if (subCmd === "log" && args[1] === "-1") {
      return {
        output: [
          `commit ${ctx.commit}`,
          `Latest activity: ${ctx.latestHistoryLine || "No recent history"}`,
        ].join("\n"),
      };
    }

    return { output: `git: '${args.join(" ")}' is not a supported git command.` };
  }

  if (cmd === "run-tests") {
    ctx.onRunTests();
    return { output: "Starting test verification run..." };
  }

  return { output: `command not found: ${cmd}. Type help.` };
}

