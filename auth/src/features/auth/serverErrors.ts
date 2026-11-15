import { ApiError } from "../../lib/http";

export interface ServerErrorState {
  code: string;
  message: string;
  detail: string;
  correlationId: string;
  retryAfterSeconds?: number;
  fieldErrors?: { field: string; message: string }[];
}

const CODE_MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS: "Invalid email or password.",
  ACCOUNT_SUSPENDED: "Your account has been suspended.",
  EMAIL_TAKEN: "An account with this email already exists.",
  VALIDATION_FAILED: "Please check the highlighted fields and try again.",
  RATE_LIMITED: "Too many attempts. Please wait before trying again.",
  SERVICE_UNAVAILABLE: "Service is temporarily unavailable. Please try again.",
};

export function mapServerError(err: unknown): ServerErrorState {
  if (err instanceof ApiError) {
    const code =
      err.status === 409 || err.code === "EMAIL_ALREADY_EXISTS"
        ? "EMAIL_TAKEN"
        : err.status === 503 && err.code === "UNKNOWN_ERROR"
          ? "SERVICE_UNAVAILABLE"
          : err.status === 429 && err.code === "UNKNOWN_ERROR"
            ? "RATE_LIMITED"
            : err.code;

    const message = CODE_MESSAGES[code] ?? "Something went wrong.";
    const retryAfter =
      code === "RATE_LIMITED" || err.status === 429
        ? ((err as { retryAfterSeconds?: number }).retryAfterSeconds ?? 10)
        : undefined;

    return {
      code,
      message,
      detail: err.detail,
      correlationId: err.correlationId,
      retryAfterSeconds: retryAfter,
      fieldErrors: err.fieldErrors,
    };
  }

  return {
    code: "UNKNOWN_ERROR",
    message: "Something went wrong.",
    detail: err instanceof Error ? err.message : "Unexpected error",
    correlationId: "",
  };
}
