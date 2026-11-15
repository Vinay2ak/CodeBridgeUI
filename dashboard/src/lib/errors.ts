export type ApiErrorCode =
  | 'TOKEN_EXPIRED'
  | 'UNAUTHENTICATED'
  | 'REFRESH_INVALID'
  | 'ACCOUNT_SUSPENDED'
  | 'FORBIDDEN'
  | 'SERVICE_UNAVAILABLE'
  | string;

export interface ApiErrorResponse {
  type?: string;
  title?: string;
  status?: number;
  code?: ApiErrorCode;
  detail?: string;
  correlationId?: string;
}

export class ApiError extends Error {
  public status: number;
  public code: ApiErrorCode;
  public detail: string;
  public correlationId: string;
  public retryAfter?: number;

  constructor({
    status,
    code,
    detail,
    correlationId,
    retryAfter,
  }: {
    status: number;
    code: ApiErrorCode;
    detail: string;
    correlationId: string;
    retryAfter?: number;
  }) {
    super(detail || code);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.detail = detail || code;
    this.correlationId = correlationId;
    this.retryAfter = retryAfter;
  }
}

