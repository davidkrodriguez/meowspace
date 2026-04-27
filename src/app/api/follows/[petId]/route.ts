import { NextResponse } from "next/server";
import { unfollowPet } from "@/api/follows";
import { domainErrorResponse } from "@/lib/http-error";
import { authFromRequest } from "@/lib/request-auth";

export const dynamic = "force-dynamic";

export async function DELETE(
  request: Request,
  { params }: { params: { petId: string } },
) {
  try {
    const unfollowed = await unfollowPet(authFromRequest(request), params.petId);
    return NextResponse.json({ unfollowed });
  } catch (e) {
    return domainErrorResponse(e);
  }
}
