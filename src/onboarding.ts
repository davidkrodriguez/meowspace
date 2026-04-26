import { getStore } from "./store";
import type { Pet } from "./types";

export interface HydrationResult {
  requiredFollowCount: number;
  suggestedPets: Pet[];
}

export function getHydrationSuggestions(limit = 5): HydrationResult {
  const pets = getStore()
    .pets
    .slice()
    .sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1))
    .slice(0, Math.max(limit, 0));

  return {
    requiredFollowCount: 3,
    suggestedPets: pets,
  };
}
