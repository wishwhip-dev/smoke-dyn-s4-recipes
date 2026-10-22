/**
 * This app's recipe queries. Components call these, never Dexie directly — see `docs/storage.md`.
 */
import { database, newId, type Recipe } from "@/lib/db";

const recipes = async () => (await database.ready()).recipes;

/** The whole box, newest change first. */
export async function listRecipes(): Promise<Recipe[]> {
  return (await recipes()).orderBy("updatedAt").reverse().toArray();
}

/** One recipe, or undefined when the id is unknown. */
export async function getRecipe(id: string): Promise<Recipe | undefined> {
  return (await recipes()).get(id);
}

/** Insert a new recipe. The id is generated here and returned. */
export async function addRecipe(recipe: Omit<Recipe, "id" | "updatedAt">): Promise<string> {
  const id = newId();
  const full: Recipe = { ...recipe, id, updatedAt: Date.now() };
  try {
    await (await recipes()).put(full);
  } catch (error) {
    throw new Error(`Could not save “${recipe.name}”: ${error instanceof Error ? error.message : "storage failed"}`);
  }
  return id;
}

/** Overwrite an existing recipe, stamping the change time. */
export async function updateRecipe(recipe: Recipe): Promise<void> {
  const withStamp: Recipe = { ...recipe, updatedAt: Date.now() };
  try {
    await (await recipes()).put(withStamp);
  } catch (error) {
    throw new Error(`Could not save “${recipe.name}”: ${error instanceof Error ? error.message : "storage failed"}`);
  }
}

export async function deleteRecipe(id: string): Promise<void> {
  await (await recipes()).delete(id);
}
