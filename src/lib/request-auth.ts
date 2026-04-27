import type { AuthContext } from "../auth";

const HEADER = "x-clerk-user-id";
const TRUSTED_SECRET_HEADER = "x-internal-auth-secret";

export function authFromRequest(request: Request): AuthContext {
  if (process.env.NODE_ENV === "production") {
    const expectedSecret = process.env.INTERNAL_AUTH_SECRET;
    const actualSecret = request.headers.get(TRUSTED_SECRET_HEADER)?.trim();
    if (!expectedSecret || actualSecret !== expectedSecret) {
      return { clerkUserId: undefined };
    }
  }
  const clerkUserId = request.headers.get(HEADER)?.trim();
  return { clerkUserId: clerkUserId || undefined };
}
