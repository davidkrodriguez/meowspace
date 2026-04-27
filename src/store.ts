import type { Follow, Pet, Post, User } from "./types";

export interface PersistenceAdapter {
  findUserByClerkId(clerkId: string): Promise<User | undefined>;
  insertUser(user: User): Promise<void>;
  listPets(): Promise<Pet[]>;
  listPetsByOwner(ownerUserId: string): Promise<Pet[]>;
  findPetById(petId: string): Promise<Pet | undefined>;
  insertPet(pet: Pet): Promise<void>;
  listPosts(): Promise<Post[]>;
  insertPost(post: Post): Promise<void>;
  listFollowsByFollower(followerUserId: string): Promise<Follow[]>;
  findFollowByPair(
    followerUserId: string,
    targetPetId: string,
  ): Promise<Follow | undefined>;
  insertFollow(follow: Follow): Promise<void>;
}

interface StoreData {
  users: User[];
  pets: Pet[];
  posts: Post[];
  follows: Follow[];
}

const store: StoreData = {
  users: [],
  pets: [],
  posts: [],
  follows: [],
};

class InMemoryAdapter implements PersistenceAdapter {
  async findUserByClerkId(clerkId: string): Promise<User | undefined> {
    return store.users.find((user) => user.clerkId === clerkId);
  }

  async insertUser(user: User): Promise<void> {
    store.users.push(user);
  }

  async listPets(): Promise<Pet[]> {
    return store.pets.slice();
  }

  async listPetsByOwner(ownerUserId: string): Promise<Pet[]> {
    return store.pets.filter((pet) => pet.ownerUserId === ownerUserId);
  }

  async findPetById(petId: string): Promise<Pet | undefined> {
    return store.pets.find((pet) => pet.id === petId);
  }

  async insertPet(pet: Pet): Promise<void> {
    store.pets.push(pet);
  }

  async listPosts(): Promise<Post[]> {
    return store.posts.slice();
  }

  async insertPost(post: Post): Promise<void> {
    store.posts.push(post);
  }

  async listFollowsByFollower(followerUserId: string): Promise<Follow[]> {
    return store.follows.filter(
      (follow) => follow.followerUserId === followerUserId,
    );
  }

  async findFollowByPair(
    followerUserId: string,
    targetPetId: string,
  ): Promise<Follow | undefined> {
    return store.follows.find(
      (follow) =>
        follow.followerUserId === followerUserId &&
        follow.targetPetId === targetPetId,
    );
  }

  async insertFollow(follow: Follow): Promise<void> {
    store.follows.push(follow);
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
  store.users = [];
  store.pets = [];
  store.posts = [];
  store.follows = [];
  cachedAdapter = undefined;
}

export function nowIso(): string {
  return new Date().toISOString();
}
