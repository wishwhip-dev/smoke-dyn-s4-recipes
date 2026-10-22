/**
 * This application's database.
 *
 * The reusable half of the setup is in `lib/storage/` and is not edited. This file is the half
 * that describes the product: which tables exist, what is indexed, how the schema has changed over
 * time, and what a first visit starts with.
 *
 * This is the first release, so version 1 is the recipe box itself; there is no migration history
 * to carry.
 */
import { defineDatabase } from "@/lib/storage/database";
import { SEED_RECIPES } from "@/lib/data/seed-recipes";

/** The five categories a recipe can sit in. */
export const CATEGORIES = ["Main", "Dessert", "Breakfast", "Side", "Soup"] as const;
export type Category = (typeof CATEGORIES)[number];

/** One line of an ingredient list: the quantity and the thing itself, as typed on the card. */
export type Ingredient = {
  /** e.g. "2 cups", "1 tbsp", "3" — kept as text so fractions and ranges survive. */
  amount: string;
  /** e.g. "flour", "cherries", "pitted". */
  name: string;
};

export type Recipe = {
  id: string;
  name: string;
  category: Category;
  /** Total time in minutes. */
  timeMinutes: number;
  servings: number;
  ingredients: Ingredient[];
  /** Ordered; step 1 is steps[0]. */
  steps: string[];
  /** Epoch millis. Indexed, because the list is ordered newest-first. */
  updatedAt: number;
};

/** Ids are generated here so the data layer never depends on an auto-increment round trip. */
export function newId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export const database = defineDatabase<{ recipes: Recipe }>({
  // Part of the origin's storage identity. Renaming it does not migrate anything — it points the
  // application at a different, empty database and abandons the old one in place. That is exactly
  // what you want on a first build, and never what you want afterwards.
  name: "family-recipe-box",
  versions: [
    // Only the primary key and the properties queried on. The category filter is done in memory
    // over the whole list (a recipe box is small), so only `updatedAt` is indexed.
    { version: 1, stores: { recipes: "id, updatedAt" } },
  ],
  // Written once, inside `ready()`, in one transaction with its own marker. Do not hand-roll this:
  // no `meta` table, no flag, no promise to dedupe a double mount — see `docs/storage.md`.
  seed: {
    tables: ["recipes"],
    run: async (db) => { await db.recipes.bulkAdd(SEED_RECIPES); },
  },
});
