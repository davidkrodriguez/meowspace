export type MediaType = "image" | "video";

export interface User {
  id: string;
  clerkId: string;
  createdAt: string;
}

export interface Pet {
  id: string;
  ownerUserId: string;
  name: string;
  species: string;
  avatarUrl?: string;
  bio?: string;
  createdAt: string;
}

export interface Post {
  id: string;
  petId: string;
  mediaType: MediaType;
  mediaUrl: string;
  caption: string;
  createdAt: string;
}

export interface Follow {
  id: string;
  followerUserId: string;
  targetPetId: string;
  createdAt: string;
}

export interface Cursor {
  createdAt: string;
  id: string;
}
