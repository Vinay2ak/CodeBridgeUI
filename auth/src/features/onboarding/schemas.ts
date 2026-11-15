import { z } from "zod";
import { listTimezones } from "./timezone";
import { checkPassword } from "../../lib/password";

// ── Enum value tuples (as const for zod) ──────────────────────────────────────

const ownerTypeVals = [
  "STUDENT_PROJECT",
  "INDIE_DEVELOPER",
  "STARTUP_TEAM",
  "ACADEMIC_LAB",
] as const;

const ownerStackVals = [
  "PYTHON_FASTAPI",
  "REACT_TS",
  "NODE_EXPRESS",
  "POSTGRESQL",
  "DOCKER",
  "WEBSOCKETS",
  "AI_RAG",
] as const;

const typicalBlockerVals = [
  "HARD_BUG",
  "UNFINISHED_FEATURE",
  "MISSING_INTEGRATION",
  "TEST_CI_FAILURE",
] as const;

const budgetRangeVals = [
  "MICRO_BUG",
  "FEATURE_INTEGRATION",
  "COMPLEX_MODULE",
] as const;

const verificationModeVals = [
  "AUTO_TESTS_AND_REVIEW",
  "MANUAL_REVIEW_ONLY",
] as const;

const experienceLevelVals = [
  "STUDENT_EMERGING",
  "JUNIOR",
  "MID_LEVEL",
  "SENIOR",
] as const;

const freelancerStackVals = [
  "PYTHON_FASTAPI",
  "REACT_TS",
  "POSTGRES_SQL",
  "NODE",
  "DOCKER_WORKFLOWS",
  "REST_WEBHOOKS",
  "AI_RAG_PIPELINES",
] as const;

const specialtyVals = [
  "AUTH_RBAC",
  "PAYMENT_WEBHOOKS",
  "DB_MIGRATIONS",
  "STATE_MACHINES",
  "WEBSOCKET_EVENTS",
  "TESTING",
] as const;

const availabilityVals = [
  "IMMEDIATE",
  "HOURS_10_20",
  "WEEKEND_SPRINTS",
  "BOOKED",
] as const;

// ── Account ───────────────────────────────────────────────────────────────────

export const accountSchema = z
  .object({
    displayName: z.string().trim().min(2).max(50),
    email: z.string().email(),
    password: z.string().min(1),
    role: z.enum(["owner", "freelancer"]),
  })
  .superRefine((data, ctx) => {
    const firstFailed = checkPassword(data.password, data.email).find((r) => !r.met);
    if (firstFailed) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["password"],
        message: firstFailed.label,
      });
    }
  });

// ── Owner step schemas ────────────────────────────────────────────────────────

export const ownerStep1Schema = z.object({
  ownerType: z.enum(ownerTypeVals),
  organizationName: z.string().trim().min(2).max(80),
  roleTitle: z.string().trim().min(2).max(60),
  timezone: z.string().refine((v) => listTimezones().includes(v), {
    message: "Invalid timezone",
  }),
});

export const ownerStep2Schema = z.object({
  primaryStack: z.array(z.enum(ownerStackVals)).min(1).max(7),
  typicalBlocker: z.enum(typicalBlockerVals),
});

export const ownerStep3Schema = z.object({
  defaultBudgetRange: z.enum(budgetRangeVals),
  preferredVerificationMode: z.enum(verificationModeVals),
});

export const fullOwnerSchema = ownerStep1Schema
  .merge(ownerStep2Schema)
  .merge(ownerStep3Schema);

// ── Freelancer helpers ────────────────────────────────────────────────────────

export const githubUsernameSchema = z
  .string()
  .optional()
  .refine(
    (v) => {
      if (v === undefined || v === "") return true;
      if (v.length < 1 || v.length > 39) return false;
      return /^[a-zA-Z0-9]+(-[a-zA-Z0-9]+)*$/.test(v);
    },
    { message: "Invalid GitHub username" }
  );

export const portfolioUrlSchema = z
  .string()
  .optional()
  .refine(
    (v) => {
      if (v === undefined || v === "") return true;
      try {
        const url = new URL(v);
        return url.protocol === "http:" || url.protocol === "https:";
      } catch {
        return false;
      }
    },
    { message: "Must be a valid http/https URL" }
  );

// ── Freelancer step schemas ───────────────────────────────────────────────────

export const freelancerStep1Schema = z.object({
  headline: z.string().trim().min(10).max(80),
  experience: z.enum(experienceLevelVals),
  githubUsername: githubUsernameSchema,
  portfolioUrl: portfolioUrlSchema,
  bio: z.string().trim().min(40).max(400),
});

export const freelancerStep2Schema = z.object({
  supportedStacks: z.array(z.enum(freelancerStackVals)).min(1).max(7),
  skills: z
    .array(z.string().trim().min(2).max(24))
    .min(3)
    .max(12)
    .refine(
      (arr) => new Set(arr.map((s) => s.toLowerCase())).size === arr.length,
      "Skills must be unique"
    ),
  debuggingSpecialties: z.array(z.enum(specialtyVals)).min(1).max(6),
});

export const freelancerStep3Schema = z.object({
  availability: z.enum(availabilityVals),
  minBudget: z.number().int().min(500).max(100000),
  acceptsIsolatedWorkspace: z.literal(true),
  acceptsTestGate: z.literal(true),
});

export const fullFreelancerSchema = freelancerStep1Schema
  .merge(freelancerStep2Schema)
  .merge(freelancerStep3Schema);

// ── Field → step maps ─────────────────────────────────────────────────────────

export const OWNER_FIELD_STEP: Record<string, number> = {
  ownerType: 1,
  organizationName: 1,
  roleTitle: 1,
  timezone: 1,
  primaryStack: 2,
  typicalBlocker: 2,
  defaultBudgetRange: 3,
  preferredVerificationMode: 3,
};

export const FREELANCER_FIELD_STEP: Record<string, number> = {
  headline: 1,
  experience: 1,
  githubUsername: 1,
  portfolioUrl: 1,
  bio: 1,
  supportedStacks: 2,
  skills: 2,
  debuggingSpecialties: 2,
  availability: 3,
  minBudget: 3,
  acceptsIsolatedWorkspace: 3,
  acceptsTestGate: 3,
};
