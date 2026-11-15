import type {
  FreelancerStep1Data,
  FreelancerStep2Data,
  FreelancerStep3Data,
  OwnerStep1Data,
  OwnerStep2Data,
  OwnerStep3Data,
  UserRole,
} from "../types";
import { FreelancerProfileCard } from "./FreelancerProfileCard";
import { OwnerTrustCard } from "./OwnerTrustCard";

export interface PreviewPanelProps {
  role: UserRole | null;
  displayName?: string;
  githubConnected?: boolean;
  githubUsername?: string;
  ownerData?: Partial<OwnerStep1Data & OwnerStep2Data & OwnerStep3Data>;
  freelancerData?: Partial<FreelancerStep1Data & FreelancerStep2Data & FreelancerStep3Data>;
}

export function PreviewPanel({
  role,
  displayName,
  githubConnected = false,
  githubUsername,
  ownerData,
  freelancerData,
}: PreviewPanelProps) {
  const mergedFreelancerData: Partial<
    FreelancerStep1Data & FreelancerStep2Data & FreelancerStep3Data
  > = {
    ...freelancerData,
    githubUsername:
      freelancerData?.githubUsername !== undefined
        ? freelancerData.githubUsername
        : githubUsername,
  };

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-text-muted">
        Live preview · how others will see you
      </p>

      {role === "owner" ? (
        <OwnerTrustCard
          displayName={displayName}
          githubConnected={githubConnected}
          githubUsername={githubUsername}
          data={ownerData ?? {}}
        />
      ) : role === "freelancer" ? (
        <FreelancerProfileCard
          displayName={displayName}
          githubVerified={githubConnected}
          data={mergedFreelancerData}
        />
      ) : (
        <div className="flex min-h-[16rem] flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface p-6 text-center">
          <p className="text-sm font-medium text-text">Your card preview appears here</p>
          <p className="mt-1 max-w-xs text-xs text-text-muted">
            Choose whether you are a project owner or a freelancer to preview your profile card.
          </p>
        </div>
      )}
    </div>
  );
}
