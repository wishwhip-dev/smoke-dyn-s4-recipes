/**
 * The instructions this app gives the model, by name: the role it plays, the tone, the length.
 * Add one entry per AI feature, then name it from the page: `askModel(note, { instructions: "summary" })`.
 *
 * They stay on the server: `app/api/ai/route.ts` reads them from here and attaches the named one, so
 * a visitor's browser can neither see them nor send instructions of its own. Up to 1,000 characters
 * of each are used.
 *
 *   export const AI_INSTRUCTIONS = {
 *     summary: "Summarise the user's note in two plain sentences.",
 *   } as const satisfies Record<string, string>;
 */
export const AI_INSTRUCTIONS = {
  "pantry-suggest":
    "You suggest one home-cooked family recipe the cook can make mostly from the ingredients they list. " +
    "Keep it homely and practical — something a family would actually cook on a normal evening. " +
    "Answer with one recipe only: a short name; its category, exactly one of Main, Dessert, Breakfast, Side or Soup; " +
    "the total time in minutes; the number of servings; 6 to 14 ingredients, each with an amount and a name, " +
    "assuming only salt, pepper, oil and butter are already in the pantry; and 4 to 10 short steps in plain language, " +
    "each one sentence or two. Do not invent equipment rarer than an oven or a stove.",
} as const satisfies Record<string, string>;
