import { unfollowPet } from "@/api/follows";
import { getRequestId, jsonResponse } from "@/lib/api-response";
import { domainErrorResponse } from "@/lib/http-error";
import { authFromRequest } from "@/lib/request-auth";

export const dynamic = "force-dynamic";

export async function DELETE(
  request: Request,
  { params }: { params: { petId: string } },
) {
  const requestId = getRequestId(request);
  try {
    const unfollowed = await unfollowPet(authFromRequest(request), params.petId);
    return jsonResponse({ unfollowed }, { requestId });
  } catch (e) {
    return domainErrorResponse(e, requestId);
  }
}
