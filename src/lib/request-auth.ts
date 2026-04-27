import type { AuthContext } from "../auth";

const HEADER = "x-clerk-user-id";

export function authFromRequest(request: Request): AuthContext {
  const clerkUserId = request.headers.get(HEADER)?.trim();
  return { clerkUserId: clerkUserId || undefined };
}
