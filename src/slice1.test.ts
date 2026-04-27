import { describe, expect, it } from "vitest";
import {
  createPet,
  deleteMyPet,
  getPetById,
  listMyPets,
  updateMyPet,
  ValidationError as PetValidationError,
} from "./api/pets";
import {
  createPost,
  AuthorizationError,
  ValidationError as PostValidationError,
} from "./api/posts";
import {
  followPet,
  ValidationError as FollowValidationError,
} from "./api/follows";
import { getFeed } from "./api/feed";
import { getHydrationSuggestions } from "./onboarding";
import { AuthError } from "./auth";
import { getStore, resetStore } from "./store";

describe("slice 1 core loop", () => {
  it("enforces pet ownership when creating posts", async () => {
    resetStore();

    const ownerPet = await createPet(
      { clerkUserId: "owner_1" },
      { name: "Milo", species: "cat" },
    );

    await expect(
      createPost(
        { clerkUserId: "intruder_2" },
        {
          petId: ownerPet.id,
          mediaType: "image",
          mediaUrl: "https://example.com/milo.jpg",
        },
      ),
    ).rejects.toThrow(AuthorizationError);
  });

  it("returns deterministic feed pages with cursor pagination", async () => {
    resetStore();

    const luna = await createPet(
      { clerkUserId: "creator_a" },
      { name: "Luna", species: "cat" },
    );
    const simba = await createPet(
      { clerkUserId: "creator_b" },
      { name: "Simba", species: "cat" },
    );
    const followerContext = { clerkUserId: "viewer_1" };

    await followPet(followerContext, luna.id);
    await followPet(followerContext, simba.id);

    await createPost(
      { clerkUserId: "creator_a" },
      {
        petId: luna.id,
        mediaType: "image",
        mediaUrl: "https://example.com/luna-1.jpg",
      },
    );
    await createPost(
      { clerkUserId: "creator_b" },
      {
        petId: simba.id,
        mediaType: "image",
        mediaUrl: "https://example.com/simba-1.jpg",
      },
    );
    await createPost(
      { clerkUserId: "creator_a" },
      {
        petId: luna.id,
        mediaType: "video",
        mediaUrl: "https://example.com/luna-2.mp4",
      },
    );

    const firstPage = await getFeed(followerContext, { limit: 2 });
    expect(firstPage.items).toHaveLength(2);
    expect(firstPage.nextCursor).toBeDefined();

    const secondPage = await getFeed(followerContext, {
      limit: 2,
      cursor: firstPage.nextCursor,
    });
    expect(secondPage.items).toHaveLength(1);
    expect(secondPage.items[0].id).not.toBe(firstPage.items[0].id);
  });

  it("provides onboarding hydration suggestions with required follow count", async () => {
    resetStore();
    await createPet({ clerkUserId: "owner_1" }, { name: "Nori", species: "cat" });
    await createPet({ clerkUserId: "owner_2" }, { name: "Pico", species: "dog" });

    const hydration = await getHydrationSuggestions();
    expect(hydration.requiredFollowCount).toBe(3);
    expect(hydration.suggestedPets.length).toBeGreaterThanOrEqual(2);

    const names = hydration.suggestedPets.map((pet) => pet.name);
    expect(names).toContain("Nori");
    expect(names).toContain("Pico");

    const store = await getStore();
    const pets = await store.listPets();
    expect(pets).toHaveLength(2);
  });

  it("validates required fields and auth context", async () => {
    resetStore();
    await expect(
      createPet({ clerkUserId: "owner_1" }, { name: "", species: "cat" }),
    ).rejects.toThrow(PetValidationError);
    await expect(
      createPet({ clerkUserId: "owner_1" }, { name: "Mochi", species: "" }),
    ).rejects.toThrow(PetValidationError);
    await expect(createPet({}, { name: "Mochi", species: "cat" })).rejects.toThrow(
      AuthError,
    );
  });

  it("returns only the authenticated owner's pets", async () => {
    resetStore();
    await createPet({ clerkUserId: "owner_1" }, { name: "Nori", species: "cat" });
    await createPet({ clerkUserId: "owner_1" }, { name: "Miso", species: "cat" });
    await createPet({ clerkUserId: "owner_2" }, { name: "Pico", species: "dog" });

    const ownerPets = await listMyPets({ clerkUserId: "owner_1" });
    expect(ownerPets).toHaveLength(2);
    expect(ownerPets.map((pet) => pet.name)).toEqual(["Nori", "Miso"]);
  });

  it("validates post creation and follow idempotency", async () => {
    resetStore();
    const pet = await createPet(
      { clerkUserId: "owner_1" },
      { name: "Nori", species: "cat" },
    );

    await expect(
      createPost(
        { clerkUserId: "owner_1" },
        {
          petId: "pet_missing",
          mediaType: "image",
          mediaUrl: "https://example.com/a.jpg",
        },
      ),
    ).rejects.toThrow(PostValidationError);
    await expect(
      createPost(
        { clerkUserId: "owner_1" },
        { petId: pet.id, mediaType: "image", mediaUrl: "" },
      ),
    ).rejects.toThrow(PostValidationError);

    await expect(
      followPet({ clerkUserId: "viewer_1" }, "pet_missing"),
    ).rejects.toThrow(FollowValidationError);

    const first = await followPet({ clerkUserId: "viewer_1" }, pet.id);
    const second = await followPet({ clerkUserId: "viewer_1" }, pet.id);
    expect(second.id).toBe(first.id);

    const store = await getStore();
    const existing = await store.findFollowByPair(first.followerUserId, pet.id);
    expect(existing?.id).toBe(first.id);
  });

  it("updates and deletes pet with ownership checks", async () => {
    resetStore();
    const pet = await createPet(
      { clerkUserId: "owner_9" },
      { name: "Poppy", species: "cat", bio: "sleepy" },
    );

    const updated = await updateMyPet({ clerkUserId: "owner_9" }, pet.id, {
      name: "Poppy Prime",
      bio: "playful",
    });
    expect(updated.name).toBe("Poppy Prime");
    expect(updated.bio).toBe("playful");

    await expect(
      updateMyPet({ clerkUserId: "intruder_9" }, pet.id, { name: "Hack" }),
    ).rejects.toThrow("PET_NOT_OWNED");

    await deleteMyPet({ clerkUserId: "owner_9" }, pet.id);
    await expect(
      getPetById({ clerkUserId: "owner_9" }, pet.id),
    ).rejects.toThrow("Pet not found");
  });
});
