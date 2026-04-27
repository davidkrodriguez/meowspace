import { getStore, nowIso } from "./store";
import type { User } from "./types";

export class AuthError extends Error {}

export interface AuthContext {
  clerkUserId?: string;
}

function randomId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 10)}`;
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "23505"
  );
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
  try {
    await store.insertUser(created);
    return created;
  } catch (error) {
    if (isUniqueViolation(error)) {
      const raced = await store.findUserByClerkId(clerkUserId);
      if (raced) {
        return raced;
      }
    }
    throw error;
  }
}
