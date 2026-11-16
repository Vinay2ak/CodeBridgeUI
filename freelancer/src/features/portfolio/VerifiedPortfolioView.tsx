import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Award,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  Code2,
  GitCommit,
  Calendar,
  Sparkles,
} from "lucide-react";
import { profileApi } from "../../services/profile/api";
import type { PortfolioSummary, VerifiedWorkRecord } from "../../services/profile/types";
import { Button } from "../../components/ui/Button";
import { Chip } from "../../components/ui/Chip";

export const VerifiedPortfolioView: React.FC = () => {
  const [copiedRecordId, setCopiedRecordId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { data: portfolio } = useQuery<PortfolioSummary>({
    queryKey: ["profile", "verified-work"],
    queryFn: () => profileApi.getVerifiedWork(),
  });

  const handleCopyLink = (record: VerifiedWorkRecord) => {
    navigator.clipboard.writeText(record.recruiterProofUrl);
    setCopiedRecordId(record.id);
    setToastMessage(`Recruiter proof link copied for ${record.id}!`);
    setTimeout(() => {
      setCopiedRecordId(null);
      setToastMessage(null);
    }, 3000);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-canvas p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Floating Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-ink text-canvas shadow-xl flex items-center gap-3 border border-line animate-in fade-in slide-in-from-bottom-4 duration-200">
            <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
            <span className="text-xs font-semibold">{toastMessage}</span>
          </div>
        )}

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-primary">
                Verified Work Portfolio
              </span>
              <Chip tone="info">US-010 Compliant</Chip>
            </div>
            <h1 className="text-2xl font-bold text-ink">
              Verified Engineering Records & Escrow Payouts
            </h1>
            <p className="text-sm text-muted">
              Every completed project represents a verified code commit, deterministic test pass, and released escrow payout.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-lg bg-success-bg text-success border border-success-border text-xs font-bold flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4" />
              <span>100% Cryptographically Verified</span>
            </div>
          </div>
        </div>

        {/* 4 Summary Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-line bg-surface space-y-1">
            <span className="text-muted block text-xs font-medium">Verified Projects</span>
            <div className="text-2xl font-bold text-ink flex items-center gap-2">
              <span>{portfolio?.verifiedProjectsCount ?? 3}</span>
              <Award className="h-4 w-4 text-primary" />
            </div>
            <span className="text-[11px] text-muted">100% test-gate verified</span>
          </div>

          <div className="p-4 rounded-xl border border-line bg-surface space-y-1">
            <span className="text-muted block text-xs font-medium">Released Escrow Earnings</span>
            <div className="text-2xl font-bold text-success flex items-center gap-1">
              <span>₹{(portfolio?.escrowEarningsReleased ?? 19500).toLocaleString("en-IN")}</span>
            </div>
            <span className="text-[11px] text-muted">Cleared & transferred to bank</span>
          </div>

          <div className="p-4 rounded-xl border border-line bg-surface space-y-1">
            <span className="text-muted block text-xs font-medium">Test Suite Pass Rate</span>
            <div className="text-2xl font-bold text-primary flex items-center gap-2">
              <span>{portfolio?.testPassRate ?? 100}%</span>
              <CheckCircle2 className="h-4 w-4 text-success" />
            </div>
            <span className="text-[11px] text-muted">Zero failing regression checks</span>
          </div>

          <div className="p-4 rounded-xl border border-line bg-surface space-y-1">
            <span className="text-muted block text-xs font-medium">Verified Skills Proven</span>
            <div className="text-2xl font-bold text-ink flex items-center gap-2">
              <span>{portfolio?.skillsProvenCount ?? 8}</span>
              <Sparkles className="h-4 w-4 text-warning" />
            </div>
            <span className="text-[11px] text-muted">In real production environments</span>
          </div>
        </div>

        {/* Verified Work Record Certificate Cards */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-ink flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Verified Engineering Certificates
            </h2>
            <span className="text-xs text-muted">
              Public proof links suitable for resumes & recruiter profiles
            </span>
          </div>

          <div className="space-y-4">
            {portfolio?.records.map((record) => (
              <div
                key={record.id}
                className="p-5 rounded-xl border border-line bg-surface hover:border-line-hover transition-all space-y-4"
              >
                {/* Certificate Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-line">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-info-bg text-primary border border-info-border flex items-center justify-center shrink-0">
                      <Code2 className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-primary">
                          {record.id}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-success-bg text-success border border-success-border">
                          {record.verificationBadge}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-ink leading-snug mt-0.5">
                        {record.projectTitle}
                      </h3>
                    </div>
                  </div>

                  {/* Payout & Status */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <span className="text-xs text-muted block">Released Payout</span>
                      <span className="text-base font-bold text-success font-mono">
                        ₹{record.payoutAmount.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Metadata Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="flex items-center gap-2 text-muted">
                    <Calendar className="h-4 w-4 shrink-0 text-line-hover" />
                    <span>Completed: {new Date(record.completedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted font-mono truncate">
                    <GitCommit className="h-4 w-4 shrink-0 text-line-hover" />
                    <span className="truncate">Commit: {record.repoRef}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted">
                    <ShieldCheck className="h-4 w-4 shrink-0 text-success" />
                    <span className="truncate">{record.reviewer}</span>
                  </div>
                </div>

                {/* Skills Proven Chips */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] font-semibold text-muted uppercase mr-1">
                    Skills Proven:
                  </span>
                  {record.skillsProven.map((skill) => (
                    <span
                      key={skill}
                      className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-canvas border border-line text-ink"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                {/* Footer Action: Recruiter Proof Link */}
                <div className="pt-3 border-t border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 font-mono text-xs text-muted truncate">
                    <span className="text-primary">Proof URL:</span>
                    <span className="truncate">{record.recruiterProofUrl}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleCopyLink(record)}
                      className="h-8 text-xs font-semibold"
                    >
                      {copiedRecordId === record.id ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-success" />
                          <span className="text-success">Link Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy Recruiter Proof Link</span>
                        </>
                      )}
                    </Button>
                    <a
                      href={record.recruiterProofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-line bg-surface text-muted hover:text-ink hover:border-line-hover transition-colors"
                      title="Open proof certificate"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
