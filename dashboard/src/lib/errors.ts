export type ApiErrorCode =
  | 'TOKEN_EXPIRED'
  | 'UNAUTHENTICATED'
  | 'UNAUTHORIZED'
  | 'REFRESH_INVALID'
  | 'ACCOUNT_SUSPENDED'
  | 'FORBIDDEN'
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMIT_EXCEEDED'
  | 'RATE_LIMITED'
  | 'INTERNAL_SERVER_ERROR'
  | 'SERVICE_UNAVAILABLE'
  | 'SERVICE_TIMEOUT'
  | string;

export interface ApiErrorResponse {
  type?: string;
  title?: string;
  status?: number;
  code?: ApiErrorCode;
  detail?: string;
  correlationId?: string;
  errors?: { field: string; message: string }[];
  fieldErrors?: Record<string, string>;
}

export class ApiError extends Error {
  public status: number;
  public code: ApiErrorCode;
  public detail: string;
  public correlationId: string;
  public retryAfter?: number;
  public errors?: { field: string; message: string }[];
  public fieldErrors?: Record<string, string>;

  constructor({
    status,
    code,
    detail,
    correlationId,
    retryAfter,
    errors,
    fieldErrors,
  }: {
    status: number;
    code: ApiErrorCode;
    detail: string;
    correlationId: string;
    retryAfter?: number;
    errors?: { field: string; message: string }[];
    fieldErrors?: Record<string, string>;
  }) {
    super(detail || code);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.detail = detail || code;
    this.correlationId = correlationId;
    this.retryAfter = retryAfter;
    this.errors = errors;
    this.fieldErrors = fieldErrors;
  }
}
