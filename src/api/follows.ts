import { resolveAuthenticatedUser, type AuthContext } from "../auth";
import { getStore, nowIso } from "../store";
import type { Follow } from "../types";

function randomId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 10)}`;
}

export class ValidationError extends Error {}
export class NotFoundError extends Error {}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "23505"
  );
}

export async function followPet(
  context: AuthContext,
  targetPetId: string,
): Promise<Follow> {
  const user = await resolveAuthenticatedUser(context);
  const store = await getStore();
  const targetPet = await store.findPetById(targetPetId);
  if (!targetPet) {
    throw new ValidationError("Target pet not found");
  }

  const existing = await store.findFollowByPair(
    user.id,
    targetPetId,
  );
  if (existing) return existing;

  const created: Follow = {
    id: randomId("fol"),
    followerUserId: user.id,
    targetPetId,
    createdAt: nowIso(),
  };
  try {
    await store.insertFollow(created);
    return created;
  } catch (error) {
    if (isUniqueViolation(error)) {
      const raced = await store.findFollowByPair(user.id, targetPetId);
      if (raced) {
        return raced;
      }
    }
    throw error;
  }
}

export async function unfollowPet(
  context: AuthContext,
  targetPetId: string,
): Promise<Follow> {
  const user = await resolveAuthenticatedUser(context);
  const store = await getStore();
  const existing = await store.findFollowByPair(user.id, targetPetId);
  if (!existing) {
    throw new NotFoundError("Follow not found");
  }
  await store.deleteFollowByPair(user.id, targetPetId);
  return existing;
}
