import { getStore } from "./store";
import type { Pet } from "./types";

export interface HydrationResult {
  requiredFollowCount: number;
  suggestedPets: Pet[];
}

export async function getHydrationSuggestions(
  limit = 5,
): Promise<HydrationResult> {
  const store = await getStore();
  const pets = (await store.listPets())
    .slice()
    .sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1))
    .slice(0, Math.max(limit, 0));

  return {
    requiredFollowCount: 3,
    suggestedPets: pets,
  };
}
