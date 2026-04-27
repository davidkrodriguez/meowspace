import { resolveAuthenticatedUser, type AuthContext } from "../auth";
import { getStore, nowIso } from "../store";
import type { Pet } from "../types";

export class ValidationError extends Error {}
export class NotFoundError extends Error {}
export class AuthorizationError extends Error {}

function randomId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export interface CreatePetInput {
  name: string;
  species: string;
  avatarUrl?: string;
  bio?: string;
}

export interface UpdatePetInput {
  name?: string;
  species?: string;
  avatarUrl?: string;
  bio?: string;
}

export async function createPet(
  context: AuthContext,
  input: CreatePetInput,
): Promise<Pet> {
  if (!input.name?.trim()) {
    throw new ValidationError("Pet name is required");
  }
  if (!input.species?.trim()) {
    throw new ValidationError("Pet species is required");
  }

  const user = await resolveAuthenticatedUser(context);
  const created: Pet = {
    id: randomId("pet"),
    ownerUserId: user.id,
    name: input.name.trim(),
    species: input.species.trim(),
    avatarUrl: input.avatarUrl,
    bio: input.bio,
    createdAt: nowIso(),
  };

  const store = await getStore();
  await store.insertPet(created);
  return created;
}

export async function listMyPets(context: AuthContext): Promise<Pet[]> {
  const user = await resolveAuthenticatedUser(context);
  const store = await getStore();
  return store.listPetsByOwner(user.id);
}

export async function getPetById(
  context: AuthContext,
  petId: string,
): Promise<Pet> {
  await resolveAuthenticatedUser(context);
  const store = await getStore();
  const pet = await store.findPetById(petId);
  if (!pet) {
    throw new NotFoundError("Pet not found");
  }
  return pet;
}

export async function updateMyPet(
  context: AuthContext,
  petId: string,
  input: UpdatePetInput,
): Promise<Pet> {
  const user = await resolveAuthenticatedUser(context);
  const store = await getStore();
  const existing = await store.findPetById(petId);
  if (!existing) {
    throw new NotFoundError("Pet not found");
  }
  if (existing.ownerUserId !== user.id) {
    throw new AuthorizationError("PET_NOT_OWNED");
  }

  const updates: UpdatePetInput = {};
  if (input.name !== undefined) {
    if (!input.name.trim()) throw new ValidationError("Pet name is required");
    updates.name = input.name.trim();
  }
  if (input.species !== undefined) {
    if (!input.species.trim()) throw new ValidationError("Pet species is required");
    updates.species = input.species.trim();
  }
  if (input.avatarUrl !== undefined) {
    updates.avatarUrl = input.avatarUrl.trim() || undefined;
  }
  if (input.bio !== undefined) {
    updates.bio = input.bio.trim() || undefined;
  }

  const updated = await store.updatePetById(petId, updates);
  if (!updated) {
    throw new NotFoundError("Pet not found");
  }
  return updated;
}

export async function deleteMyPet(context: AuthContext, petId: string): Promise<Pet> {
  const user = await resolveAuthenticatedUser(context);
  const store = await getStore();
  const existing = await store.findPetById(petId);
  if (!existing) {
    throw new NotFoundError("Pet not found");
  }
  if (existing.ownerUserId !== user.id) {
    throw new AuthorizationError("PET_NOT_OWNED");
  }
  await store.deletePetById(petId);
  return existing;
}
