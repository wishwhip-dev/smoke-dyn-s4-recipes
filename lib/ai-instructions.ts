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
export const AI_INSTRUCTIONS = {} as const satisfies Record<string, string>;

export type AiInstructionName = keyof typeof AI_INSTRUCTIONS;
