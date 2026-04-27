import { NextResponse } from "next/server";

type JsonResponseOptions = {
  status?: number;
  requestId: string;
  headers?: HeadersInit;
};

type ErrorResponseOptions = {
  status: number;
  code: string;
  message: string;
  requestId: string;
  details?: Record<string, unknown>;
};

export function getRequestId(request: Request): string {
  return request.headers.get("x-request-id") || crypto.randomUUID();
}

export function jsonResponse<T extends object>(
  body: T,
  options: JsonResponseOptions,
): NextResponse {
  const headers = new Headers(options.headers);
  headers.set("x-request-id", options.requestId);
  return NextResponse.json(
    { ...(body as object), requestId: options.requestId },
    {
      status: options.status ?? 200,
      headers,
    },
  );
}

export function errorResponse(options: ErrorResponseOptions): NextResponse {
  const body: Record<string, unknown> = {
    error: {
      code: options.code,
      message: options.message,
      ...(options.details ? { details: options.details } : {}),
    },
  };
  return jsonResponse(body, {
    status: options.status,
    requestId: options.requestId,
  });
}
