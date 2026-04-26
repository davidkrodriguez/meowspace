import { describe, expect, it, beforeEach } from "vitest";
import { resetStore } from "./store";
import { GET as getFeed } from "./app/api/feed/route";
import { POST as postFollows } from "./app/api/follows/route";
import { GET as getPets, POST as postPets } from "./app/api/pets/route";
import { POST as postPosts } from "./app/api/posts/route";
import { GET as getHydration } from "./app/api/onboarding/hydration/route";

const auth = (clerkUserId: string) => ({
  "x-clerk-user-id": clerkUserId,
});

beforeEach(() => {
  resetStore();
});

describe("slice 2 HTTP API", () => {
  it("GET /api/pets requires auth", async () => {
    const res = await getPets(new Request("http://localhost/api/pets"));
    expect(res.status).toBe(401);
  });

  it("POST pet, follow, post, GET feed end-to-end", async () => {
    const petRes = await postPets(
      new Request("http://localhost/api/pets", {
        method: "POST",
        headers: { "content-type": "application/json", ...auth("owner_1") },
        body: JSON.stringify({ name: "Luna", species: "cat" }),
      }),
    );
    expect(petRes.status).toBe(201);
    const { pet } = (await petRes.json()) as { pet: { id: string } };

    const followRes = await postFollows(
      new Request("http://localhost/api/follows", {
        method: "POST",
        headers: { "content-type": "application/json", ...auth("viewer_1") },
        body: JSON.stringify({ targetPetId: pet.id }),
      }),
    );
    expect(followRes.status).toBe(200);

    const postRes = await postPosts(
      new Request("http://localhost/api/posts", {
        method: "POST",
        headers: { "content-type": "application/json", ...auth("owner_1") },
        body: JSON.stringify({
          petId: pet.id,
          mediaType: "image",
          mediaUrl: "https://example.com/luna.jpg",
        }),
      }),
    );
    expect(postRes.status).toBe(201);

    const feedRes = await getFeed(
      new Request("http://localhost/api/feed", {
        headers: auth("viewer_1"),
      }),
    );
    expect(feedRes.status).toBe(200);
    const feed = (await feedRes.json()) as { items: unknown[] };
    expect(feed.items).toHaveLength(1);
  });

  it("GET /api/onboarding/hydration returns suggestions", async () => {
    await postPets(
      new Request("http://localhost/api/pets", {
        method: "POST",
        headers: { "content-type": "application/json", ...auth("a") },
        body: JSON.stringify({ name: "Nori", species: "cat" }),
      }),
    );
    const res = await getHydration(
      new Request("http://localhost/api/onboarding/hydration"),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      requiredFollowCount: number;
      suggestedPets: { name: string }[];
    };
    expect(body.requiredFollowCount).toBe(3);
    expect(body.suggestedPets.some((p) => p.name === "Nori")).toBe(true);
  });

  it("GET /api/feed rejects invalid cursor JSON", async () => {
    const res = await getFeed(
      new Request(
        "http://localhost/api/feed?cursor=not-json",
        { headers: auth("u1") },
      ),
    );
    expect(res.status).toBe(400);
  });
});
