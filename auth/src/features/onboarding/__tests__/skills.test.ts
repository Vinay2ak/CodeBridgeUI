import { describe, it, expect } from "vitest";
import { normalizeSkill, addSkill } from "../skills";

describe("normalizeSkill", () => {
  it("trims and collapses spaces", () => {
    expect(normalizeSkill("  hello   world  ")).toBe("hello world");
  });

  it("slices to 24 chars max", () => {
    expect(normalizeSkill("a".repeat(30)).length).toBeLessThanOrEqual(24);
  });
});

describe("addSkill", () => {
  it("case-insensitive deduplication", () => {
    const result = addSkill(["React"], "react");
    expect(result).toEqual(["React"]);
  });

  it("adds new skill", () => {
    const result = addSkill(["React"], "Vue");
    expect(result).toEqual(["React", "Vue"]);
  });

  it("does not add when at 12 skills", () => {
    const existing = Array.from({ length: 12 }, (_, i) => `skill${i}`);
    const result = addSkill(existing, "new");
    expect(result).toHaveLength(12);
    expect(result).toEqual(existing);
  });

  it("empty string returns unchanged", () => {
    const result = addSkill([], "");
    expect(result).toEqual([]);
  });
});
