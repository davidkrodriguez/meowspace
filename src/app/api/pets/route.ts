import { createPet, listMyPets } from "@/api/pets";
import { getRequestId, jsonResponse } from "@/lib/api-response";
import { domainErrorResponse } from "@/lib/http-error";
import { authFromRequest } from "@/lib/request-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  try {
    const pets = await listMyPets(authFromRequest(request));
    return jsonResponse({ pets }, { requestId });
  } catch (e) {
    return domainErrorResponse(e, requestId);
  }
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);
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
    return jsonResponse({ pet }, { status: 201, requestId });
  } catch (e) {
    return domainErrorResponse(e, requestId);
  }
}
