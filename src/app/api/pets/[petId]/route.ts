import { NextResponse } from "next/server";
import { deleteMyPet, getPetById, updateMyPet } from "@/api/pets";
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

export async function PATCH(
  request: Request,
  { params }: { params: { petId: string } },
) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const pet = await updateMyPet(authFromRequest(request), params.petId, {
      name: body.name !== undefined ? String(body.name) : undefined,
      species: body.species !== undefined ? String(body.species) : undefined,
      avatarUrl: body.avatarUrl !== undefined ? String(body.avatarUrl) : undefined,
      bio: body.bio !== undefined ? String(body.bio) : undefined,
    });
    return NextResponse.json({ pet });
  } catch (e) {
    return domainErrorResponse(e);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { petId: string } },
) {
  try {
    const deleted = await deleteMyPet(authFromRequest(request), params.petId);
    return NextResponse.json({ deleted });
  } catch (e) {
    return domainErrorResponse(e);
  }
}
