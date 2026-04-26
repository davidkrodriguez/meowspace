import { resolveAuthenticatedUser, type AuthContext } from "../auth";
import { getStore, nowIso } from "../store";
import type { Pet } from "../types";

export class ValidationError extends Error {}

function randomId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export interface CreatePetInput {
  name: string;
  species: string;
  avatarUrl?: string;
  bio?: string;
}

export function createPet(
  context: AuthContext,
  input: CreatePetInput,
): Pet {
  if (!input.name?.trim()) {
    throw new ValidationError("Pet name is required");
  }
  if (!input.species?.trim()) {
    throw new ValidationError("Pet species is required");
  }

  const user = resolveAuthenticatedUser(context);
  const created: Pet = {
    id: randomId("pet"),
    ownerUserId: user.id,
    name: input.name.trim(),
    species: input.species.trim(),
    avatarUrl: input.avatarUrl,
    bio: input.bio,
    createdAt: nowIso(),
  };

  getStore().pets.push(created);
  return created;
}

export function listMyPets(context: AuthContext): Pet[] {
  const user = resolveAuthenticatedUser(context);
  return getStore().pets.filter((pet) => pet.ownerUserId === user.id);
}
