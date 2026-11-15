import { describe, it, expect, vi } from "vitest";
import { executeTerminalCommand, TerminalContext } from "./commands";

describe("Terminal Commands Parser & Executor", () => {
  const mockRunTests = vi.fn();
  const mockClear = vi.fn();

  const baseCtx: TerminalContext = {
    files: [
      { path: "README.md", content: "# Readme Content" },
      { path: "app/main.py", content: "print('main')" },
      { path: "app/webhooks.py", content: "print('webhooks')" },
    ],
    initialSnapshot: {
      "README.md": "# Readme Content",
      "app/main.py": "print('main')",
      "app/webhooks.py": "print('webhooks-original')",
    },
    commit: "a1b2c3d",
    latestHistoryLine: "Isolated Docker sandbox provisioned",
    onRunTests: mockRunTests,
    onClear: mockClear,
  };

  it("1. prints help reference manual", () => {
    const res = executeTerminalCommand("help", baseCtx);
    expect(res.output).toContain("CodeBridge Terminal v1.0");
    expect(res.output).toContain("run-tests");
    expect(res.output).toContain("git status");
  });

  it("2. lists files with ls and ls [path]", () => {
    const rootLs = executeTerminalCommand("ls", baseCtx);
    expect(rootLs.output).toContain("README.md");
    expect(rootLs.output).toContain("app");

    const appLs = executeTerminalCommand("ls app", baseCtx);
    expect(appLs.output).toContain("main.py");
    expect(appLs.output).toContain("webhooks.py");

    const nonExistent = executeTerminalCommand("ls non_existent", baseCtx);
    expect(nonExistent.output).toContain("cannot access 'non_existent'");
  });

  it("3. outputs file contents with cat", () => {
    const catReadme = executeTerminalCommand("cat README.md", baseCtx);
    expect(catReadme.output).toBe("# Readme Content");

    const missingFile = executeTerminalCommand("cat missing.txt", baseCtx);
    expect(missingFile.output).toContain("No such file or directory");

    const missingArg = executeTerminalCommand("cat", baseCtx);
    expect(missingArg.output).toBe("cat: missing file operand");
  });

  it("4. inspects modified files with git status", () => {
    // app/webhooks.py is different from initialSnapshot
    const statusRes = executeTerminalCommand("git status", baseCtx);
    expect(statusRes.output).toContain("Changes not staged for commit:");
    expect(statusRes.output).toContain("modified: app/webhooks.py");

    // Clean snapshot
    const cleanCtx: TerminalContext = {
      ...baseCtx,
      initialSnapshot: {
        "README.md": "# Readme Content",
        "app/main.py": "print('main')",
        "app/webhooks.py": "print('webhooks')",
      },
    };
    const cleanStatus = executeTerminalCommand("git status", cleanCtx);
    expect(cleanStatus.output).toContain("nothing to commit, working tree clean");
  });

  it("5. prints snapshot commit and latest task activity with git log -1", () => {
    const logRes = executeTerminalCommand("git log -1", baseCtx);
    expect(logRes.output).toContain("commit a1b2c3d");
    expect(logRes.output).toContain("Latest activity: Isolated Docker sandbox provisioned");
  });

  it("6. triggers test run callback with run-tests", () => {
    const runRes = executeTerminalCommand("run-tests", baseCtx);
    expect(runRes.output).toContain("Starting test verification run...");
    expect(mockRunTests).toHaveBeenCalledTimes(1);
  });

  it("7. clears terminal with clear and handles unknown commands", () => {
    const clearRes = executeTerminalCommand("clear", baseCtx);
    expect(clearRes.clear).toBe(true);
    expect(mockClear).toHaveBeenCalledTimes(1);

    const unknownRes = executeTerminalCommand("foo-bar", baseCtx);
    expect(unknownRes.output).toBe("command not found: foo-bar. Type help.");
  });
});

