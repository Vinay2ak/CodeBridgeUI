import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { ArrowRight, Banknote, CheckCircle2, FlaskConical, Lock, ShieldCheck } from "lucide-react";
import { Alert } from "../../../components/ui/Alert";
import { VITE_GITHUB_MODE } from "../../../lib/env";
import { mockLink } from "../../../services/github/api";
import { GitHubCard } from "../components/GitHubCard";
import { GitHubDialog } from "../components/GitHubDialog";
import { OptionCard } from "../components/OptionCard";
import { PillGroup } from "../components/PillGroup";
import { SelectField } from "../components/SelectField";
import { StepHeading } from "../components/StepHeading";
import { TextField } from "../components/TextField";
import { WizardNav } from "../components/WizardNav";
import {
  BUDGET_RANGES,
  ORG_NAME_LABEL,
  OWNER_STACKS,
  OWNER_TYPES,
  TYPICAL_BLOCKERS,
  VERIFICATION_MODES,
} from "../options";
import { ownerStep1Schema, ownerStep2Schema, ownerStep3Schema } from "../schemas";
import { detectTimezone, listTimezones } from "../timezone";
import type { OwnerStep1Data, OwnerStep2Data, OwnerStep3Data } from "../types";

export type OwnerDraftData = Partial<OwnerStep1Data & OwnerStep2Data & OwnerStep3Data>;

interface BaseOwnerStepProps {
  initialValues: OwnerDraftData;
  onValuesChange: (patch: OwnerDraftData) => void;
  onBack: (current: OwnerDraftData) => void;
  externalErrors?: Record<string, string>;
  focusField?: string | null;
}

export interface OwnerStep1Props extends BaseOwnerStepProps {
  onNext: (data: OwnerStep1Data) => void;
  isSubmitting?: boolean;
  submitLabel?: string;
}

export function OwnerStep1({
  initialValues,
  onValuesChange,
  onBack,
  onNext,
  externalErrors,
  focusField,
  isSubmitting = false,
  submitLabel = "Complete setup and open dashboard",
}: OwnerStep1Props) {
  const timezones = useMemo(() => listTimezones(), []);
  const defaultTz = useMemo(() => {
    const detected = detectTimezone();
    return timezones.includes(detected) ? detected : (timezones[0] ?? "UTC");
  }, [timezones]);

  const [ownerType, setOwnerType] = useState(initialValues.ownerType ?? "");
  const [organizationName, setOrganizationName] = useState(initialValues.organizationName ?? "");
  const [roleTitle, setRoleTitle] = useState(initialValues.roleTitle ?? "");
  const [timezone, setTimezone] = useState(initialValues.timezone || defaultTz);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [summary, setSummary] = useState<string[]>([]);

  const ownerTypeRef = useRef<HTMLFieldSetElement>(null);
  const orgRef = useRef<HTMLInputElement>(null);
  const roleRef = useRef<HTMLInputElement>(null);
  const tzRef = useRef<HTMLSelectElement>(null);

  const currentData = (): OwnerDraftData => ({
    ownerType,
    organizationName,
    roleTitle,
    timezone,
  });

  useEffect(() => {
    onValuesChange({ timezone });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const focusByField = (field: string) => {
    if (field === "ownerType") {
      ownerTypeRef.current?.querySelector<HTMLInputElement>('input[type="radio"]')?.focus();
    } else if (field === "organizationName") {
      orgRef.current?.focus();
    } else if (field === "roleTitle") {
      roleRef.current?.focus();
    } else if (field === "timezone") {
      tzRef.current?.focus();
    }
  };

  useEffect(() => {
    if (externalErrors && Object.keys(externalErrors).length > 0) {
      setErrors(externalErrors);
      setSummary(Object.values(externalErrors));
    }
  }, [externalErrors]);

  useEffect(() => {
    if (focusField) {
      focusByField(focusField);
    }
  }, [focusField]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const parsed = ownerStep1Schema.safeParse({
      ownerType,
      organizationName,
      roleTitle,
      timezone,
    });

    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      const nextSummary: string[] = [];
      let firstKey: string | null = null;
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "");
        const msg = key === "ownerType" ? "Select an owner category." : issue.message;
        if (key && !nextErrors[key]) {
          nextErrors[key] = msg;
          nextSummary.push(msg);
          if (!firstKey) firstKey = key;
        }
      }
      setErrors(nextErrors);
      setSummary(nextSummary);
      if (firstKey) focusByField(firstKey);
      return;
    }

    setErrors({});
    setSummary([]);
    onNext(parsed.data);
  };

  const orgLabel = ORG_NAME_LABEL[ownerType] ?? "Organization name";

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <StepHeading
        stepKey="owner-1"
        title="Owner profile details"
        subtitle="Set up your organization and role details."
      />

      <div aria-live="polite">
        {summary.length > 0 && (
          <Alert variant="error" title="Please fix the following">
            <ul className="list-disc pl-4 space-y-0.5">
              {summary.map((msg) => (
                <li key={msg}>{msg}</li>
              ))}
            </ul>
          </Alert>
        )}
      </div>

      <fieldset ref={ownerTypeRef} className="space-y-2.5 min-w-0">
        <legend className="text-sm font-medium text-text">What best describes you?</legend>
        <div className="grid gap-2.5">
          {OWNER_TYPES.map((opt) => (
            <OptionCard
              key={opt.value}
              name="ownerType"
              value={opt.value}
              checked={ownerType === opt.value}
              onChange={(val) => {
                setOwnerType(val);
                onValuesChange({ ...currentData(), ownerType: val });
                setErrors((prev) => ({ ...prev, ownerType: "" }));
              }}
              label={opt.label}
            />
          ))}
        </div>
        {errors.ownerType && (
          <p role="alert" className="text-xs text-danger">
            {errors.ownerType}
          </p>
        )}
      </fieldset>

      <TextField
        ref={orgRef}
        label={orgLabel}
        name="organizationName"
        value={organizationName}
        onChange={(e) => {
          const val = e.target.value;
          setOrganizationName(val);
          onValuesChange({ ...currentData(), organizationName: val });
          if (errors.organizationName) setErrors((prev) => ({ ...prev, organizationName: "" }));
        }}
        error={errors.organizationName || undefined}
      />

      <TextField
        ref={roleRef}
        label="Your role or title"
        name="roleTitle"
        placeholder="Founder, CS undergraduate, Tech lead"
        value={roleTitle}
        onChange={(e) => {
          const val = e.target.value;
          setRoleTitle(val);
          onValuesChange({ ...currentData(), roleTitle: val });
          if (errors.roleTitle) setErrors((prev) => ({ ...prev, roleTitle: "" }));
        }}
        error={errors.roleTitle || undefined}
      />

      <SelectField
        ref={tzRef}
        label="Timezone"
        name="timezone"
        options={timezones}
        value={timezone}
        hint="Detected from your browser"
        onChange={(e) => {
          const val = e.target.value;
          setTimezone(val);
          onValuesChange({ ...currentData(), timezone: val });
          if (errors.timezone) setErrors((prev) => ({ ...prev, timezone: "" }));
        }}
        error={errors.timezone || undefined}
      />

      <WizardNav
        showBack={false}
        onBack={() => onBack(currentData())}
        submitLabel={submitLabel}
        loading={isSubmitting}
      />
    </form>
  );
}

