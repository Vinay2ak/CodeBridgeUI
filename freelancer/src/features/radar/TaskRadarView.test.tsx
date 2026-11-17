import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TaskRadarView } from "./TaskRadarView";
import { projectApi } from "../../services/project/api";
import type { ProjectScope } from "../../services/project/types";

const testProject: ProjectScope = {
  id: "proj_1024",
  title: "Fix payment callback webhook race condition & idempotency",
  description: "Payment succeeds but the callback is not saving the final status. Multiple gateway callbacks arriving within 50ms cause concurrent database transactions to read uncommitted balance states.",
  expectedResult: "All incoming callback events must be idempotent. Concurrent requests with the same transaction_id must return HTTP 200 without duplicate credit executions. The pytest suite tests/test_payment_callback.py must pass 100%.",
  budget: 5000,
  currency: "INR",
  deadline: "2026-09-10",
  skills: ["Python", "FastAPI", "PostgreSQL", "Redis"],
  ownerName: "CodeBridge FinTech Team",
  projectState: "open",
  escrowState: "held",
  github: {
    status: "connected",
    repoName: "codebridge/payments-service",
    defaultBranch: "main",
    commitHash: "c4b2a8f",
    accessLevel: "Controlled Read-Only (No Owner Password Shared)",
  },
};

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

describe("TaskRadarView Redesign", () => {
  beforeEach(() => {
    vi.spyOn(projectApi, "getProjects").mockResolvedValue([testProject]);
  });

  it("renders unboxed main column with sentence case title and sections in order", async () => {
    renderWithClient(<TaskRadarView onOpenWorkspace={vi.fn()} />);

    // Breadcrumb and Task ID
    const projElements = await screen.findAllByText(/proj_1024/i);
    expect(projElements.length).toBeGreaterThanOrEqual(1);

    // H1 title without ID
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent("Fix payment callback webhook race condition & idempotency");

    // Headings in required order
    expect(screen.getByText("What is broken")).toBeInTheDocument();
    expect(screen.getByText("What the owner expects")).toBeInTheDocument();
    expect(screen.getByText("Done when")).toBeInTheDocument();
    expect(screen.getByText("Stack")).toBeInTheDocument();
  });

  it("renders boxed sidebar with amount, 4-stage vertical escrow, and simulated payment note", async () => {
    renderWithClient(<TaskRadarView onOpenWorkspace={vi.fn()} />);

    expect((await screen.findAllByText(/Fixed price/i)).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Payment held/i)).toBeInTheDocument();
    expect(screen.getByText(/Simulated payment - demo only/i)).toBeInTheDocument();

    // 4 Escrow steps
    expect(screen.getByText("Authorized")).toBeInTheDocument();
    expect(screen.getByText("Held")).toBeInTheDocument();
    expect(screen.getByText("Release pending")).toBeInTheDocument();
    expect(screen.getByText("Released")).toBeInTheDocument();
  });

  it("handles accept and decline workflows cleanly", async () => {
    const onOpenWorkspace = vi.fn();
    renderWithClient(<TaskRadarView onOpenWorkspace={onOpenWorkspace} />);

    // Before accept: Accept task buttons (desktop + mobile) + Decline + Ask question
    const acceptBtns = await screen.findAllByRole("button", { name: "Accept task" });
    const declineBtn = screen.getByRole("button", { name: "Decline" });
    expect(acceptBtns.length).toBeGreaterThanOrEqual(1);
    expect(declineBtn).toBeInTheDocument();
    expect(screen.getByText("Ask the owner a question")).toBeInTheDocument();

    // Click desktop Accept task
    fireEvent.click(acceptBtns[0]);

    // Transitions to Open workspace
    const openWorkspaceBtns = screen.getAllByRole("button", { name: "Open workspace" });
    expect(openWorkspaceBtns.length).toBeGreaterThanOrEqual(1);

    // Clicking Open workspace invokes callback
    fireEvent.click(openWorkspaceBtns[0]);
    expect(onOpenWorkspace).toHaveBeenCalledWith("proj_1024");
  });
});
