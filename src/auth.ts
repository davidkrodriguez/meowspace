import { getStore, nowIso } from "./store";
import type { User } from "./types";

export class AuthError extends Error {}

export interface AuthContext {
  clerkUserId?: string;
}

function randomId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function resolveAuthenticatedUser(
  context: AuthContext,
): Promise<User> {
  const { clerkUserId } = context;
  if (!clerkUserId) {
    throw new AuthError("Missing clerk user id");
  }

  const store = await getStore();
  const existing = await store.findUserByClerkId(clerkUserId);
  if (existing) {
    return existing;
  }

  const created: User = {
    id: randomId("usr"),
    clerkId: clerkUserId,
    createdAt: nowIso(),
  };
  await store.insertUser(created);
  return created;
}