export interface OwnerStep2Props extends BaseOwnerStepProps {
  githubConnected: boolean;
  githubUsername?: string;
  onGithubChange: (connected: boolean, username?: string) => void;
  onNext: (data: OwnerStep2Data) => void;
}

export function OwnerStep2({
  initialValues,
  onValuesChange,
  onBack,
  onNext,
  githubConnected,
  githubUsername,
  onGithubChange,
  externalErrors,
  focusField,
}: OwnerStep2Props) {
  const [primaryStack, setPrimaryStack] = useState<string[]>(initialValues.primaryStack ?? []);
  const [typicalBlocker, setTypicalBlocker] = useState(initialValues.typicalBlocker ?? "");

  const [githubDialogOpen, setGithubDialogOpen] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [summary, setSummary] = useState<string[]>([]);

  const stackRef = useRef<HTMLDivElement>(null);
  const blockerRef = useRef<HTMLFieldSetElement>(null);

  const currentData = (): OwnerDraftData => ({
    primaryStack,
    typicalBlocker,
  });

  const focusByField = (field: string) => {
    if (field === "primaryStack") {
      stackRef.current?.querySelector<HTMLInputElement>('input[type="checkbox"]')?.focus();
    } else if (field === "typicalBlocker") {
      blockerRef.current?.querySelector<HTMLInputElement>('input[type="radio"]')?.focus();
    }
  };

  useEffect(() => {
    if (externalErrors && Object.keys(externalErrors).length > 0) {
      setErrors(externalErrors);
      setSummary(Object.values(externalErrors));
    }
  }, [externalErrors]);

  useEffect(() => {
    if (focusField) {
      focusByField(focusField);
    }
  }, [focusField]);

  const handleAuthorizeGithub = async (username: string) => {
    setGithubDialogOpen(false);
    setGithubLoading(true);
    try {
      const res = await mockLink(username);
      onGithubChange(res.connected, res.githubUsername ?? username);
    } catch {
      onGithubChange(false, undefined);
    } finally {
      setGithubLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const parsed = ownerStep2Schema.safeParse({
      primaryStack,
      typicalBlocker,
    });

    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      const nextSummary: string[] = [];
      let firstKey: string | null = null;
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "");
        const msg =
          key === "primaryStack"
            ? "Select at least 1 primary stack."
            : key === "typicalBlocker"
              ? "Select your typical blocker."
              : issue.message;
        if (key && !nextErrors[key]) {
          nextErrors[key] = msg;
          nextSummary.push(msg);
          if (!firstKey) firstKey = key;
        }
      }
      setErrors(nextErrors);
      setSummary(nextSummary);
      if (firstKey) focusByField(firstKey);
      return;
    }

    setErrors({});
    setSummary([]);
    onNext(parsed.data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <StepHeading
        stepKey="owner-2"
        title="Repository and stack defaults"
        subtitle="Help match your tasks to developers with the right environment."
      />

      <div aria-live="polite">
        {summary.length > 0 && (
          <Alert variant="error" title="Please fix the following">
            <ul className="list-disc pl-4 space-y-0.5">
              {summary.map((msg) => (
                <li key={msg}>{msg}</li>
              ))}
            </ul>
          </Alert>
        )}
      </div>

      <GitHubCard
        mode={VITE_GITHUB_MODE}
        connectedUsername={githubConnected ? githubUsername : undefined}
        onOpenDialog={() => setGithubDialogOpen(true)}
        onDisconnect={() => onGithubChange(false, undefined)}
        loading={githubLoading}
      />

      <div ref={stackRef}>
        <PillGroup
          legend="Primary stack"
          options={OWNER_STACKS}
          value={primaryStack}
          min={1}
          max={7}
          onChange={(next) => {
            setPrimaryStack(next);
            onValuesChange({ ...currentData(), primaryStack: next });
            if (errors.primaryStack) setErrors((prev) => ({ ...prev, primaryStack: "" }));
          }}
          error={errors.primaryStack || undefined}
        />
      </div>

      <fieldset ref={blockerRef} className="space-y-2.5 min-w-0">
        <legend className="text-sm font-medium text-text">Typical blocker</legend>
        <div className="grid gap-2.5">
          {TYPICAL_BLOCKERS.map((opt) => (
            <OptionCard
              key={opt.value}
              name="typicalBlocker"
              value={opt.value}
              checked={typicalBlocker === opt.value}
              onChange={(val) => {
                setTypicalBlocker(val);
                onValuesChange({ ...currentData(), typicalBlocker: val });
                setErrors((prev) => ({ ...prev, typicalBlocker: "" }));
              }}
              label={opt.label}
            />
          ))}
        </div>
        {errors.typicalBlocker && (
          <p role="alert" className="text-xs text-danger">
            {errors.typicalBlocker}
          </p>
        )}
      </fieldset>

      <WizardNav showBack onBack={() => onBack(currentData())} submitLabel="Continue" />

      <GitHubDialog
        open={githubDialogOpen}
        onClose={() => setGithubDialogOpen(false)}
        onAuthorize={(username) => void handleAuthorizeGithub(username)}
        initialUsername={githubUsername}
      />
    </form>
  );
}

