import { createPost } from "@/api/posts";
import { getRequestId, jsonResponse } from "@/lib/api-response";
import { domainErrorResponse } from "@/lib/http-error";
import { authFromRequest } from "@/lib/request-auth";
import type { MediaType } from "@/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const mediaType = body.mediaType as MediaType;
    const post = await createPost(authFromRequest(request), {
      petId: String(body.petId ?? ""),
      mediaType,
      mediaUrl: String(body.mediaUrl ?? ""),
      caption:
        body.caption !== undefined && body.caption !== null
          ? String(body.caption)
          : undefined,
    });
    return jsonResponse({ post }, { status: 201, requestId });
  } catch (e) {
    return domainErrorResponse(e, requestId);
  }
}
