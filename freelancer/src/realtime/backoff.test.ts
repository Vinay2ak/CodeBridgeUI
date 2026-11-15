import { describe, it, expect } from "vitest";
import { nextDelay } from "./backoff";

describe("Realtime Backoff Calculation", () => {
  it("calculates delays with +/- 20% bounds for initial attempts", () => {
    // attempt 0: base = 1000, bounds [800, 1200]
    const d0Min = nextDelay(0, () => 0);
    const d0Max = nextDelay(0, () => 1);
    expect(d0Min).toBe(800);
    expect(d0Max).toBe(1200);

    // attempt 1: base = 2000, bounds [1600, 2400]
    const d1Min = nextDelay(1, () => 0);
    const d1Max = nextDelay(1, () => 1);
    expect(d1Min).toBe(1600);
    expect(d1Max).toBe(2400);

    // attempt 2: base = 4000, bounds [3200, 4800]
    const d2Min = nextDelay(2, () => 0);
    const d2Max = nextDelay(2, () => 1);
    expect(d2Min).toBe(3200);
    expect(d2Max).toBe(4800);
  });

  it("caps base delay at 30,000ms with jitter [24000, 36000]", () => {
    // attempt 10: 1000 * 1024 = 1024000 -> capped at 30000
    const d10Min = nextDelay(10, () => 0);
    const d10Max = nextDelay(10, () => 1);
    expect(d10Min).toBe(24000);
    expect(d10Max).toBe(36000);

    // attempt 20: capped at 30000
    const d20Min = nextDelay(20, () => 0);
    const d20Max = nextDelay(20, () => 1);
    expect(d20Min).toBe(24000);
    expect(d20Max).toBe(36000);
  });
});

