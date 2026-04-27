import { beforeEach, describe, expect, it, vi } from "vitest";

const mockedStore = vi.hoisted(() => ({
  findUserByClerkId: vi.fn(),
  insertUser: vi.fn(),
  findPetById: vi.fn(),
  findFollowByPair: vi.fn(),
  insertFollow: vi.fn(),
}));

vi.mock("./store", () => ({
  getStore: async () => mockedStore,
  nowIso: () => "2026-01-01T00:00:00.000Z",
}));

import { resolveAuthenticatedUser } from "./auth";
import { followPet } from "./api/follows";
import { authFromRequest } from "./lib/request-auth";

describe("race-safety and auth hardening", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.NODE_ENV;
    delete process.env.INTERNAL_AUTH_SECRET;
  });

  it("returns existing user when insert races on unique constraint", async () => {
    mockedStore.findUserByClerkId
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({
        id: "usr_existing",
        clerkId: "clerk_1",
        createdAt: "2026-01-01T00:00:00.000Z",
      });
    mockedStore.insertUser.mockRejectedValueOnce({ code: "23505" });

    const user = await resolveAuthenticatedUser({ clerkUserId: "clerk_1" });
    expect(user.id).toBe("usr_existing");
  });

  it("returns existing follow when duplicate insert races", async () => {
    mockedStore.findUserByClerkId.mockResolvedValue({
      id: "usr_1",
      clerkId: "clerk_1",
      createdAt: "2026-01-01T00:00:00.000Z",
    });
    mockedStore.findPetById.mockResolvedValue({
      id: "pet_1",
      ownerUserId: "usr_owner",
      name: "Milo",
      species: "cat",
      createdAt: "2026-01-01T00:00:00.000Z",
    });
    mockedStore.findFollowByPair
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({
        id: "fol_existing",
        followerUserId: "usr_1",
        targetPetId: "pet_1",
        createdAt: "2026-01-01T00:00:00.000Z",
      });
    mockedStore.insertFollow.mockRejectedValueOnce({ code: "23505" });

    const follow = await followPet({ clerkUserId: "clerk_1" }, "pet_1");
    expect(follow.id).toBe("fol_existing");
  });

  it("requires trusted secret header in production", () => {
    process.env.NODE_ENV = "production";
    process.env.INTERNAL_AUTH_SECRET = "supersecret";

    const unauthorized = authFromRequest(
      new Request("http://localhost/api/pets", {
        headers: { "x-clerk-user-id": "clerk_1" },
      }),
    );
    expect(unauthorized.clerkUserId).toBeUndefined();

    const authorized = authFromRequest(
      new Request("http://localhost/api/pets", {
        headers: {
          "x-clerk-user-id": "clerk_1",
          "x-internal-auth-secret": "supersecret",
        },
      }),
    );
    expect(authorized.clerkUserId).toBe("clerk_1");
  });
});
