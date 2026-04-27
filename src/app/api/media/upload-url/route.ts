import { AuthError, resolveAuthenticatedUser } from "@/auth";
import {
  ValidationError,
  createUploadTicket,
} from "@/media-assets";
import { errorResponse, getRequestId, jsonResponse } from "@/lib/api-response";
import { authFromRequest } from "@/lib/request-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  try {
    await resolveAuthenticatedUser(authFromRequest(request));
    const body = (await request.json()) as Record<string, unknown>;
    const ticket = createUploadTicket({
      filename: String(body.filename ?? ""),
      contentType: String(body.contentType ?? ""),
    });
    return jsonResponse({ ticket }, { status: 201, requestId });
  } catch (error) {
    if (error instanceof AuthError) {
      return errorResponse({
        code: "UNAUTHORIZED",
        message: error.message,
        status: 401,
        requestId,
      });
    }
    if (error instanceof ValidationError) {
      return errorResponse({
        code: "VALIDATION_ERROR",
        message: error.message,
        status: 400,
        requestId,
      });
    }
    return errorResponse({
      code: "INTERNAL_ERROR",
      message: "Unexpected error",
      status: 500,
      requestId,
    });
  }
}
