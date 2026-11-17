import { describe, it, expect } from "vitest";
import {
  adaptTaskSummary,
  adaptTask,
  adaptWorkspace,
  adaptFileTree,
  adaptFileContent,
  adaptFileSave,
  adaptTaskStatus,
} from "./adapters";

describe("workspace adapters", () => {
  it("adapts task summary from contract line 371 & 697 (GET /api/v1/tasks/mine)", () => {
    const backendFixture = {
      id: "task-1",
      title: "Fix payment callback webhook race condition",
      projectTitle: "Payments Microservice",
      status: "in_progress",
      reward: 4500,
      dueAt: "2026-09-10T18:00:00Z",
    };

    const summary = adaptTaskSummary(backendFixture);
    expect(summary.id).toBe("task-1");
    expect(summary.title).toBe("Fix payment callback webhook race condition");
    expect(summary.projectTitle).toBe("Payments Microservice");
    expect(summary.status).toBe("in_progress");
    expect(summary.reward).toBe(4500);
    expect(summary.dueAt).toBe("2026-09-10T18:00:00Z");
  });

  it("adapts task detail from contract line 372 (GET /api/v1/tasks/{task_id})", () => {
    const backendTask = {
      id: "task-1",
      title: "Fix payment callback",
      projectTitle: "Payments",
      ownerName: "FinTech Lead",
      status: "in_progress",
      reward: 4500,
      dueAt: "2026-09-10T18:00:00Z",
      stack: ["Python", "FastAPI"],
      repo: { name: "codebridge/payments", branch: "main", commit: "c8f492b" },
      brief: ["Fix race condition in callback"],
      criteria: [
        { id: "c1", text: "Idempotency guaranteed", testIds: ["t1"], required: true },
      ],
      history: [],
    };

    const task = adaptTask(backendTask);
    expect(task.id).toBe("task-1");
    expect(task.ownerName).toBe("FinTech Lead");
    expect(task.stack).toEqual(["Python", "FastAPI"]);
    expect(task.repo.name).toBe("codebridge/payments");
    expect(task.criteria).toHaveLength(1);
    expect(task.criteria[0].required).toBe(true);
  });

  it("adapts workspace runtime from contract line 427 & 698 (GET /api/v1/workspaces/{task_id})", () => {
    const backendWs = {
      status: "running",
      image: "codebridge/runner:python3.11",
      cpu: "2 vCPU",
      memory: "4 GB",
      repoAccess: "read-only snapshot",
      commit: "c8f492b",
    };

    const ws = adaptWorkspace(backendWs);
    expect(ws.status).toBe("running");
    expect(ws.image).toBe("codebridge/runner:python3.11");
    expect(ws.cpu).toBe("2 vCPU");
    expect(ws.memory).toBe("4 GB");
    expect(ws.repoAccess).toBe("read-only snapshot");
  });

  it("adapts file tree from contract line 431 & 699", () => {
    const backendTree = {
      commit: "c8f492b",
      items: [
        { path: "app/main.py", type: "file", size: 1420 },
        { path: "tests", type: "dir", size: 0 },
      ],
    };

    const tree = adaptFileTree(backendTree);
    expect(tree.commit).toBe("c8f492b");
    expect(tree.items).toHaveLength(2);
    expect(tree.items[0].type).toBe("file");
    expect(tree.items[1].type).toBe("dir");
  });

  it("adapts file content and save from contract line 432-434", () => {
    const contentRes = adaptFileContent({
      path: "app/main.py",
      language: "python",
      content: "print('hello')",
    });
    expect(contentRes.path).toBe("app/main.py");
    expect(contentRes.content).toBe("print('hello')");

    const saveRes = adaptFileSave({ savedAt: "2026-11-17T12:00:00Z" });
    expect(saveRes.savedAt).toBe("2026-11-17T12:00:00Z");
  });

  it("maps task status values", () => {
    expect(adaptTaskStatus("in_progress")).toBe("in_progress");
    expect(adaptTaskStatus("in_review")).toBe("in_review");
    expect(adaptTaskStatus("under_review")).toBe("in_review");
    expect(adaptTaskStatus("completed")).toBe("completed");
    expect(adaptTaskStatus("approved")).toBe("completed");
  });
});
