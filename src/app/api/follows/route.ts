import { NextResponse } from "next/server";
import { followPet } from "@/api/follows";

export const dynamic = "force-dynamic";
import { domainErrorResponse } from "@/lib/http-error";
import { authFromRequest } from "@/lib/request-auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const targetPetId = String(body.targetPetId ?? "");
    const follow = followPet(authFromRequest(request), targetPetId);
    return NextResponse.json({ follow }, { status: 200 });
  } catch (e) {
    return domainErrorResponse(e);
  }
}
