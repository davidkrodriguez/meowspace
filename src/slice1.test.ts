import { describe, expect, it } from "vitest";
import { createPet } from "./api/pets";
import { createPost, AuthorizationError } from "./api/posts";
import { followPet } from "./api/follows";
import { getFeed } from "./api/feed";
import { getHydrationSuggestions } from "./onboarding";
import { getStore, resetStore } from "./store";

describe("slice 1 core loop", () => {
  it("enforces pet ownership when creating posts", () => {
    resetStore();

    const ownerPet = createPet(
      { clerkUserId: "owner_1" },
      { name: "Milo", species: "cat" },
    );

    expect(() =>
      createPost(
        { clerkUserId: "intruder_2" },
        {
          petId: ownerPet.id,
          mediaType: "image",
          mediaUrl: "https://example.com/milo.jpg",
        },
      ),
    ).toThrow(AuthorizationError);
  });

  it("returns deterministic feed pages with cursor pagination", () => {
    resetStore();

    const luna = createPet(
      { clerkUserId: "creator_a" },
      { name: "Luna", species: "cat" },
    );
    const simba = createPet(
      { clerkUserId: "creator_b" },
      { name: "Simba", species: "cat" },
    );
    const followerContext = { clerkUserId: "viewer_1" };

    followPet(followerContext, luna.id);
    followPet(followerContext, simba.id);

    createPost(
      { clerkUserId: "creator_a" },
      {
        petId: luna.id,
        mediaType: "image",
        mediaUrl: "https://example.com/luna-1.jpg",
      },
    );
    createPost(
      { clerkUserId: "creator_b" },
      {
        petId: simba.id,
        mediaType: "image",
        mediaUrl: "https://example.com/simba-1.jpg",
      },
    );
    createPost(
      { clerkUserId: "creator_a" },
      {
        petId: luna.id,
        mediaType: "video",
        mediaUrl: "https://example.com/luna-2.mp4",
      },
    );

    const firstPage = getFeed(followerContext, { limit: 2 });
    expect(firstPage.items).toHaveLength(2);
    expect(firstPage.nextCursor).toBeDefined();

    const secondPage = getFeed(followerContext, {
      limit: 2,
      cursor: firstPage.nextCursor,
    });
    expect(secondPage.items).toHaveLength(1);
    expect(secondPage.items[0].id).not.toBe(firstPage.items[0].id);
  });

  it("provides onboarding hydration suggestions with required follow count", () => {
    resetStore();
    createPet({ clerkUserId: "owner_1" }, { name: "Nori", species: "cat" });
    createPet({ clerkUserId: "owner_2" }, { name: "Pico", species: "dog" });

    const hydration = getHydrationSuggestions();
    expect(hydration.requiredFollowCount).toBe(3);
    expect(hydration.suggestedPets.length).toBeGreaterThanOrEqual(2);

    const names = hydration.suggestedPets.map((pet) => pet.name);
    expect(names).toContain("Nori");
    expect(names).toContain("Pico");
    expect(getStore().pets).toHaveLength(2);
  });
});
