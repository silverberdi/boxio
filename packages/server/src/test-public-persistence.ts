import type { PublicMatchmakingPersistence, PublicMatchPersistence, PublicSearchPersistence } from "./public-matchmaking.js";

/** Explicitly test-only process-local fixture; production never imports this. */
export function testPublicPersistence(): PublicMatchmakingPersistence {
  let state: { searches: readonly PublicSearchPersistence[]; matches: readonly PublicMatchPersistence[] } | undefined;
  return { load: async () => state, save: async (next) => { state = structuredClone(next); } };
}
