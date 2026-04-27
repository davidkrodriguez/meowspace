import { NextResponse } from "next/server";
import { createPet, listMyPets } from "@/api/pets";
import { domainErrorResponse } from "@/lib/http-error";
import { authFromRequest } from "@/lib/request-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const pets = await listMyPets(authFromRequest(request));
    return NextResponse.json({ pets });
  } catch (e) {
    return domainErrorResponse(e);
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const pet = await createPet(authFromRequest(request), {
      name: String(body.name ?? ""),
      species: String(body.species ?? ""),
      avatarUrl:
        body.avatarUrl !== undefined && body.avatarUrl !== null
          ? String(body.avatarUrl)
          : undefined,
      bio:
        body.bio !== undefined && body.bio !== null
          ? String(body.bio)
          : undefined,
    });
    return NextResponse.json({ pet }, { status: 201 });
  } catch (e) {
    return domainErrorResponse(e);
  }
}
