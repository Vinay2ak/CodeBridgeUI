import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ShieldCheck,
  GitBranch,
  Copy,
  Check,
  Clock,
  ArrowRight,
  Lock,
  FileCode,
  Terminal,
} from "lucide-react";
import { projectApi } from "../../services/project/api";
import type { ProjectScope } from "../../services/project/types";
import { Button } from "../../components/ui/Button";
import { Chip } from "../../components/ui/Chip";

interface TaskRadarViewProps {
  onOpenWorkspace: (projectId: string) => void;
}

export const TaskRadarView: React.FC<TaskRadarViewProps> = ({ onOpenWorkspace }) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>("proj_1024");
  const [copiedClone, setCopiedClone] = useState(false);

  const { data: projects } = useQuery({
    queryKey: ["projects", "radar"],
    queryFn: () => projectApi.getProjects(),
  });

  const activeProject: ProjectScope =
    projects?.find((p) => p.id === selectedProjectId) ||
    projects?.[0] || {
      id: "proj_1024",
      title: "Fix payment callback webhook race condition & idempotency",
      description:
        "Multiple gateway callbacks arriving within 50ms cause concurrent database transactions to read uncommitted balance states, executing duplicate credit increments. Implement Redis distributed locking, atomic PostgreSQL row locking, and idempotency key checks in the callback handler.",
      expectedResult:
        "All incoming callback events must be idempotent. Concurrent requests with the same transaction_id must return HTTP 200 without duplicate credit executions. The pytest suite tests/test_payment_callback.py must pass 100%.",
      budget: 5000,
      currency: "INR",
      deadline: "2026-09-10T23:59:59.000Z",
      skills: ["Python", "FastAPI", "PostgreSQL", "Redis", "Pytest"],
      ownerName: "CodeBridge FinTech Team",
      projectState: "assigned",
      escrowState: "held",
      github: {
        status: "connected",
        repoName: "codebridge/payments-service",
        defaultBranch: "main",
        commitHash: "c4b2a8f",
        accessLevel: "Controlled Read-Only (No Owner Password Shared)",
      },
      testSuiteName: "tests/test_payment_callback.py",
    };

  const cloneCommand = `git clone https://git.codebridge.dev/repos/${activeProject.id}.git`;

  const handleCopyClone = () => {
    navigator.clipboard.writeText(cloneCommand);
    setCopiedClone(true);
    setTimeout(() => setCopiedClone(false), 2000);
  };

  const escrowStages = [
    { label: "Unrequested", key: "unrequested" },
    { label: "Authorized", key: "authorized" },
    { label: "Held in Escrow", key: "held" },
    { label: "Release Pending", key: "release_pending" },
    { label: "Released", key: "released" },
  ];

  const currentEscrowIdx = escrowStages.findIndex((s) => s.key === activeProject.escrowState);

  const acceptanceCriteria = [
    "Concurrent callbacks for same transaction_id result in exactly 1 balance increment",
    "Idempotency cache stores event state for 24h with atomic acquisition",
    "Signature verification passes for valid sha256 HMAC headers",
    "All pytest tests in tests/test_payment_callback.py pass with zero warnings",
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-canvas p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-line">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-primary">
                Task Radar & Pre-Accept Scope Preview
              </span>
              <Chip tone="info">US-005 Compliant</Chip>
            </div>
            <h1 className="text-2xl font-bold text-ink">
              Verified Project Scopes & Escrow Guarantees
            </h1>
            <p className="text-sm text-muted">
              Inspect objective acceptance criteria, escrow locks, and repository handoff prior to launching your controlled workspace.
            </p>
          </div>

          {/* Project Selector Pills */}
          {projects && projects.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {projects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedProjectId(p.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all shrink-0 ${
                    selectedProjectId === p.id
                      ? "bg-primary text-on-primary border-primary shadow-sm"
                      : "bg-surface text-muted border-line hover:text-ink hover:border-line-hover"
                  }`}
                >
                  {p.id}: {p.title.slice(0, 22)}...
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 1. Live Escrow Trust Badge Card */}
        <div className="p-5 rounded-xl border border-success-border bg-success-bg/15 relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-lg bg-success-bg text-success border border-success-border shrink-0 mt-0.5">
                <ShieldCheck className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-ink text-base">
                    ₹{activeProject.budget.toLocaleString("en-IN")} Escrow Locked & Guaranteed
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-success text-on-primary">
                    Protected by CodeBridge Escrow
                  </span>
                </div>
                <p className="text-xs text-muted mt-1 max-w-xl">
                  Client funds are deposited in neutral escrow and locked against task ID{" "}
                  <code className="text-primary font-mono">{activeProject.id}</code>. Automatic payout release triggers immediately upon passing the deterministic test gate and owner signoff.
                </p>
              </div>
            </div>

            {/* Escrow Timeline Indicator */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-1">
              {escrowStages.map((stage, idx) => {
                const isPassed = idx <= (currentEscrowIdx >= 0 ? currentEscrowIdx : 2);
                const isCurrent = idx === (currentEscrowIdx >= 0 ? currentEscrowIdx : 2);
                return (
                  <div key={stage.key} className="flex items-center gap-1.5 shrink-0">
                    <div
                      className={`px-2 py-1 rounded text-[11px] font-medium border flex items-center gap-1 ${
                        isCurrent
                          ? "bg-success text-on-primary border-success font-bold"
                          : isPassed
                          ? "bg-success-bg text-success border-success-border"
                          : "bg-surface text-muted/60 border-line"
                      }`}
                    >
                      {isPassed && <Check className="h-3 w-3" />}
                      <span>{stage.label}</span>
                    </div>
                    {idx < escrowStages.length - 1 && (
                      <div
                        className={`h-0.5 w-3 ${
                          idx < (currentEscrowIdx >= 0 ? currentEscrowIdx : 2)
                            ? "bg-success"
                            : "bg-line"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 2. Controlled GitHub Repository Handoff Card */}
        <div className="p-5 rounded-xl border border-line bg-surface space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-info-bg text-primary border border-info-border shrink-0">
                <GitBranch className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-ink">
                  Controlled GitHub Repository Handoff (Read-Only)
                </h3>
                <p className="text-xs text-muted">
                  No personal credentials or master push tokens required. Code clones securely via tokenless repository bridge.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Chip tone="neutral">Commit: {activeProject.github?.commitHash || "c4b2a8f"}</Chip>
              <Chip tone="info">Sandboxed</Chip>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-raised border border-line font-mono text-xs text-ink overflow-x-auto">
            <Terminal className="h-4 w-4 text-muted shrink-0" />
            <span className="flex-1 select-all min-w-0 truncate">
              {cloneCommand}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCopyClone}
              className="shrink-0 h-7 text-xs px-2.5"
            >
              {copiedClone ? (
                <>
                  <Check className="h-3.5 w-3.5 text-success" />
                  <span className="text-success">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* 3. Side-by-Side Requirement Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Problem & Scope Description */}
          <div className="p-5 rounded-xl border border-line bg-surface space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                  <FileCode className="h-4 w-4 text-primary" />
                  Problem Description & Context
                </h3>
                <span className="text-xs font-mono text-muted">ID: {activeProject.id}</span>
              </div>
              <h2 className="text-base font-semibold text-ink leading-snug">
                {activeProject.title}
              </h2>
              <p className="text-xs text-muted leading-relaxed whitespace-pre-line">
                {activeProject.description}
              </p>
            </div>

            <div className="pt-4 border-t border-line space-y-2">
              <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                Required Tech Stack
              </span>
              <div className="flex flex-wrap gap-1.5">
                {activeProject.skills.map((skill: string) => (
                  <span
                    key={skill}
                    className="px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-canvas border border-line text-ink"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Locked Expected Result & Acceptance Criteria */}
          <div className="p-5 rounded-xl border border-line bg-surface space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                  <Lock className="h-4 w-4 text-primary" />
                  Locked Expected Result & Test Scope
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-warning font-medium">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Deadline: {new Date(activeProject.deadline).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-info-bg/30 border border-info-border text-xs text-ink leading-relaxed">
                <p className="font-semibold text-primary mb-1">Objective Specification:</p>
                {activeProject.expectedResult}
              </div>

              <div className="space-y-2">
                <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                  Acceptance Criteria (Deterministic)
                </span>
                <ul className="space-y-1.5">
                  {acceptanceCriteria.map((item: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-ink">
                      <Check className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Primary Action CTA */}
            <div className="pt-4 border-t border-line flex items-center justify-between gap-3">
              <div className="text-xs text-muted">
                Status: <strong className="text-ink capitalize">{activeProject.projectState.replace("_", " ")}</strong>
              </div>
              <Button
                variant="primary"
                size="md"
                onClick={() => onOpenWorkspace(activeProject.id)}
                className="font-bold text-sm px-5"
              >
                <span>Open Controlled Workspace</span>
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
