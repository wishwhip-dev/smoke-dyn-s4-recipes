"use client";

/**
 * The pantry helper: list what's in the pantry, and the assistant suggests one recipe from it.
 *
 * This is a helper, not the core — the box works entirely without it. The ask happens only on the
 * button press, every state is text on the page ("Thinking…", the failure's own message), and a
 * failed ask keeps what was typed so it can be retried. A suggestion the model returns is checked
 * against the shape the page is built on before it is shown, and only "Add this recipe" puts it in
 * the box — nothing is saved on the model's say-so alone.
 */
import { useMemo, useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { AI_PRIVACY_NOTE, useAsk } from "@/lib/ai";
import { CATEGORIES, type Category, type Ingredient, type Recipe } from "@/lib/db";
import { addRecipe } from "@/lib/data/recipes";
import { formatTime } from "@/lib/recipes-search";

/** The shape the page is built against — the example the model answers in. */
const EXAMPLE = {
  name: "Skillet tomato gnocchi",
  category: "Main",
  timeMinutes: 30,
  servings: 4,
  ingredients: [
    { amount: "500 g", name: "shelf-stable gnocchi" },
    { amount: "400 g", name: "chopped tomatoes" },
    { amount: "2", name: "garlic cloves" },
    { amount: "1", name: "small onion" },
    { amount: "100 g", name: "baby spinach" },
    { amount: "60 ml", name: "cream" },
    { amount: "40 g", name: "parmesan, grated" },
    { amount: "1 tsp", name: "dried oregano" },
  ],
  steps: [
    "Soften the chopped onion and garlic in a little oil in a wide skillet, about 5 minutes.",
    "Add the tomatoes and oregano and simmer for 5 minutes until saucy.",
    "Stir in the gnocchi and the cream, cover, and cook for 5 minutes.",
    "Fold in the spinach until it wilts, season to taste and finish with the parmesan.",
  ],
};

type Suggestion = {
  name: string;
  category: Category;
  timeMinutes: number;
  servings: number;
  ingredients: Ingredient[];
  steps: string[];
};

/** A whole count above zero; anything the model left blank or garbled falls back sensibly. */
const positiveNumber = (value: unknown, fallback: number): number => {
  const parsed = typeof value === "number"
    ? value
    : typeof value === "string" && value.trim() !== ""
      ? Number(value)
      : Number.NaN;
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : fallback;
};

/** Check the model's answer against the shape the page is built on; null when it does not fit. */
function parseSuggestion(data: unknown): Suggestion | null {
  if (typeof data !== "object" || data === null) return null;
  const raw = data as Record<string, unknown>;
  const name = typeof raw.name === "string" ? raw.name.trim() : "";
  if (!name) return null;
  const category = CATEGORIES.find(
    (option) => option.toLowerCase() === String(raw.category ?? "").trim().toLowerCase(),
  ) ?? "Main";
  const ingredients: Ingredient[] = Array.isArray(raw.ingredients)
    ? raw.ingredients.flatMap((item): Ingredient[] => {
        if (typeof item !== "object" || item === null) return [];
        const entry = item as Record<string, unknown>;
        const ingredientName = typeof entry.name === "string" ? entry.name.trim() : "";
        if (!ingredientName) return [];
        const amount = typeof entry.amount === "string"
          ? entry.amount.trim()
          : typeof entry.amount === "number"
            ? String(entry.amount)
            : "";
        return [{ amount, name: ingredientName }];
      })
    : [];
  if (ingredients.length === 0) return null;
  const steps: string[] = Array.isArray(raw.steps)
    ? raw.steps.flatMap((step) => (typeof step === "string" && step.trim() ? [step.trim()] : []))
    : [];
  if (steps.length === 0) return null;
  return {
    name,
    category,
    timeMinutes: positiveNumber(raw.timeMinutes, 30),
    servings: positiveNumber(raw.servings, 4),
    ingredients,
    steps,
  };
}

export function PantrySuggest({ recipes }: { recipes: Recipe[] }) {
  const { ask, status, statusText, busy } = useAsk();
  const [pantry, setPantry] = useState("");
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [addedId, setAddedId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  // The model's answer is kept in state and shown again; a re-ask costs a call, so the button
  // stays but the answer is not thrown away until a new one arrives.
  const alreadyInBox = useMemo(() => {
    if (!suggestion) return undefined;
    const wanted = suggestion.name.trim().toLowerCase();
    return recipes.find((recipe) => recipe.name.trim().toLowerCase() === wanted);
  }, [suggestion, recipes]);

  const askForSuggestion = async () => {
    const trimmed = pantry.trim();
    if (!trimmed || busy) return;
    setSuggestion(null);
    setAddedId(null);
    const result = await ask(
      `Here is what's in my pantry: ${trimmed}. Suggest one recipe I could cook mostly from these; you may add ordinary staples.`,
      { instructions: "pantry-suggest", json: true, example: EXAMPLE, maxTokens: 900 },
    );
    if (result.ok) setSuggestion(parseSuggestion(result.data));
  };

  const addSuggestion = async () => {
    if (!suggestion) return;
    setAdding(true);
    try {
      const id = await addRecipe(suggestion);
      setAddedId(id);
      toast.success(`“${suggestion.name}” added to the box`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the recipe");
    } finally {
      setAdding(false);
    }
  };

  const failing = !busy && !suggestion && status !== "idle";
  const unreadable = status === "done" && !suggestion;

  return (
    <Card>
      <CardContent className="grid gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Sparkles className="h-4 w-4 text-muted-foreground" aria-hidden />
            Pantry helper
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            List what you have and the assistant suggests a recipe from it — a helper on top of the
            box, which works without it.
          </p>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void askForSuggestion();
          }}
          className="grid gap-2"
        >
          <Label htmlFor="pantry-input">What&apos;s in your pantry?</Label>
          <Input
            id="pantry-input"
            value={pantry}
            onChange={(event) => setPantry(event.target.value)}
            placeholder="e.g. chicken thighs, rice, a lemon — separate with commas"
            enterKeyHint="send"
          />
          <Button type="submit" className="self-start" disabled={busy || !pantry.trim()}>
            {busy ? "Thinking…" : "Suggest a recipe"}
          </Button>
          <p className="text-xs text-muted-foreground">{AI_PRIVACY_NOTE}</p>
        </form>

        {(busy || failing || unreadable) && (
          <p role="status" aria-live="polite" className="text-sm text-muted-foreground">
            {busy ? statusText : unreadable ? "The suggestion came back unreadable. Try again." : statusText}
          </p>
        )}

        {busy && (
          <div className="grid gap-2" aria-hidden>
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        )}

        {suggestion && (
          <div className="grid gap-3 rounded-xl border bg-background p-4">
            <div>
              <h3 className="text-base font-semibold">{suggestion.name}</h3>
              <p className="text-sm text-muted-foreground">
                {suggestion.category} · {formatTime(suggestion.timeMinutes)} · {suggestion.servings}{" "}
                {suggestion.servings === 1 ? "serving" : "servings"}
              </p>
            </div>
            <div className="grid gap-1">
              <p className="text-sm font-medium">Ingredients</p>
              <ul className="grid gap-0.5 text-sm text-muted-foreground">
                {suggestion.ingredients.map((ingredient, index) => (
                  <li key={`${ingredient.name}-${index}`}>
                    {ingredient.amount ? `${ingredient.amount} — ` : ""}
                    {ingredient.name}
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid gap-1">
              <p className="text-sm font-medium">Steps</p>
              <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
                {suggestion.steps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            </div>

            {addedId ? (
              <p className="text-sm text-muted-foreground">
                Added to the box.{" "}
                <Link href={`/recipes/${addedId}`} className="font-medium text-foreground underline underline-offset-4">
                  Open it
                </Link>
              </p>
            ) : alreadyInBox ? (
              <p className="text-sm text-muted-foreground">
                This one is already in your box.{" "}
                <Link
                  href={`/recipes/${alreadyInBox.id}`}
                  className="font-medium text-foreground underline underline-offset-4"
                >
                  Open it
                </Link>
              </p>
            ) : (
              <Button className="self-start" onClick={() => void addSuggestion()} disabled={adding}>
                {adding ? "Adding…" : "Add this recipe"}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}