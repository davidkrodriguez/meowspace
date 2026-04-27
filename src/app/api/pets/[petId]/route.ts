import { NextResponse } from "next/server";
import { getPetById } from "@/api/pets";
import { domainErrorResponse } from "@/lib/http-error";
import { authFromRequest } from "@/lib/request-auth";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { petId: string } },
) {
  try {
    const pet = await getPetById(authFromRequest(request), params.petId);
    return NextResponse.json({ pet });
  } catch (e) {
    return domainErrorResponse(e);
  }
}
