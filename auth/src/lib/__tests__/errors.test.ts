import { describe, it, expect } from "vitest";
import { normalizeApiError, ApiError } from "../http";

describe("normalizeApiError", () => {
  it("normalizes non-JSON response into SERVICE_UNAVAILABLE with prescribed detail", () => {
    const htmlResponse = "<html><body>502 Bad Gateway</body></html>";
    const err = normalizeApiError(502, htmlResponse);

    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(502);
    expect(err.code).toBe("SERVICE_UNAVAILABLE");
    expect(err.detail).toBe("The API answered with a page instead of JSON. Check VITE_GATEWAY_URL.");
  });

  it("normalizes contract canonical error JSON with request_id", () => {
    const contractJson = JSON.stringify({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed.",
      },
      request_id: "8c6b7588-4ff5-4ca3-b89e-ec86b51cfa44",
    });

    const err = normalizeApiError(422, contractJson);

    expect(err.status).toBe(422);
    expect(err.code).toBe("VALIDATION_ERROR");
    expect(err.detail).toBe("Request validation failed.");
    expect(err.correlationId).toBe("8c6b7588-4ff5-4ca3-b89e-ec86b51cfa44");
  });

  it("extracts correlationId from X-Correlation-Id or X-Request-ID headers", () => {
    const json = JSON.stringify({
      error: { code: "UNAUTHORIZED", message: "Authentication is required." },
    });
    const headers = new Headers({
      "X-Correlation-Id": "test-corr-id-1234",
    });

    const err = normalizeApiError(401, json, headers);
    expect(err.status).toBe(401);
    expect(err.code).toBe("UNAUTHORIZED");
    expect(err.correlationId).toBe("test-corr-id-1234");
  });

  it("normalizes FastAPI Pydantic field errors into fieldErrors array", () => {
    const pydanticJson = JSON.stringify({
      detail: [
        {
          loc: ["body", "email"],
          msg: "value is not a valid email address",
          type: "value_error",
        },
        {
          loc: ["body", "password"],
          msg: "ensure this value has at least 6 characters",
          type: "value_error",
        },
      ],
    });

    const err = normalizeApiError(422, pydanticJson);
    expect(err.status).toBe(422);
    expect(err.code).toBe("VALIDATION_ERROR");
    expect(err.fieldErrors).toEqual([
      { field: "email", message: "value is not a valid email address" },
      { field: "password", message: "ensure this value has at least 6 characters" },
    ]);
  });
});
