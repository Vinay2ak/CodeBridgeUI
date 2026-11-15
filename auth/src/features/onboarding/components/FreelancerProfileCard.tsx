import { Container, Github } from "lucide-react";
import { formatInr } from "../../../lib/format";
import {
  AVAILABILITY_OPTIONS,
  EXPERIENCE_LEVELS,
  FREELANCER_STACKS,
  SPECIALTIES,
} from "../options";
import type {
  FreelancerStep1Data,
  FreelancerStep2Data,
  FreelancerStep3Data,
} from "../types";
import { getInitials, lookupLabel, NotSet } from "./cardPrimitives";

export interface FreelancerProfileCardProps {
  displayName?: string;
  githubVerified?: boolean;
  data: Partial<FreelancerStep1Data & FreelancerStep2Data & FreelancerStep3Data>;
}

function extractHost(urlString: string | undefined): string | null {
  const trimmed = urlString?.trim();
  if (!trimmed) {
    return null;
  }
  try {
    return new URL(trimmed).hostname || null;
  } catch {
    return null;
  }
}

export function FreelancerProfileCard({
  displayName,
  githubVerified = false,
  data,
}: FreelancerProfileCardProps) {
  const name = displayName?.trim() || "Developer";
  const initials = getInitials(name);
  const experienceLabel = lookupLabel(EXPERIENCE_LEVELS, data.experience);
  const availabilityLabel = lookupLabel(AVAILABILITY_OPTIONS, data.availability);

  const skills = data.skills ?? [];
  const visibleSkills = skills.slice(0, 6);
  const extraSkillsCount = Math.max(0, skills.length - 6);

  const stackLabels = (data.supportedStacks ?? [])
    .map((val) => lookupLabel(FREELANCER_STACKS, val))
    .filter((label): label is string => Boolean(label));

  const specialtyLabels = (data.debuggingSpecialties ?? [])
    .map((val) => lookupLabel(SPECIALTIES, val))
    .filter((label): label is string => Boolean(label));

  const githubHandle = data.githubUsername?.trim().replace(/^@/, "");
  const portfolioHost = extractHost(data.portfolioUrl);
  const hasMinBudget =
    typeof data.minBudget === "number" && !Number.isNaN(data.minBudget) && data.minBudget > 0;

  return (
    <div className="rounded-lg border border-border bg-surface p-5 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {experienceLabel ? (
          <span className="rounded-full border border-border bg-surface-raised px-2.5 py-0.5 text-xs font-medium text-text">
            {experienceLabel}
          </span>
        ) : (
          <NotSet />
        )}
        {availabilityLabel ? (
          <span className="rounded-full border border-primary/40 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
            {availabilityLabel}
          </span>
        ) : (
          <NotSet />
        )}
      </div>

      <div className="flex items-center gap-3">
        <div
          aria-hidden="true"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary"
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold text-text">{name}</p>
          <div className="min-h-[1.25rem]">
            {data.headline?.trim() ? (
              <p className="truncate text-xs text-text-muted">{data.headline.trim()}</p>
            ) : (
              <NotSet />
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3 border-t border-border pt-3 text-xs">
        <div className="space-y-1.5">
          <p className="text-text-muted">Skills</p>
          <div className="min-h-[1.5rem]">
            {visibleSkills.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {visibleSkills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full border border-border bg-bg px-2.5 py-0.5 text-[11px] font-medium text-text"
                  >
                    {skill}
                  </span>
                ))}
                {extraSkillsCount > 0 && (
                  <span className="rounded-full border border-border bg-surface-raised px-2 py-0.5 text-[11px] font-medium text-text-muted">
                    +{extraSkillsCount}
                  </span>
                )}
              </div>
            ) : (
              <NotSet />
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-text">
            <Container className="h-3.5 w-3.5 text-primary shrink-0" aria-hidden="true" />
            <span className="font-medium">
              Docker workspace ready: {stackLabels.length} stacks
            </span>
          </div>
          <div className="min-h-[1.5rem]">
            {stackLabels.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {stackLabels.map((label) => (
                  <span
                    key={label}
                    className="rounded-full border border-border bg-bg px-2.5 py-0.5 text-[11px] font-medium text-text"
                  >
                    {label}
                  </span>
                ))}
              </div>
            ) : (
              <NotSet />
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <p className="text-text-muted">Debugging specialties</p>
          <div className="min-h-[1.5rem]">
            {specialtyLabels.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {specialtyLabels.map((label) => (
                  <span
                    key={label}
                    className="rounded-full border border-border bg-bg px-2.5 py-0.5 text-[11px] font-medium text-text"
                  >
                    {label}
                  </span>
                ))}
              </div>
            ) : (
              <NotSet />
            )}
          </div>
        </div>

        <dl className="space-y-2 pt-1">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-text-muted shrink-0 flex items-center gap-1">
              <Github className="h-3.5 w-3.5" aria-hidden="true" />
              <span>GitHub</span>
            </dt>
            <dd className="flex items-center gap-1.5 text-right font-medium">
              {githubHandle ? (
                <>
                  <span className="text-text">@{githubHandle}</span>
                  <span
                    className={[
                      "rounded-full border border-border bg-bg px-2 py-0.5 text-[10px] font-semibold",
                      githubVerified ? "text-success" : "text-text-muted",
                    ].join(" ")}
                  >
                    {githubVerified ? "Verified" : "Unverified"}
                  </span>
                </>
              ) : (
                <NotSet />
              )}
            </dd>
          </div>

          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-text-muted shrink-0">Portfolio</dt>
            <dd className="text-right font-medium text-text truncate">
              {portfolioHost ?? <NotSet />}
            </dd>
          </div>

          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-text-muted shrink-0">Task floor</dt>
            <dd className="text-right font-semibold">
              {hasMinBudget ? (
                <span className="text-money">
                  Min task budget {formatInr(data.minBudget as number)}
                </span>
              ) : (
                <NotSet />
              )}
            </dd>
          </div>
        </dl>
      </div>

      <div className="border-t border-border pt-3 space-y-1.5">
        <p className="text-xs font-medium text-text-muted">
          Verified Work: 0 tasks yet · No ratings yet
        </p>
        {data.experience === "STUDENT_EMERGING" && (
          <p className="text-[11px] text-primary leading-relaxed">
            Completed tasks create official Verified Work records you can show to recruiters.
          </p>
        )}
      </div>
    </div>
  );
}
