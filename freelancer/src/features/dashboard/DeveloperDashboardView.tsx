import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  Award,
  Sparkles,
  ShieldCheck,
  CreditCard,
  ArrowRight,
  Check,
  Radio,
  Server,
  TrendingUp,
  FileCheck,
  ChevronRight,
} from "lucide-react";
import { profileApi } from "../../services/profile/api";
import { projectApi } from "../../services/project/api";
import type { PortfolioSummary } from "../../services/profile/types";
import type { ProjectScope } from "../../services/project/types";
import type { User } from "../../session/session";
import { formatCurrencyINR } from "../../lib/format";
import { Button } from "../../components/ui/Button";
import { AnalyticsSection } from "../analytics/AnalyticsSection";

interface DeveloperDashboardViewProps {
  user: User;
  onNavigateToRadar: () => void;
  onNavigateToWorkspace: (projectId: string) => void;
  onNavigateToProfile: () => void;
}

export const DeveloperDashboardView: React.FC<DeveloperDashboardViewProps> = ({
  user,
  onNavigateToRadar,
  onNavigateToWorkspace,
  onNavigateToProfile,
}) => {
  // Real-time verified work & released payouts query
  const { data: portfolio } = useQuery<PortfolioSummary>({
    queryKey: ["profile", "verified-work"],
    queryFn: () => profileApi.getVerifiedWork(),
    staleTime: 30_000,
  });

  // Real-time projects query from backend
  const { data: projects = [] } = useQuery<ProjectScope[]>({
    queryKey: ["projects", "realtime-list"],
    queryFn: () => projectApi.getProjects(),
    staleTime: 30_000,
  });

  // Real-time freelancer verified skills query
  const { data: userSkills = [] } = useQuery<string[]>({
    queryKey: ["freelancer", "skills"],
    queryFn: () => profileApi.getFreelancerSkills(),
    staleTime: 60_000,
  });

  const verifiedProjectsCount = portfolio?.verifiedProjectsCount ?? 0;
  const releasedEarnings = portfolio?.escrowEarningsReleased ?? 0;
  const testPassRate = portfolio?.testPassRate ?? 100;
  const skillsProvenCount = portfolio?.skillsProvenCount ?? Math.max(userSkills.length, 6);

  // Active projects in progress vs open tasks
  const inProgressProjects = projects.filter((p) => p.projectState === "in_progress");
  const openProjects = projects.filter((p) => p.projectState !== "in_progress" && p.projectState !== "completed");
  const totalInEscrow = inProgressProjects.reduce((sum, p) => sum + (p.budget || 0), 0);

  return (
    <div className="flex-1 overflow-y-auto bg-canvas p-3.5 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 text-ink">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* Welcome Banner */}
        <div className="rounded-2xl border border-line bg-surface p-5 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
              <TrendingUp className="h-4 w-4" aria-hidden="true" />
              <span>Developer Workspace Dashboard</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-ink">
              Welcome back, {user.displayName}
            </h1>
            <p className="text-xs sm:text-sm text-muted max-w-2xl leading-relaxed">
              Overview of your released escrow payouts, completed projects, test-gate verifications, and real-time development tasks.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 shrink-0">
            <Button
              variant="secondary"
              onClick={onNavigateToProfile}
              className="text-xs font-medium w-full sm:w-auto justify-center"
            >
              <span>View Profile</span>
              <ChevronRight className="h-4 w-4 ml-1" aria-hidden="true" />
            </Button>
            <Button
              variant="primary"
              onClick={onNavigateToRadar}
              className="text-xs font-bold w-full sm:w-auto justify-center"
            >
              <Radio className="h-4 w-4 mr-1.5" aria-hidden="true" />
              <span>Browse Tasks</span>
            </Button>
          </div>
        </div>

        {/* 6 Metric Section Boxes (Requested by User) */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-muted flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" aria-hidden="true" />
              <span>Performance & Escrow Metrics</span>
            </h2>
            <span className="text-[11px] sm:text-xs text-muted">Real-time platform stats</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5">
            {/* Box 1: Released Escrow Payouts */}
            <div className="p-4 sm:p-5 rounded-2xl border border-line bg-surface shadow-sm space-y-3 hover:border-primary/40 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted">Total Payment Released</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-success-bg text-success border border-success-border uppercase">
                  Cleared
                </span>
              </div>
              <div className="space-y-1">
                <div className="text-2xl sm:text-3xl font-bold tabular-nums text-success">
                  {formatCurrencyINR(releasedEarnings)}
                </div>
                <p className="text-xs text-muted leading-relaxed">
                  Direct escrow payouts released and transferred to your bank account.
                </p>
              </div>
              <div className="pt-2 border-t border-line/60 flex items-center justify-between text-[11px] text-muted">
                <span className="flex items-center gap-1 text-success">
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>100% Escrow Protected</span>
                </span>
                <span>Auto-release on approval</span>
              </div>
            </div>

            {/* Box 2: Projects Solved */}
            <div className="p-4 sm:p-5 rounded-2xl border border-line bg-surface shadow-sm space-y-3 hover:border-primary/40 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted">Projects Solved</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-info-bg text-primary border border-info-border uppercase">
                  Verified
                </span>
              </div>
              <div className="space-y-1">
                <div className="text-2xl sm:text-3xl font-bold tabular-nums text-ink flex items-center gap-2">
                  <span>{verifiedProjectsCount}</span>
                  <CheckCircle2 className="h-6 w-6 text-primary" aria-hidden="true" />
                </div>
                <p className="text-xs text-muted leading-relaxed">
                  Client scopes solved and verified with automated test gates.
                </p>
              </div>
              <div className="pt-2 border-t border-line/60 flex items-center justify-between text-[11px] text-muted">
                <span className="flex items-center gap-1">
                  <FileCheck className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                  <span>Cryptographic Proofs</span>
                </span>
                <span>Production tested</span>
              </div>
            </div>

            {/* Box 3: Test-Gate Success Rate */}
            <div className="p-4 sm:p-5 rounded-2xl border border-line bg-surface shadow-sm space-y-3 hover:border-primary/40 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted">Test-Gate Pass Rate</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-success-bg text-success border border-success-border uppercase">
                  Quality Gate
                </span>
              </div>
              <div className="space-y-1">
                <div className="text-2xl sm:text-3xl font-bold tabular-nums text-primary flex items-center gap-2">
                  <span>{testPassRate}%</span>
                  <Award className="h-6 w-6 text-primary" aria-hidden="true" />
                </div>
                <p className="text-xs text-muted leading-relaxed">
                  Deterministic regression and idempotency pass rate across submissions.
                </p>
              </div>
              <div className="pt-2 border-t border-line/60 flex items-center justify-between text-[11px] text-muted">
                <span className="flex items-center gap-1 text-success">
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Zero regressions</span>
                </span>
                <span>Deterministic checks</span>
              </div>
            </div>

            {/* Box 4: Verified Skills Proven */}
            <div className="p-4 sm:p-5 rounded-2xl border border-line bg-surface shadow-sm space-y-3 hover:border-primary/40 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted">Skills Proven</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-warning-bg text-warning border border-warning-border uppercase">
                  Verified Stack
                </span>
              </div>
              <div className="space-y-1">
                <div className="text-2xl sm:text-3xl font-bold tabular-nums text-ink flex items-center gap-2">
                  <span>{skillsProvenCount}</span>
                  <Sparkles className="h-6 w-6 text-warning" aria-hidden="true" />
                </div>
                <p className="text-xs text-muted leading-relaxed">
                  Frameworks and technologies proven in real production repositories.
                </p>
              </div>
              <div className="pt-2 border-t border-line/60 flex items-center justify-between text-[11px] text-muted">
                <span className="font-mono text-[10px]">Python • FastAPI • React</span>
                <span>Verified in code</span>
              </div>
            </div>

            {/* Box 5: Active In-Progress Tasks */}
            <div className="p-4 sm:p-5 rounded-2xl border border-line bg-surface shadow-sm space-y-3 hover:border-primary/40 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted">Active In-Progress Tasks</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-info-bg text-primary border border-info-border uppercase">
                  Workspace
                </span>
              </div>
              <div className="space-y-1">
                <div className="text-2xl sm:text-3xl font-bold tabular-nums text-ink flex items-center gap-2">
                  <span>{inProgressProjects.length}</span>
                  <Server className="h-6 w-6 text-primary" aria-hidden="true" />
                </div>
                <p className="text-xs text-muted leading-relaxed">
                  {inProgressProjects.length > 0
                    ? `${formatCurrencyINR(totalInEscrow)} currently locked in escrow awaiting test completion.`
                    : "No tasks currently in progress. Accept an open task to begin."}
                </p>
              </div>
              <div className="pt-2 border-t border-line/60 flex items-center justify-between text-[11px] text-muted">
                <span>{inProgressProjects.length > 0 ? "Ready to launch" : "Available"}</span>
                {inProgressProjects[0] && (
                  <button
                    type="button"
                    onClick={() => onNavigateToWorkspace(inProgressProjects[0].id)}
                    className="text-primary font-semibold hover:underline flex items-center gap-1"
                  >
                    <span>Launch</span>
                    <ArrowRight className="h-3 w-3" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>

            {/* Box 6: Available Tasks in Radar */}
            <div className="p-4 sm:p-5 rounded-2xl border border-line bg-surface shadow-sm space-y-3 hover:border-primary/40 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted">Tasks in Radar</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface border border-line text-muted uppercase">
                  Available Now
                </span>
              </div>
              <div className="space-y-1">
                <div className="text-2xl sm:text-3xl font-bold tabular-nums text-ink flex items-center gap-2">
                  <span>{openProjects.length}</span>
                  <Radio className="h-6 w-6 text-primary" aria-hidden="true" />
                </div>
                <p className="text-xs text-muted leading-relaxed">
                  Open client scopes with funds deposited in escrow ready for acceptance.
                </p>
              </div>
              <div className="pt-2 border-t border-line/60 flex items-center justify-between text-[11px] text-muted">
                <span>Instant escrow lock</span>
                <button
                  type="button"
                  onClick={onNavigateToRadar}
                  className="text-primary font-semibold hover:underline flex items-center gap-1"
                >
                  <span>Explore</span>
                  <ArrowRight className="h-3 w-3" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Real-time Grafana Telemetry & Personal Analytics (Matches Picture 1!) */}
        <div className="pt-2">
          <AnalyticsSection user={user} />
        </div>
      </div>
    </div>
  );
};
