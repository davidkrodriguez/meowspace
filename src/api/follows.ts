import { resolveAuthenticatedUser, type AuthContext } from "../auth";
import { getStore, nowIso } from "../store";
import type { Follow } from "../types";

function randomId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export class ValidationError extends Error {}

export function followPet(context: AuthContext, targetPetId: string): Follow {
  const user = resolveAuthenticatedUser(context);
  const store = getStore();
  const targetPet = store.pets.find((pet) => pet.id === targetPetId);
  if (!targetPet) {
    throw new ValidationError("Target pet not found");
  }

  const existing = store.follows.find(
    (follow) =>
      follow.followerUserId === user.id && follow.targetPetId === targetPetId,
  );
  if (existing) return existing;

  const created: Follow = {
    id: randomId("fol"),
    followerUserId: user.id,
    targetPetId,
    createdAt: nowIso(),
  };
  store.follows.push(created);
  return created;
}
