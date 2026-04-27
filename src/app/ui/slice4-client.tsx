"use client";

import { useMemo, useState } from "react";

type Pet = {
  id: string;
  ownerUserId: string;
  name: string;
  species: string;
  bio?: string;
};

type Post = {
  id: string;
  petId: string;
  mediaType: "image" | "video";
  mediaUrl: string;
  caption: string;
  createdAt: string;
};

type FeedResponse = {
  items: Post[];
  nextCursor?: { createdAt: string; id: string };
};

function headersFor(userId: string): HeadersInit {
  return {
    "content-type": "application/json",
    "x-clerk-user-id": userId.trim(),
  };
}

type StatusTone = "success" | "error" | "info";

export default function Slice4Client() {
  const [ownerId, setOwnerId] = useState("demo-owner-1");
  const [myPets, setMyPets] = useState<Pet[]>([]);
  const [feed, setFeed] = useState<Post[]>([]);
  const [message, setMessage] = useState("Use demo-owner-1 to get started.");
  const [statusTone, setStatusTone] = useState<StatusTone>("info");
  const [busyAction, setBusyAction] = useState("");

  const [petName, setPetName] = useState("");
  const [petSpecies, setPetSpecies] = useState("");
  const [petBio, setPetBio] = useState("");

  const [postPetId, setPostPetId] = useState("");
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [mediaUrl, setMediaUrl] = useState("");
  const [caption, setCaption] = useState("");

  const [followPetId, setFollowPetId] = useState("");
  const [petToEdit, setPetToEdit] = useState("");
  const [editName, setEditName] = useState("");
  const [editSpecies, setEditSpecies] = useState("");
  const [editBio, setEditBio] = useState("");

  const sortedPets = useMemo(
    () => [...myPets].sort((a, b) => a.name.localeCompare(b.name)),
    [myPets],
  );
  const ownerTrimmed = ownerId.trim();

  function setStatus(text: string, tone: StatusTone) {
    setMessage(text);
    setStatusTone(tone);
  }

  async function refreshPets() {
    if (!ownerTrimmed) {
      setStatus("Enter a user id first.", "error");
      return;
    }
    setBusyAction("pets");
    const res = await fetch("/api/pets", {
      headers: { "x-clerk-user-id": ownerTrimmed },
    });
    const body = await res.json();
    setBusyAction("");
    if (!res.ok) {
      throw new Error(body?.error?.message ?? "Failed to load pets");
    }
    setMyPets(body.pets ?? []);
    setStatus(`Loaded ${body.pets?.length ?? 0} pets.`, "info");
  }

  async function refreshFeed() {
    if (!ownerTrimmed) {
      setStatus("Enter a user id first.", "error");
      return;
    }
    setBusyAction("feed");
    const res = await fetch("/api/feed?limit=20", {
      headers: { "x-clerk-user-id": ownerTrimmed },
    });
    const body = (await res.json()) as FeedResponse & { error?: { message: string } };
    setBusyAction("");
    if (!res.ok) {
      throw new Error(body?.error?.message ?? "Failed to load feed");
    }
    setFeed(body.items ?? []);
    setStatus(`Loaded ${body.items?.length ?? 0} posts in feed.`, "info");
  }

  async function onCreatePet(e: React.FormEvent) {
    e.preventDefault();
    if (!ownerTrimmed) {
      setStatus("Enter a user id first.", "error");
      return;
    }
    setBusyAction("create-pet");
    try {
      const res = await fetch("/api/pets", {
        method: "POST",
        headers: headersFor(ownerTrimmed),
        body: JSON.stringify({
          name: petName.trim(),
          species: petSpecies.trim(),
          bio: petBio.trim() || undefined,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error?.message ?? "Create pet failed");
      setPetName("");
      setPetSpecies("");
      setPetBio("");
      await refreshPets();
      setStatus(`Created pet ${body.pet.name}.`, "success");
    } catch (error) {
      setStatus((error as Error).message, "error");
    } finally {
      setBusyAction("");
    }
  }

  async function onCreatePost(e: React.FormEvent) {
    e.preventDefault();
    if (!ownerTrimmed) {
      setStatus("Enter a user id first.", "error");
      return;
    }
    setBusyAction("create-post");
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: headersFor(ownerTrimmed),
        body: JSON.stringify({
          petId: postPetId,
          mediaType,
          mediaUrl: mediaUrl.trim(),
          caption: caption.trim(),
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error?.message ?? "Create post failed");
      await refreshFeed();
      setStatus(`Post published for pet ${body.post.petId}.`, "success");
      setMediaUrl("");
      setCaption("");
    } catch (error) {
      setStatus((error as Error).message, "error");
    } finally {
      setBusyAction("");
    }
  }

  async function onFollow(e: React.FormEvent) {
    e.preventDefault();
    if (!ownerTrimmed) {
      setStatus("Enter a user id first.", "error");
      return;
    }
    setBusyAction("follow");
    try {
      const res = await fetch("/api/follows", {
        method: "POST",
        headers: headersFor(ownerTrimmed),
        body: JSON.stringify({ petId: followPetId.trim() }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error?.message ?? "Follow failed");
      await refreshFeed();
      setStatus(`Now following ${body.follow.targetPetId}.`, "success");
      setFollowPetId("");
    } catch (error) {
      setStatus((error as Error).message, "error");
    } finally {
      setBusyAction("");
    }
  }

  async function onUnfollow(petId: string) {
    if (!ownerTrimmed) {
      setStatus("Enter a user id first.", "error");
      return;
    }
    setBusyAction("unfollow");
    try {
      const res = await fetch(`/api/follows/${petId}`, {
        method: "DELETE",
        headers: { "x-clerk-user-id": ownerTrimmed },
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error?.message ?? "Unfollow failed");
      await refreshFeed();
      setStatus(`Unfollowed ${body.unfollowed.targetPetId}.`, "success");
    } catch (error) {
      setStatus((error as Error).message, "error");
    } finally {
      setBusyAction("");
    }
  }

  async function onUpdatePet(e: React.FormEvent) {
    e.preventDefault();
    if (!ownerTrimmed) {
      setStatus("Enter a user id first.", "error");
      return;
    }
    if (!petToEdit) {
      setStatus("Choose a pet to update.", "error");
      return;
    }
    setBusyAction("update-pet");
    try {
      const payload: Record<string, string> = {};
      if (editName.trim()) payload.name = editName.trim();
      if (editSpecies.trim()) payload.species = editSpecies.trim();
      if (editBio.trim()) payload.bio = editBio.trim();
      const res = await fetch(`/api/pets/${petToEdit}`, {
        method: "PATCH",
        headers: headersFor(ownerTrimmed),
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error?.message ?? "Update pet failed");
      await refreshPets();
      setStatus(`Updated pet ${body.pet.name}.`, "success");
      setEditName("");
      setEditSpecies("");
      setEditBio("");
    } catch (error) {
      setStatus((error as Error).message, "error");
    } finally {
      setBusyAction("");
    }
  }

  async function onDeletePet(petId: string) {
    if (!ownerTrimmed) {
      setStatus("Enter a user id first.", "error");
      return;
    }
    setBusyAction("delete-pet");
    try {
      const res = await fetch(`/api/pets/${petId}`, {
        method: "DELETE",
        headers: { "x-clerk-user-id": ownerTrimmed },
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error?.message ?? "Delete pet failed");
      await refreshPets();
      await refreshFeed();
      setStatus(`Deleted pet ${body.deleted.name}.`, "success");
      if (petToEdit === petId) setPetToEdit("");
    } catch (error) {
      setStatus((error as Error).message, "error");
    } finally {
      setBusyAction("");
    }
  }

  return (
    <section style={{ display: "grid", gap: 16, marginTop: 24, maxWidth: 980 }}>
      <div
        style={{
          background: "#f5f7ff",
          border: "1px solid #dbe1ff",
          padding: 12,
          borderRadius: 10,
        }}
      >
        <strong>Slice 4 MVP UI</strong>
        <p style={{ margin: "8px 0 0 0", color: "#4b5563" }}>
          This is a working product shell for manual browser testing against your
          real API.
        </p>
      </div>

      <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
        Acting as user
        <input
          value={ownerId}
          onChange={(e) => setOwnerId(e.target.value)}
          style={{ minWidth: 280 }}
        />
      </label>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button disabled={busyAction !== ""} onClick={() => void refreshPets()}>
          {busyAction === "pets" ? "Loading Pets..." : "Load My Pets"}
        </button>
        <button disabled={busyAction !== ""} onClick={() => void refreshFeed()}>
          {busyAction === "feed" ? "Loading Feed..." : "Load My Feed"}
        </button>
      </div>

      <form
        onSubmit={onCreatePet}
        style={{
          display: "grid",
          gap: 8,
          padding: 12,
          border: "1px solid #e5e7eb",
          borderRadius: 10,
        }}
      >
        <h2>Create Pet</h2>
        <input
          placeholder="Name"
          value={petName}
          onChange={(e) => setPetName(e.target.value)}
          required
        />
        <input
          placeholder="Species"
          value={petSpecies}
          onChange={(e) => setPetSpecies(e.target.value)}
          required
        />
        <input
          placeholder="Bio (optional)"
          value={petBio}
          onChange={(e) => setPetBio(e.target.value)}
        />
        <button
          type="submit"
          disabled={busyAction !== "" || !petName.trim() || !petSpecies.trim()}
        >
          {busyAction === "create-pet" ? "Creating..." : "Create Pet"}
        </button>
      </form>

      <form
        onSubmit={onUpdatePet}
        style={{
          display: "grid",
          gap: 8,
          padding: 12,
          border: "1px solid #e5e7eb",
          borderRadius: 10,
        }}
      >
        <h2>Update Pet</h2>
        <select
          value={petToEdit}
          onChange={(e) => setPetToEdit(e.target.value)}
          required
        >
          <option value="">Select pet</option>
          {sortedPets.map((pet) => (
            <option key={pet.id} value={pet.id}>
              {pet.name} ({pet.species})
            </option>
          ))}
        </select>
        <input
          placeholder="New name (optional)"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
        />
        <input
          placeholder="New species (optional)"
          value={editSpecies}
          onChange={(e) => setEditSpecies(e.target.value)}
        />
        <input
          placeholder="New bio (optional)"
          value={editBio}
          onChange={(e) => setEditBio(e.target.value)}
        />
        <button
          type="submit"
          disabled={busyAction !== "" || !petToEdit}
        >
          {busyAction === "update-pet" ? "Updating..." : "Update Pet"}
        </button>
      </form>

      <form
        onSubmit={onFollow}
        style={{
          display: "grid",
          gap: 8,
          padding: 12,
          border: "1px solid #e5e7eb",
          borderRadius: 10,
        }}
      >
        <h2>Follow Pet By ID</h2>
        <input
          placeholder="pet_xxxxxxxx"
          value={followPetId}
          onChange={(e) => setFollowPetId(e.target.value)}
          required
        />
        <div style={{ display: "flex", gap: 8 }}>
          <button type="submit" disabled={busyAction !== "" || !followPetId.trim()}>
            {busyAction === "follow" ? "Following..." : "Follow"}
          </button>
          <button
            type="button"
            disabled={busyAction !== "" || !followPetId.trim()}
            onClick={() => void onUnfollow(followPetId.trim())}
          >
            {busyAction === "unfollow" ? "Unfollowing..." : "Unfollow"}
          </button>
        </div>
      </form>

      <form
        onSubmit={onCreatePost}
        style={{
          display: "grid",
          gap: 8,
          padding: 12,
          border: "1px solid #e5e7eb",
          borderRadius: 10,
        }}
      >
        <h2>Create Post</h2>
        <select
          value={postPetId}
          onChange={(e) => setPostPetId(e.target.value)}
          required
        >
          <option value="">Select your pet</option>
          {sortedPets.map((pet) => (
            <option key={pet.id} value={pet.id}>
              {pet.name} ({pet.species})
            </option>
          ))}
        </select>
        <select
          value={mediaType}
          onChange={(e) => setMediaType(e.target.value as "image" | "video")}
        >
          <option value="image">image</option>
          <option value="video">video</option>
        </select>
        <input
          placeholder="https://example.com/media.jpg"
          value={mediaUrl}
          onChange={(e) => setMediaUrl(e.target.value)}
          required
        />
        <input
          placeholder="Caption"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
        />
        <button
          type="submit"
          disabled={busyAction !== "" || !postPetId || !mediaUrl.trim()}
        >
          {busyAction === "create-post" ? "Publishing..." : "Create Post"}
        </button>
      </form>

      {message ? (
        <p
          style={{
            color:
              statusTone === "error"
                ? "#b91c1c"
                : statusTone === "success"
                  ? "#166534"
                  : "#4b5563",
            margin: 0,
          }}
        >
          {message}
        </p>
      ) : null}

      <section
        style={{
          padding: 12,
          border: "1px solid #e5e7eb",
          borderRadius: 10,
        }}
      >
        <h2>My Pets</h2>
        {!sortedPets.length ? <p>No pets yet.</p> : null}
        <ul style={{ margin: 0 }}>
          {sortedPets.map((pet) => (
            <li key={pet.id}>
              <strong>{pet.name}</strong> ({pet.species}) - <code>{pet.id}</code>
              {pet.bio ? ` - ${pet.bio}` : ""}
              {" "}
              <button
                type="button"
                onClick={() => void onDeletePet(pet.id)}
                disabled={busyAction !== ""}
              >
                {busyAction === "delete-pet" ? "Deleting..." : "Delete"}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section
        style={{
          padding: 12,
          border: "1px solid #e5e7eb",
          borderRadius: 10,
        }}
      >
        <h2>Feed</h2>
        {!feed.length ? <p>No feed posts yet. Follow a pet and refresh feed.</p> : null}
        <ul style={{ margin: 0 }}>
          {feed.map((post) => (
            <li key={post.id}>
              <code>{post.petId}</code> - {post.mediaType} -{" "}
              <a href={post.mediaUrl} target="_blank" rel="noreferrer">
                media
              </a>{" "}
              {post.caption ? `- ${post.caption}` : ""}
            </li>
          ))}
        </ul>
      </section>
    </section>
  );
}
