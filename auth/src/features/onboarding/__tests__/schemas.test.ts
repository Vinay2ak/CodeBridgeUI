import { describe, it, expect } from "vitest";
import {
  accountSchema,
  ownerStep1Schema,
  ownerStep2Schema,
  freelancerStep1Schema,
  freelancerStep2Schema,
  freelancerStep3Schema,
  githubUsernameSchema,
  portfolioUrlSchema,
} from "../schemas";
import { listTimezones } from "../timezone";

const validTimezone = listTimezones()[0] ?? "UTC";

describe("accountSchema", () => {
  it("valid object passes", () => {
    const result = accountSchema.safeParse({
      displayName: "Alice",
      email: "alice@example.com",
      password: "MyS3cur3Password!",
      role: "owner",
    });
    expect(result.success).toBe(true);
  });

  it("weak password fails", () => {
    const result = accountSchema.safeParse({
      displayName: "Alice",
      email: "alice@example.com",
      password: "secret",
      role: "owner",
    });
    expect(result.success).toBe(false);
  });

  it("missing role fails", () => {
    const result = accountSchema.safeParse({
      displayName: "Alice",
      email: "alice@example.com",
      password: "MyS3cur3Password!",
    });
    expect(result.success).toBe(false);
  });

  it("displayName '1 char' fails", () => {
    const result = accountSchema.safeParse({
      displayName: "a",
      email: "alice@example.com",
      password: "MyS3cur3Password!",
      role: "owner",
    });
    expect(result.success).toBe(false);
  });
});

describe("ownerStep1Schema", () => {
  it("valid passes", () => {
    const result = ownerStep1Schema.safeParse({
      ownerType: "STUDENT_PROJECT",
      organizationName: "My College",
      roleTitle: "Lead Developer",
      timezone: validTimezone,
    });
    expect(result.success).toBe(true);
  });

  it("bad timezone fails", () => {
    const result = ownerStep1Schema.safeParse({
      ownerType: "STUDENT_PROJECT",
      organizationName: "My College",
      roleTitle: "Lead Developer",
      timezone: "Fake/Zone",
    });
    expect(result.success).toBe(false);
  });

  it("organizationName 1 char fails", () => {
    const result = ownerStep1Schema.safeParse({
      ownerType: "STUDENT_PROJECT",
      organizationName: "a",
      roleTitle: "Lead Developer",
      timezone: validTimezone,
    });
    expect(result.success).toBe(false);
  });
});

describe("ownerStep2Schema", () => {
  it("primaryStack empty array fails", () => {
    const result = ownerStep2Schema.safeParse({
      primaryStack: [],
      typicalBlocker: "HARD_BUG",
    });
    expect(result.success).toBe(false);
  });

  it("primaryStack 8 stacks fails (too many)", () => {
    const result = ownerStep2Schema.safeParse({
      primaryStack: [
        "PYTHON_FASTAPI",
        "REACT_TS",
        "NODE_EXPRESS",
        "POSTGRESQL",
        "DOCKER",
        "WEBSOCKETS",
        "AI_RAG",
        "PYTHON_FASTAPI",
      ],
      typicalBlocker: "HARD_BUG",
    });
    expect(result.success).toBe(false);
  });
});

describe("freelancerStep1Schema bio", () => {
  const base = {
    headline: "Expert TypeScript developer",
    experience: "JUNIOR" as const,
    bio: "",
  };

  it("bio 39 chars fails", () => {
    const result = freelancerStep1Schema.safeParse({ ...base, bio: "a".repeat(39) });
    expect(result.success).toBe(false);
  });

  it("bio 40 chars passes", () => {
    const result = freelancerStep1Schema.safeParse({ ...base, bio: "a".repeat(40) });
    expect(result.success).toBe(true);
  });

  it("bio 400 chars passes", () => {
    const result = freelancerStep1Schema.safeParse({ ...base, bio: "a".repeat(400) });
    expect(result.success).toBe(true);
  });

  it("bio 401 chars fails", () => {
    const result = freelancerStep1Schema.safeParse({ ...base, bio: "a".repeat(401) });
    expect(result.success).toBe(false);
  });
});

describe("freelancerStep2Schema skills", () => {
  const base = {
    supportedStacks: ["PYTHON_FASTAPI"] as const,
    debuggingSpecialties: ["AUTH_RBAC"] as const,
  };

  it("skills 2 items fails", () => {
    const result = freelancerStep2Schema.safeParse({ ...base, skills: ["Python", "FastAPI"] });
    expect(result.success).toBe(false);
  });

  it("skills 3 items passes", () => {
    const result = freelancerStep2Schema.safeParse({
      ...base,
      skills: ["Python", "FastAPI", "Docker"],
    });
    expect(result.success).toBe(true);
  });

  it("skills 12 items passes", () => {
    const skills = Array.from({ length: 12 }, (_, i) => `Skill${i}`);
    const result = freelancerStep2Schema.safeParse({ ...base, skills });
    expect(result.success).toBe(true);
  });

  it("skills 13 items fails", () => {
    const skills = Array.from({ length: 13 }, (_, i) => `Skill${i}`);
    const result = freelancerStep2Schema.safeParse({ ...base, skills });
    expect(result.success).toBe(false);
  });
});

describe("freelancerStep3Schema minBudget", () => {
  const base = {
    availability: "IMMEDIATE" as const,
    acceptsIsolatedWorkspace: true as const,
    acceptsTestGate: true as const,
  };

  it("minBudget 499 fails", () => {
    const result = freelancerStep3Schema.safeParse({ ...base, minBudget: 499 });
    expect(result.success).toBe(false);
  });

  it("minBudget 500 passes", () => {
    const result = freelancerStep3Schema.safeParse({ ...base, minBudget: 500 });
    expect(result.success).toBe(true);
  });

  it("minBudget 100001 fails", () => {
    const result = freelancerStep3Schema.safeParse({ ...base, minBudget: 100001 });
    expect(result.success).toBe(false);
  });

  it("acceptsIsolatedWorkspace false fails", () => {
    const result = freelancerStep3Schema.safeParse({
      ...base,
      acceptsIsolatedWorkspace: false,
    });
    expect(result.success).toBe(false);
  });
});

describe("githubUsernameSchema", () => {
  it("'-startshyphen' fails", () => {
    const result = githubUsernameSchema.safeParse("-startshyphen");
    expect(result.success).toBe(false);
  });

  it("'ends-' fails", () => {
    const result = githubUsernameSchema.safeParse("ends-");
    expect(result.success).toBe(false);
  });

  it("'valid-user123' passes", () => {
    const result = githubUsernameSchema.safeParse("valid-user123");
    expect(result.success).toBe(true);
  });
});

describe("portfolioUrlSchema", () => {
  it("'ftp://bad.com' fails", () => {
    const result = portfolioUrlSchema.safeParse("ftp://bad.com");
    expect(result.success).toBe(false);
  });

  it("'https://good.com' passes", () => {
    const result = portfolioUrlSchema.safeParse("https://good.com");
    expect(result.success).toBe(true);
  });

  it("empty string passes (optional)", () => {
    const result = portfolioUrlSchema.safeParse("");
    expect(result.success).toBe(true);
  });
});
