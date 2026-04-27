import { NextResponse } from "next/server";
import { getHydrationSuggestions } from "@/onboarding";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limitRaw = searchParams.get("limit");
  const parsed =
    limitRaw !== null && limitRaw !== ""
      ? Number.parseInt(limitRaw, 10)
      : undefined;
  const limit =
    parsed !== undefined && Number.isFinite(parsed) ? parsed : undefined;
  const result = await getHydrationSuggestions(limit);
  return NextResponse.json(result);
}
