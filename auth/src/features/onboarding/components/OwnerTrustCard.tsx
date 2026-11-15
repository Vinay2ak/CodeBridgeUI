import { Github } from "lucide-react";
import { OWNER_TYPES } from "../options";
import type { OwnerStep1Data } from "../types";
import { getInitials, lookupLabel, NotSet } from "./cardPrimitives";

export interface OwnerTrustCardProps {
  displayName?: string;
  githubConnected?: boolean;
  githubUsername?: string;
  data: Partial<OwnerStep1Data>;
}

export function OwnerTrustCard({
  displayName,
  githubConnected = false,
  githubUsername,
  data,
}: OwnerTrustCardProps) {
  const orgName = data.organizationName?.trim() || "Your organization";
  const initials = getInitials(data.organizationName?.trim() || displayName?.trim() || "O");
  const ownerTypeLabel = lookupLabel(OWNER_TYPES, data.ownerType);

  return (
    <div className="rounded-lg border border-border bg-surface p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          Owner profile
        </span>
        {ownerTypeLabel ? (
          <span className="rounded-full border border-border bg-surface-raised px-2.5 py-0.5 text-xs font-medium text-text">
            {ownerTypeLabel}
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
          <p className="truncate text-base font-semibold text-text">{orgName}</p>
          <div className="min-h-[1.25rem]">
            {data.roleTitle?.trim() ? (
              <p className="truncate text-xs text-text-muted">{data.roleTitle.trim()}</p>
            ) : (
              <NotSet />
            )}
          </div>
        </div>
      </div>

      <dl className="space-y-2.5 border-t border-border pt-3 text-xs">
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-text-muted shrink-0">Timezone</dt>
          <dd className="text-right font-medium text-text truncate">
            {data.timezone?.trim() ? data.timezone.trim() : <NotSet />}
          </dd>
        </div>

        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-text-muted shrink-0 flex items-center gap-1">
            <Github className="h-3.5 w-3.5" aria-hidden="true" />
            <span>GitHub</span>
          </dt>
          <dd className="text-right font-medium">
            {githubConnected ? (
              <span className="text-success">
                Linked, read-only{githubUsername ? ` · @${githubUsername}` : ""}
              </span>
            ) : (
              <span className="text-text-muted">Not linked yet</span>
            )}
          </dd>
        </div>
      </dl>

      <div className="border-t border-border pt-3">
        <p className="text-[11px] text-text-muted leading-relaxed">
          Project posting and repo management will be available on your project owner dashboard.
        </p>
      </div>
    </div>
  );
}
