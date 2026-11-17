export interface FieldError {
  field: string;
  message: string;
}

export interface ApiErrorBody {
  type?: string;
  title?: string;
  status: number;
  code: string;
  detail: string;
  correlationId: string;
  fieldErrors?: FieldError[];
  retryAfter?: number;
}

export class ApiError extends Error {
  public status: number;
  public code: string;
  public detail: string;
  public correlationId: string;
  public retryAfter?: number;
  public fieldErrors?: FieldError[];

  constructor(body: {
    status: number;
    code: string;
    detail: string;
    correlationId: string;
    fieldErrors?: FieldError[];
    retryAfter?: number;
  }) {
    super(body.detail || body.code);
    this.name = "ApiError";
    this.status = body.status;
    this.code = body.code;
    this.detail = body.detail;
    this.correlationId = body.correlationId;
    this.fieldErrors = body.fieldErrors;
    this.retryAfter = body.retryAfter;
  }
}
