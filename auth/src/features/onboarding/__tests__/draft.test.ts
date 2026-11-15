import { beforeEach, describe, it, expect } from "vitest";

let store: Record<string, string> = {};
const mockStorage = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => {
    store[k] = v;
  },
  removeItem: (k: string) => {
    delete store[k];
  },
};

beforeEach(() => {
  store = {};
  Object.defineProperty(globalThis, "sessionStorage", {
    value: mockStorage,
    writable: true,
    configurable: true,
  });
});

import { saveDraft, loadDraft, clearDraft } from "../draft";
import type { OnboardingDraft } from "../types";

const makeDraft = (userId: string): OnboardingDraft => ({
  userId,
  role: "owner",
  step: 1,
  owner: { ownerType: "STUDENT_PROJECT" },
});

describe("draft round-trip", () => {
  it("save and load with same userId returns draft", () => {
    const draft = makeDraft("user-123");
    saveDraft(draft);
    const loaded = loadDraft("user-123");
    expect(loaded).not.toBeNull();
    expect(loaded?.userId).toBe("user-123");
    expect(loaded?.step).toBe(1);
  });

  it("loadDraft with different userId returns null", () => {
    saveDraft(makeDraft("user-123"));
    const loaded = loadDraft("user-999");
    expect(loaded).toBeNull();
  });

  it("clearDraft then loadDraft returns null", () => {
    saveDraft(makeDraft("user-123"));
    clearDraft();
    const loaded = loadDraft("user-123");
    expect(loaded).toBeNull();
  });
});
