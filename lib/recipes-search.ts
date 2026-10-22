/**
 * Ingredient search, shared by the recipe box screen: the same parsing and matching everywhere, so
 * the count on a card and the list it sits in can never disagree.
 */
import type { Recipe } from "@/lib/db";

/** "chicken, garlic ,, eggs" → ["chicken", "garlic", "eggs"] — extra commas and blank terms go. */
export function parseSearchTerms(input: string): string[] {
  return input
    .split(",")
    .map((term) => term.trim().toLowerCase())
    .filter((term) => term.length > 0);
}

export type IngredientMatch = {
  /** How many of the typed terms this recipe's ingredient list contains. */
  matched: number;
  /** The typed terms it does not contain, in the order they were typed. */
  missing: string[];
};

/** Case-insensitive partial-word match over ingredient names: "cherr" finds "cherries". */
export function matchRecipe(recipe: Recipe, terms: string[]): IngredientMatch {
  const names = recipe.ingredients.map((ingredient) => ingredient.name.toLowerCase());
  const missing: string[] = [];
  let matched = 0;
  for (const term of terms) {
    if (names.some((name) => name.includes(term))) matched += 1;
    else missing.push(term);
  }
  return { matched, missing };
}

/** "45" → "45 min"; "100" → "1 hr 40 min". */
export function formatTime(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} hr` : `${hours} hr ${rest} min`;
}
