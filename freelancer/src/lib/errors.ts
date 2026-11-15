export interface ApiErrorBody {
  type?: string;
  title?: string;
  status: number;
  code: string;
  detail: string;
  correlationId: string;
}

export class ApiError extends Error {
  public status: number;
  public code: string;
  public detail: string;
  public correlationId: string;
  public retryAfter?: number;

  constructor(body: {
    status: number;
    code: string;
    detail: string;
    correlationId: string;
    retryAfter?: number;
  }) {
    super(body.detail || body.code);
    this.name = "ApiError";
    this.status = body.status;
    this.code = body.code;
    this.detail = body.detail;
    this.correlationId = body.correlationId;
    this.retryAfter = body.retryAfter;
  }
}

