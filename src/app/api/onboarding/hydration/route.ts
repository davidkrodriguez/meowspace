import { getHydrationSuggestions } from "@/onboarding";
import { getRequestId, jsonResponse } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  const { searchParams } = new URL(request.url);
  const limitRaw = searchParams.get("limit");
  const parsed =
    limitRaw !== null && limitRaw !== ""
      ? Number.parseInt(limitRaw, 10)
      : undefined;
  const limit =
    parsed !== undefined && Number.isFinite(parsed) ? parsed : undefined;
  const result = await getHydrationSuggestions(limit);
  return jsonResponse(result, { requestId });
}
