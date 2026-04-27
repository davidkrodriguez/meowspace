import type { Follow, Pet, Post, User } from "./types";

export interface PersistenceAdapter {
  findUserByClerkId(clerkId: string): Promise<User | undefined>;
  insertUser(user: User): Promise<void>;
  listPets(): Promise<Pet[]>;
  listPetsByOwner(ownerUserId: string): Promise<Pet[]>;
  findPetById(petId: string): Promise<Pet | undefined>;
  insertPet(pet: Pet): Promise<void>;
  updatePetById(
    petId: string,
    updates: Partial<Pick<Pet, "name" | "species" | "avatarUrl" | "bio">>,
  ): Promise<Pet | undefined>;
  deletePetById(petId: string): Promise<boolean>;
  listPosts(): Promise<Post[]>;
  insertPost(post: Post): Promise<void>;
  listFollowsByFollower(followerUserId: string): Promise<Follow[]>;
  findFollowByPair(
    followerUserId: string,
    targetPetId: string,
  ): Promise<Follow | undefined>;
  insertFollow(follow: Follow): Promise<void>;
  deleteFollowByPair(
    followerUserId: string,
    targetPetId: string,
  ): Promise<boolean>;
}

interface StoreData {
  users: User[];
  pets: Pet[];
  posts: Post[];
  follows: Follow[];
}

declare global {
  // eslint-disable-next-line no-var
  var __MEOWSPACE_IN_MEMORY_STORE__: StoreData | undefined;
}

function getInMemoryStore(): StoreData {
  if (!globalThis.__MEOWSPACE_IN_MEMORY_STORE__) {
    globalThis.__MEOWSPACE_IN_MEMORY_STORE__ = {
      users: [],
      pets: [],
      posts: [],
      follows: [],
    };
  }
  return globalThis.__MEOWSPACE_IN_MEMORY_STORE__;
}

class InMemoryAdapter implements PersistenceAdapter {
  async findUserByClerkId(clerkId: string): Promise<User | undefined> {
    return getInMemoryStore().users.find((user) => user.clerkId === clerkId);
  }

  async insertUser(user: User): Promise<void> {
    getInMemoryStore().users.push(user);
  }

  async listPets(): Promise<Pet[]> {
    return getInMemoryStore().pets.slice();
  }

  async listPetsByOwner(ownerUserId: string): Promise<Pet[]> {
    return getInMemoryStore().pets.filter((pet) => pet.ownerUserId === ownerUserId);
  }

  async findPetById(petId: string): Promise<Pet | undefined> {
    return getInMemoryStore().pets.find((pet) => pet.id === petId);
  }

  async insertPet(pet: Pet): Promise<void> {
    getInMemoryStore().pets.push(pet);
  }

  async updatePetById(
    petId: string,
    updates: Partial<Pick<Pet, "name" | "species" | "avatarUrl" | "bio">>,
  ): Promise<Pet | undefined> {
    const inMemoryStore = getInMemoryStore();
    const pet = inMemoryStore.pets.find((current) => current.id === petId);
    if (!pet) {
      return undefined;
    }
    if (updates.name !== undefined) pet.name = updates.name;
    if (updates.species !== undefined) pet.species = updates.species;
    if (updates.avatarUrl !== undefined) pet.avatarUrl = updates.avatarUrl;
    if (updates.bio !== undefined) pet.bio = updates.bio;
    return pet;
  }

  async deletePetById(petId: string): Promise<boolean> {
    const inMemoryStore = getInMemoryStore();
    const index = inMemoryStore.pets.findIndex((pet) => pet.id === petId);
    if (index === -1) {
      return false;
    }
    inMemoryStore.pets.splice(index, 1);
    inMemoryStore.posts = inMemoryStore.posts.filter((post) => post.petId !== petId);
    inMemoryStore.follows = inMemoryStore.follows.filter(
      (follow) => follow.targetPetId !== petId,
    );
    return true;
  }

  async listPosts(): Promise<Post[]> {
    return getInMemoryStore().posts.slice();
  }

  async insertPost(post: Post): Promise<void> {
    getInMemoryStore().posts.push(post);
  }

  async listFollowsByFollower(followerUserId: string): Promise<Follow[]> {
    return getInMemoryStore().follows.filter(
      (follow) => follow.followerUserId === followerUserId,
    );
  }

  async findFollowByPair(
    followerUserId: string,
    targetPetId: string,
  ): Promise<Follow | undefined> {
    return getInMemoryStore().follows.find(
      (follow) =>
        follow.followerUserId === followerUserId &&
        follow.targetPetId === targetPetId,
    );
  }

  async insertFollow(follow: Follow): Promise<void> {
    getInMemoryStore().follows.push(follow);
  }

  async deleteFollowByPair(
    followerUserId: string,
    targetPetId: string,
  ): Promise<boolean> {
    const inMemoryStore = getInMemoryStore();
    const index = inMemoryStore.follows.findIndex(
      (follow) =>
        follow.followerUserId === followerUserId &&
        follow.targetPetId === targetPetId,
    );
    if (index === -1) {
      return false;
    }
    inMemoryStore.follows.splice(index, 1);
    return true;
  }
}

const inMemoryAdapter = new InMemoryAdapter();
let cachedAdapter: PersistenceAdapter | undefined;

export async function getStore(): Promise<PersistenceAdapter> {
  if (cachedAdapter) {
    return cachedAdapter;
  }

  const usePostgres =
    process.env.PERSISTENCE_DRIVER === "postgres" &&
    Boolean(process.env.DATABASE_URL);
  if (!usePostgres) {
    cachedAdapter = inMemoryAdapter;
    return cachedAdapter;
  }

  const { createPostgresAdapter } = await import("./persistence/postgres");
  cachedAdapter = createPostgresAdapter(process.env.DATABASE_URL!);
  return cachedAdapter;
}

export function resetStore(): void {
  const inMemoryStore = getInMemoryStore();
  inMemoryStore.users = [];
  inMemoryStore.pets = [];
  inMemoryStore.posts = [];
  inMemoryStore.follows = [];
  cachedAdapter = undefined;
}

export function nowIso(): string {
  return new Date().toISOString();
}
