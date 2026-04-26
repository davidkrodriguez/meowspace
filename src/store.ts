import type { Follow, Pet, Post, User } from "./types";

interface Store {
  users: User[];
  pets: Pet[];
  posts: Post[];
  follows: Follow[];
}

const store: Store = {
  users: [],
  pets: [],
  posts: [],
  follows: [],
};

export function getStore(): Store {
  return store;
}

export function resetStore(): void {
  store.users = [];
  store.pets = [];
  store.posts = [];
  store.follows = [];
}

export function nowIso(): string {
  return new Date().toISOString();
}