export interface OwnerStep3Props extends BaseOwnerStepProps {
  onSubmitProfile: (data: OwnerStep3Data) => void;
  isSubmitting: boolean;
}

const ESCROW_STAGES = [
  { label: "Authorized", icon: ShieldCheck, money: false },
  { label: "Held", icon: Lock, money: true },
  { label: "Tested", icon: FlaskConical, money: false },
  { label: "Approved", icon: CheckCircle2, money: false },
  { label: "Released", icon: Banknote, money: true },
] as const;

export function OwnerStep3({
  initialValues,
  onValuesChange,
  onBack,
  onSubmitProfile,
  isSubmitting,
  externalErrors,
  focusField,
}: OwnerStep3Props) {
  const [defaultBudgetRange, setDefaultBudgetRange] = useState(
    initialValues.defaultBudgetRange ?? ""
  );
  const [preferredVerificationMode, setPreferredVerificationMode] = useState(
    initialValues.preferredVerificationMode ?? ""
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [summary, setSummary] = useState<string[]>([]);

  const budgetRef = useRef<HTMLFieldSetElement>(null);
  const verificationRef = useRef<HTMLFieldSetElement>(null);

  const currentData = (): OwnerDraftData => ({
    defaultBudgetRange,
    preferredVerificationMode,
  });

  const focusByField = (field: string) => {
    if (field === "defaultBudgetRange") {
      budgetRef.current?.querySelector<HTMLInputElement>('input[type="radio"]')?.focus();
    } else if (field === "preferredVerificationMode") {
      verificationRef.current?.querySelector<HTMLInputElement>('input[type="radio"]')?.focus();
    }
  };

  useEffect(() => {
    if (externalErrors && Object.keys(externalErrors).length > 0) {
      setErrors(externalErrors);
      setSummary(Object.values(externalErrors));
    }
  }, [externalErrors]);

  useEffect(() => {
    if (focusField) {
      focusByField(focusField);
    }
  }, [focusField]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const parsed = ownerStep3Schema.safeParse({
      defaultBudgetRange,
      preferredVerificationMode,
    });

    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      const nextSummary: string[] = [];
      let firstKey: string | null = null;
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "");
        const msg =
          key === "defaultBudgetRange"
            ? "Select a default budget range."
            : key === "preferredVerificationMode"
              ? "Select a preferred verification mode."
              : issue.message;
        if (key && !nextErrors[key]) {
          nextErrors[key] = msg;
          nextSummary.push(msg);
          if (!firstKey) firstKey = key;
        }
      }
      setErrors(nextErrors);
      setSummary(nextSummary);
      if (firstKey) focusByField(firstKey);
      return;
    }

    setErrors({});
    setSummary([]);
    onSubmitProfile(parsed.data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <StepHeading
        stepKey="owner-3"
        title="Escrow and verification"
        subtitle="Set defaults for your task budgets and how completed fixes are verified."
      />

      <div aria-live="polite">
        {summary.length > 0 && (
          <Alert variant="error" title="Please fix the following">
            <ul className="list-disc pl-4 space-y-0.5">
              {summary.map((msg) => (
                <li key={msg}>{msg}</li>
              ))}
            </ul>
          </Alert>
        )}
      </div>

      <fieldset ref={budgetRef} className="space-y-2.5 min-w-0">
        <legend className="text-sm font-medium text-text">Default budget range</legend>
        <div className="grid gap-2.5">
          {BUDGET_RANGES.map((opt) => (
            <OptionCard
              key={opt.value}
              name="defaultBudgetRange"
              value={opt.value}
              checked={defaultBudgetRange === opt.value}
              onChange={(val) => {
                setDefaultBudgetRange(val);
                onValuesChange({ ...currentData(), defaultBudgetRange: val });
                setErrors((prev) => ({ ...prev, defaultBudgetRange: "" }));
              }}
              label={opt.label}
              accentMoney
            />
          ))}
        </div>
        {errors.defaultBudgetRange && (
          <p role="alert" className="text-xs text-danger">
            {errors.defaultBudgetRange}
          </p>
        )}
      </fieldset>

      <fieldset ref={verificationRef} className="space-y-2.5 min-w-0">
        <legend className="text-sm font-medium text-text">Preferred verification mode</legend>
        <div className="grid gap-2.5">
          {VERIFICATION_MODES.map((opt) => (
            <OptionCard
              key={opt.value}
              name="preferredVerificationMode"
              value={opt.value}
              checked={preferredVerificationMode === opt.value}
              onChange={(val) => {
                setPreferredVerificationMode(val);
                onValuesChange({ ...currentData(), preferredVerificationMode: val });
                setErrors((prev) => ({ ...prev, preferredVerificationMode: "" }));
              }}
              label={opt.label}
              hint={"hint" in opt ? opt.hint : undefined}
            />
          ))}
        </div>
        {errors.preferredVerificationMode && (
          <p role="alert" className="text-xs text-danger">
            {errors.preferredVerificationMode}
          </p>
        )}
      </fieldset>

      <div className="rounded-md border border-border bg-surface-raised/60 p-4 space-y-2.5">
        <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          Escrow gate
        </p>
        <ol className="flex flex-wrap items-center gap-1.5 text-xs">
          {ESCROW_STAGES.map((stage, idx) => {
            const Icon = stage.icon;
            return (
              <li key={stage.label} className="inline-flex items-center gap-1.5">
                <span
                  className={[
                    "inline-flex items-center gap-1 rounded-md border border-border bg-bg px-2 py-1 font-medium",
                    stage.money ? "text-money font-semibold" : "text-text",
                  ].join(" ")}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>{stage.label}</span>
                </span>
                {idx < ESCROW_STAGES.length - 1 && (
                  <ArrowRight className="h-3.5 w-3.5 text-text-muted shrink-0" aria-hidden="true" />
                )}
              </li>
            );
          })}
        </ol>
      </div>

      <WizardNav
        showBack
        onBack={() => onBack(currentData())}
        submitLabel="Complete setup and open dashboard"
        loading={isSubmitting}
      />
    </form>
  );
}
