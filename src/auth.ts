import { getStore, nowIso } from "./store";
import type { User } from "./types";

export class AuthError extends Error {}

export interface AuthContext {
  clerkUserId?: string;
}

function randomId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function resolveAuthenticatedUser(context: AuthContext): User {
  const { clerkUserId } = context;
  if (!clerkUserId) {
    throw new AuthError("Missing clerk user id");
  }

  const store = getStore();
  const existing = store.users.find((user) => user.clerkId === clerkUserId);
  if (existing) {
    return existing;
  }

  const created: User = {
    id: randomId("usr"),
    clerkId: clerkUserId,
    createdAt: nowIso(),
  };
  store.users.push(created);
  return created;
}
