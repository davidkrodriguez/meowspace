import { resolveAuthenticatedUser, type AuthContext } from "../auth";
import { getStore, nowIso } from "../store";
import type { MediaType, Post } from "../types";

export class AuthorizationError extends Error {}
export class ValidationError extends Error {}

function randomId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export interface CreatePostInput {
  petId: string;
  mediaType: MediaType;
  mediaUrl: string;
  caption?: string;
}

export async function createPost(
  context: AuthContext,
  input: CreatePostInput,
): Promise<Post> {
  const user = await resolveAuthenticatedUser(context);
  const store = await getStore();
  const pet = await store.findPetById(input.petId);

    if (!pet) {
      throw new ValidationError("Pet not found");
    }
    if (pet.ownerUserId !== user.id) {
      throw new AuthorizationError("PET_NOT_OWNED");
    }
    if (!input.mediaUrl?.trim()) {
      throw new ValidationError("Media URL is required");
    }
    if (!["image", "video"].includes(input.mediaType)) {
      throw new ValidationError("Invalid media type");
    }

  const created: Post = {
    id: randomId("pst"),
    petId: input.petId,
    mediaType: input.mediaType,
    mediaUrl: input.mediaUrl.trim(),
    caption: input.caption?.trim() ?? "",
    createdAt: nowIso(),
  };
  await store.insertPost(created);
  return created;
}
