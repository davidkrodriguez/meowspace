import { Pool } from "pg";
import type { Follow, Pet, Post, User } from "../types";
import type { PersistenceAdapter } from "../store";

function rowToUser(row: Record<string, unknown>): User {
  return {
    id: String(row.id),
    clerkId: String(row.clerk_id),
    createdAt: String(row.created_at),
  };
}

function rowToPet(row: Record<string, unknown>): Pet {
  return {
    id: String(row.id),
    ownerUserId: String(row.owner_user_id),
    name: String(row.name),
    species: String(row.species),
    avatarUrl: row.avatar_url ? String(row.avatar_url) : undefined,
    bio: row.bio ? String(row.bio) : undefined,
    createdAt: String(row.created_at),
  };
}

function rowToPost(row: Record<string, unknown>): Post {
  return {
    id: String(row.id),
    petId: String(row.pet_id),
    mediaType: row.media_type === "video" ? "video" : "image",
    mediaUrl: String(row.media_url),
    caption: String(row.caption ?? ""),
    createdAt: String(row.created_at),
  };
}

function rowToFollow(row: Record<string, unknown>): Follow {
  return {
    id: String(row.id),
    followerUserId: String(row.follower_user_id),
    targetPetId: String(row.target_pet_id),
    createdAt: String(row.created_at),
  };
}

class PostgresAdapter implements PersistenceAdapter {
  constructor(private readonly pool: Pool) {}

  async findUserByClerkId(clerkId: string): Promise<User | undefined> {
    const result = await this.pool.query(
      "SELECT * FROM users WHERE clerk_id = $1 LIMIT 1",
      [clerkId],
    );
    return result.rows[0] ? rowToUser(result.rows[0]) : undefined;
  }

  async insertUser(user: User): Promise<void> {
    await this.pool.query(
      "INSERT INTO users (id, clerk_id, created_at) VALUES ($1, $2, $3)",
      [user.id, user.clerkId, user.createdAt],
    );
  }

  async listPets(): Promise<Pet[]> {
    const result = await this.pool.query("SELECT * FROM pets");
    return result.rows.map((row) => rowToPet(row));
  }

  async listPetsByOwner(ownerUserId: string): Promise<Pet[]> {
    const result = await this.pool.query(
      "SELECT * FROM pets WHERE owner_user_id = $1",
      [ownerUserId],
    );
    return result.rows.map((row) => rowToPet(row));
  }

  async findPetById(petId: string): Promise<Pet | undefined> {
    const result = await this.pool.query(
      "SELECT * FROM pets WHERE id = $1 LIMIT 1",
      [petId],
    );
    return result.rows[0] ? rowToPet(result.rows[0]) : undefined;
  }

  async insertPet(pet: Pet): Promise<void> {
    await this.pool.query(
      "INSERT INTO pets (id, owner_user_id, name, species, avatar_url, bio, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [
        pet.id,
        pet.ownerUserId,
        pet.name,
        pet.species,
        pet.avatarUrl ?? null,
        pet.bio ?? null,
        pet.createdAt,
      ],
    );
  }

  async listPosts(): Promise<Post[]> {
    const result = await this.pool.query("SELECT * FROM posts");
    return result.rows.map((row) => rowToPost(row));
  }

  async insertPost(post: Post): Promise<void> {
    await this.pool.query(
      "INSERT INTO posts (id, pet_id, media_type, media_url, caption, created_at) VALUES ($1, $2, $3, $4, $5, $6)",
      [post.id, post.petId, post.mediaType, post.mediaUrl, post.caption, post.createdAt],
    );
  }

  async listFollowsByFollower(followerUserId: string): Promise<Follow[]> {
    const result = await this.pool.query(
      "SELECT * FROM follows WHERE follower_user_id = $1",
      [followerUserId],
    );
    return result.rows.map((row) => rowToFollow(row));
  }

  async findFollowByPair(
    followerUserId: string,
    targetPetId: string,
  ): Promise<Follow | undefined> {
    const result = await this.pool.query(
      "SELECT * FROM follows WHERE follower_user_id = $1 AND target_pet_id = $2 LIMIT 1",
      [followerUserId, targetPetId],
    );
    return result.rows[0] ? rowToFollow(result.rows[0]) : undefined;
  }

  async insertFollow(follow: Follow): Promise<void> {
    await this.pool.query(
      "INSERT INTO follows (id, follower_user_id, target_pet_id, created_at) VALUES ($1, $2, $3, $4)",
      [follow.id, follow.followerUserId, follow.targetPetId, follow.createdAt],
    );
  }
}

export function createPostgresAdapter(databaseUrl: string): PersistenceAdapter {
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: process.env.PGSSLMODE === "disable" ? false : undefined,
  });
  return new PostgresAdapter(pool);
}
