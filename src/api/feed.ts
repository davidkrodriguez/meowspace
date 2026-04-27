import { resolveAuthenticatedUser, type AuthContext } from "../auth";
import { getStore } from "../store";
import type { Cursor, Post } from "../types";

export interface FeedPage {
  items: Post[];
  nextCursor?: Cursor;
}

export interface FeedQuery {
  limit?: number;
  cursor?: Cursor;
}

function comparePosts(a: Post, b: Post): number {
  if (a.createdAt > b.createdAt) return -1;
  if (a.createdAt < b.createdAt) return 1;
  if (a.id > b.id) return -1;
  if (a.id < b.id) return 1;
  return 0;
}

function isAfterCursor(post: Post, cursor: Cursor): boolean {
  if (post.createdAt < cursor.createdAt) return true;
  if (post.createdAt > cursor.createdAt) return false;
  return post.id < cursor.id;
}

export async function getFeed(
  context: AuthContext,
  query: FeedQuery = {},
): Promise<FeedPage> {
  const user = await resolveAuthenticatedUser(context);
  const store = await getStore();
  const follows = await store.listFollowsByFollower(user.id);
  const followPetIds = new Set(
    follows.map((follow) => follow.targetPetId),
  );
  const posts = await store.listPosts();

  const maxLimit = 50;
  const limit = Math.min(Math.max(query.limit ?? 20, 1), maxLimit);
  let candidates = posts
    .filter((post) => followPetIds.has(post.petId))
    .sort(comparePosts);

  if (query.cursor) {
    candidates = candidates.filter((post) => isAfterCursor(post, query.cursor!));
  }

  const items = candidates.slice(0, limit);
  const last = items.at(-1);
  return {
    items,
    nextCursor: last
      ? {
          createdAt: last.createdAt,
          id: last.id,
        }
      : undefined,
  };
}
