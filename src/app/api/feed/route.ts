import { getFeed } from "@/api/feed";
import { errorResponse, getRequestId, jsonResponse } from "@/lib/api-response";
import { domainErrorResponse } from "@/lib/http-error";
import { authFromRequest } from "@/lib/request-auth";
import type { Cursor } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  try {
    const { searchParams } = new URL(request.url);
    const limitRaw = searchParams.get("limit");
    const parsedLimit =
      limitRaw !== null && limitRaw !== ""
        ? Number.parseInt(limitRaw, 10)
        : undefined;
    const limit =
      parsedLimit !== undefined && Number.isFinite(parsedLimit)
        ? parsedLimit
        : undefined;

    let cursor: Cursor | undefined;
    const cursorRaw = searchParams.get("cursor");
    if (cursorRaw) {
      try {
        cursor = JSON.parse(cursorRaw) as Cursor;
      } catch {
        return errorResponse({
          code: "INVALID_CURSOR",
          message: "cursor must be JSON with createdAt and id",
          status: 400,
          requestId,
        });
      }
    }

    const page = await getFeed(authFromRequest(request), { limit, cursor });
    return jsonResponse(page, { requestId });
  } catch (e) {
    return domainErrorResponse(e, requestId);
  }
}
