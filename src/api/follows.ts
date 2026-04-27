import { resolveAuthenticatedUser, type AuthContext } from "../auth";
import { getStore, nowIso } from "../store";
import type { Follow } from "../types";

function randomId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export class ValidationError extends Error {}

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
  await store.insertFollow(created);
  return created;
}
