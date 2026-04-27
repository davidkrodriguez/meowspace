import { describe, expect, it, beforeEach } from "vitest";
import { resetStore } from "./store";
import { GET as getFeed } from "./app/api/feed/route";
import { POST as postFollows } from "./app/api/follows/route";
import { DELETE as deleteFollowByPetId } from "./app/api/follows/[petId]/route";
import { GET as getPets, POST as postPets } from "./app/api/pets/route";
import {
  DELETE as deletePetById,
  GET as getPetById,
  PATCH as patchPetById,
} from "./app/api/pets/[petId]/route";
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

  it("GET /api/pets/:id returns pet and 404 for missing pet", async () => {
    const petRes = await postPets(
      new Request("http://localhost/api/pets", {
        method: "POST",
        headers: { "content-type": "application/json", ...auth("owner_2") },
        body: JSON.stringify({ name: "Milo", species: "cat" }),
      }),
    );
    const { pet } = (await petRes.json()) as { pet: { id: string } };

    const ok = await getPetById(
      new Request(`http://localhost/api/pets/${pet.id}`, {
        headers: auth("viewer_2"),
      }),
      { params: { petId: pet.id } },
    );
    expect(ok.status).toBe(200);

    const missing = await getPetById(
      new Request("http://localhost/api/pets/pet_missing", {
        headers: auth("viewer_2"),
      }),
      { params: { petId: "pet_missing" } },
    );
    expect(missing.status).toBe(404);
  });

  it("DELETE /api/follows/:petId unfollows existing follow", async () => {
    const petRes = await postPets(
      new Request("http://localhost/api/pets", {
        method: "POST",
        headers: { "content-type": "application/json", ...auth("owner_3") },
        body: JSON.stringify({ name: "Nori", species: "cat" }),
      }),
    );
    const { pet } = (await petRes.json()) as { pet: { id: string } };

    await postFollows(
      new Request("http://localhost/api/follows", {
        method: "POST",
        headers: { "content-type": "application/json", ...auth("viewer_3") },
        body: JSON.stringify({ targetPetId: pet.id }),
      }),
    );

    const deleted = await deleteFollowByPetId(
      new Request(`http://localhost/api/follows/${pet.id}`, {
        method: "DELETE",
        headers: auth("viewer_3"),
      }),
      { params: { petId: pet.id } },
    );
    expect(deleted.status).toBe(200);

    const deletedAgain = await deleteFollowByPetId(
      new Request(`http://localhost/api/follows/${pet.id}`, {
        method: "DELETE",
        headers: auth("viewer_3"),
      }),
      { params: { petId: pet.id } },
    );
    expect(deletedAgain.status).toBe(404);
  });

  it("PATCH and DELETE /api/pets/:petId enforce ownership", async () => {
    const petRes = await postPets(
      new Request("http://localhost/api/pets", {
        method: "POST",
        headers: { "content-type": "application/json", ...auth("owner_4") },
        body: JSON.stringify({ name: "Maple", species: "cat" }),
      }),
    );
    const { pet } = (await petRes.json()) as { pet: { id: string } };

    const forbiddenPatch = await patchPetById(
      new Request(`http://localhost/api/pets/${pet.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json", ...auth("viewer_4") },
        body: JSON.stringify({ name: "Nope" }),
      }),
      { params: { petId: pet.id } },
    );
    expect(forbiddenPatch.status).toBe(403);

    const patched = await patchPetById(
      new Request(`http://localhost/api/pets/${pet.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json", ...auth("owner_4") },
        body: JSON.stringify({ name: "Maple Prime" }),
      }),
      { params: { petId: pet.id } },
    );
    expect(patched.status).toBe(200);

    const deleted = await deletePetById(
      new Request(`http://localhost/api/pets/${pet.id}`, {
        method: "DELETE",
        headers: auth("owner_4"),
      }),
      { params: { petId: pet.id } },
    );
    expect(deleted.status).toBe(200);

    const missing = await getPetById(
      new Request(`http://localhost/api/pets/${pet.id}`, {
        headers: auth("owner_4"),
      }),
      { params: { petId: pet.id } },
    );
    expect(missing.status).toBe(404);
  });
});
