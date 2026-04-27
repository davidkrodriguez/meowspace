import { followPet } from "@/api/follows";
import { getRequestId, jsonResponse } from "@/lib/api-response";
import { domainErrorResponse } from "@/lib/http-error";
import { authFromRequest } from "@/lib/request-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const targetPetId = String(body.petId ?? body.targetPetId ?? "");
    const follow = await followPet(authFromRequest(request), targetPetId);
    return jsonResponse({ follow }, { status: 200, requestId });
  } catch (e) {
    return domainErrorResponse(e, requestId);
  }
}
