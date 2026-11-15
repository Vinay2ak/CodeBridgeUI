import { describe, it, expect, vi, beforeEach } from "vitest";
import { request, configureHttpAuth } from "../lib/http";

describe("Session Refresh Coalescing", () => {
  let refreshCallCount = 0;
  let currentToken: string | null = "expired-token";

  beforeEach(() => {
    refreshCallCount = 0;
    currentToken = "expired-token";
    vi.restoreAllMocks();
  });

  it("coalesces 5 parallel 401 TOKEN_EXPIRED requests into exactly 1 refresh call", async () => {
    let singleFlightRefresh: Promise<string | null> | null = null;

    const mockRefresh = vi.fn().mockImplementation(() => {
      if (!singleFlightRefresh) {
        refreshCallCount++;
        singleFlightRefresh = new Promise<string | null>((resolve) => {
          setTimeout(() => {
            currentToken = "new-valid-token";
            resolve("new-valid-token");
            singleFlightRefresh = null;
          }, 30);
        });
      }
      return singleFlightRefresh;
    });

    configureHttpAuth(
      () => currentToken,
      mockRefresh
    );

    // Mock global fetch
    let fetchCount = 0;
    global.fetch = vi.fn().mockImplementation(async (_url: string, init: RequestInit) => {
      fetchCount++;
      const authHeader = (init?.headers as Headers)?.get("Authorization");

      if (authHeader === "Bearer expired-token") {
        return new Response(
          JSON.stringify({
            code: "TOKEN_EXPIRED",
            detail: "Token expired",
          }),
          {
            status: 401,
            headers: {
              "Content-Type": "application/json",
              "X-Correlation-Id": "test-corr-1",
            },
          }
        );
      }

      return new Response(JSON.stringify({ ok: true, tokenUsed: authHeader }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "X-Correlation-Id": "test-corr-2",
        },
      });
    });

    // Fire 5 requests in parallel
    const results = await Promise.all([
      request<{ ok: boolean; tokenUsed: string }>("/test/1"),
      request<{ ok: boolean; tokenUsed: string }>("/test/2"),
      request<{ ok: boolean; tokenUsed: string }>("/test/3"),
      request<{ ok: boolean; tokenUsed: string }>("/test/4"),
      request<{ ok: boolean; tokenUsed: string }>("/test/5"),
    ]);

    // Exactly 1 refresh call occurred
    expect(mockRefresh).toHaveBeenCalledTimes(1);
    expect(refreshCallCount).toBe(1);

    // All 5 succeeded after replay
    expect(results).toHaveLength(5);
    results.forEach((res) => {
      expect(res.ok).toBe(true);
      expect(res.tokenUsed).toBe("Bearer new-valid-token");
    });

    // 5 original failed + 5 replays = 10 total fetch calls
    expect(fetchCount).toBe(10);
  });
});

