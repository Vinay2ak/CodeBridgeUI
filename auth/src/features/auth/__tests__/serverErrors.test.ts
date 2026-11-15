import { describe, it, expect } from "vitest";
import { ApiError } from "../../../lib/http";
import { mapServerError } from "../serverErrors";

describe("mapServerError", () => {
  it("maps INVALID_CREDENTIALS", () => {
    const err = new ApiError(401, "INVALID_CREDENTIALS", "cid-1", "Bad login");
    const res = mapServerError(err);
    expect(res.code).toBe("INVALID_CREDENTIALS");
    expect(res.correlationId).toBe("cid-1");
  });

  it("maps RATE_LIMITED with default retryAfterSeconds", () => {
    const err = new ApiError(429, "RATE_LIMITED", "cid-2", "Too many requests");
    const res = mapServerError(err);
    expect(res.code).toBe("RATE_LIMITED");
    expect(res.retryAfterSeconds).toBe(10);
  });

  it("maps VALIDATION_FAILED with fieldErrors", () => {
    const err = new ApiError(422, "VALIDATION_FAILED", "cid-3", "Invalid", [
      { field: "email", message: "Invalid email" },
    ]);
    const res = mapServerError(err);
    expect(res.code).toBe("VALIDATION_FAILED");
    expect(res.fieldErrors).toEqual([{ field: "email", message: "Invalid email" }]);
  });

  it("maps unknown errors safely", () => {
    const res = mapServerError(new Error("Network down"));
    expect(res.code).toBe("UNKNOWN_ERROR");
    expect(res.message).toBe("Something went wrong.");
  });
});
