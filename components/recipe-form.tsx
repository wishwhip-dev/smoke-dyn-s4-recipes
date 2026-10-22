"use client";

/**
 * The one recipe form, used for adding and for editing. Rows can be added and removed for both
 * ingredients and steps; submitting without a name, an ingredient (amount or name) or a step shows
 * an inline message on that field and saves nothing.
 *
 * The parent owns the dialog: `onSubmit` is awaited — while it runs the button says "Saving…" —
 * and the parent closes only after the write has actually succeeded, so a failed save never
 * throws a filled-in form away.
 */
import { useId, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CATEGORIES, newId, type Category, type Ingredient, type Recipe } from "@/lib/db";

type IngredientRow = { rowId: string; amount: string; name: string };
type StepRow = { rowId: string; text: string };

/** What a save produces: everything but the id and the timestamps, which the data layer stamps. */
export type RecipeDraft = Omit<Recipe, "id" | "updatedAt">;

type FieldErrors = {
  name?: string;
  servings?: string;
  time?: string;
  ingredients?: string;
  steps?: string;
};

const makeIngredientRow = (ingredient?: Ingredient): IngredientRow => ({
  rowId: newId(),
  amount: ingredient?.amount ?? "",
  name: ingredient?.name ?? "",
});
const makeStepRow = (text?: string): StepRow => ({ rowId: newId(), text: text ?? "" });

export function RecipeForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  /** Fills the form for an edit; absent for a new recipe. */
  initial?: Recipe;
  submitLabel: string;
  /** Returns once the recipe is stored. Rejecting (or returning with the dialog open) keeps the form. */
  onSubmit: (draft: RecipeDraft) => Promise<void>;
  onCancel: () => void;
}) {
  const uid = useId();
  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState<Category>(initial?.category ?? "Main");
  const [servings, setServings] = useState(initial ? String(initial.servings) : "");
  const [time, setTime] = useState(initial ? String(initial.timeMinutes) : "");
  const [ingredientRows, setIngredientRows] = useState<IngredientRow[]>(
    initial?.ingredients.length ? initial.ingredients.map(makeIngredientRow) : [makeIngredientRow()],
  );
  const [stepRows, setStepRows] = useState<StepRow[]>(
    initial?.steps.length ? initial.steps.map(makeStepRow) : [makeStepRow()],
  );
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);

  const setIngredient = (rowId: string, patch: Partial<Omit<IngredientRow, "rowId">>) => {
    setIngredientRows((rows) => rows.map((row) => (row.rowId === rowId ? { ...row, ...patch } : row)));
  };
  const removeIngredient = (rowId: string) => {
    setIngredientRows((rows) => rows.filter((row) => row.rowId !== rowId));
  };
  const setStep = (rowId: string, text: string) => {
    setStepRows((rows) => rows.map((row) => (row.rowId === rowId ? { ...row, text } : row)));
  };
  const removeStep = (rowId: string) => {
    setStepRows((rows) => rows.filter((row) => row.rowId !== rowId));
  };

  /** A whole-number count of plates; an empty field is a missing field, not a zero. */
  const parseCount = (value: string): number | null => {
    const trimmed = value.trim();
    if (!/^\d+$/.test(trimmed)) return null;
    const parsed = Number(trimmed);
    return parsed > 0 ? parsed : null;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next: FieldErrors = {};
    if (!name.trim()) next.name = "Give the recipe a name.";
    const parsedServings = parseCount(servings);
    if (parsedServings === null) next.servings = "How many servings? A whole number above 0.";
    const parsedTime = parseCount(time);
    if (parsedTime === null) next.time = "Total time in minutes, above 0.";
    if (ingredientRows.some((row) => !row.amount.trim() || !row.name.trim())) {
      next.ingredients = "Every ingredient needs an amount and a name.";
    }
    if (stepRows.some((row) => !row.text.trim())) {
      next.steps = "Each step needs text — or remove the empty ones.";
    }
    setErrors(next);
    if (Object.keys(next).length > 0 || parsedServings === null || parsedTime === null) return;

    const draft: RecipeDraft = {
      name: name.trim(),
      category,
      servings: parsedServings,
      timeMinutes: parsedTime,
      ingredients: ingredientRows.map((row) => ({ amount: row.amount.trim(), name: row.name.trim() })),
      steps: stepRows.map((row) => row.text.trim()),
    };
    setSaving(true);
    try {
      await onSubmit(draft);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor={`${uid}-name`}>Name</Label>
          <Input
            id={`${uid}-name`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Grandma's cherry pie"
            aria-invalid={!!errors.name}
            autoFocus
          />
          {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`${uid}-category`}>Category</Label>
          <Select value={category} onValueChange={(value) => setCategory(value as Category)}>
            <SelectTrigger id={`${uid}-category`} className="w-full">
              <SelectValue placeholder="Pick a category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Label htmlFor={`${uid}-servings`}>Servings</Label>
            <Input
              id={`${uid}-servings`}
              inputMode="numeric"
              value={servings}
              onChange={(e) => setServings(e.target.value)}
              placeholder="4"
              aria-invalid={!!errors.servings}
            />
            {errors.servings && <p className="text-sm text-destructive">{errors.servings}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`${uid}-time`}>Time (min)</Label>
            <Input
              id={`${uid}-time`}
              inputMode="numeric"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              placeholder="45"
              aria-invalid={!!errors.time}
            />
            {errors.time && <p className="text-sm text-destructive">{errors.time}</p>}
          </div>
        </div>
      </div>

      <fieldset className="grid gap-2">
        <legend className="text-sm font-medium">Ingredients</legend>
        {ingredientRows.map((row, index) => (
          <div key={row.rowId} className="flex items-start gap-2">
            <div className="grid min-w-0 flex-[2] gap-0.5">
              <Label htmlFor={`${uid}-amt-${row.rowId}`} className="sr-only">
                {`Ingredient ${index + 1} amount`}
              </Label>
              <Input
                id={`${uid}-amt-${row.rowId}`}
                value={row.amount}
                onChange={(e) => setIngredient(row.rowId, { amount: e.target.value })}
                placeholder="2 cups"
                aria-invalid={!!errors.ingredients && (!row.amount.trim() || !row.name.trim())}
              />
            </div>
            <div className="grid min-w-0 flex-[3] gap-0.5">
              <Label htmlFor={`${uid}-ing-${row.rowId}`} className="sr-only">
                {`Ingredient ${index + 1} name`}
              </Label>
              <Input
                id={`${uid}-ing-${row.rowId}`}
                value={row.name}
                onChange={(e) => setIngredient(row.rowId, { name: e.target.value })}
                placeholder="flour"
                aria-invalid={!!errors.ingredients && (!row.amount.trim() || !row.name.trim())}
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeIngredient(row.rowId)}
              aria-label={`Remove ingredient ${index + 1}`}
              className="text-muted-foreground"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {errors.ingredients && <p className="text-sm text-destructive">{errors.ingredients}</p>}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="self-start"
          onClick={() => setIngredientRows((rows) => [...rows, makeIngredientRow()])}
        >
          <Plus className="h-4 w-4" /> Add ingredient
        </Button>
      </fieldset>

      <fieldset className="grid gap-2">
        <legend className="text-sm font-medium">Steps</legend>
        {stepRows.map((row, index) => (
          <div key={row.rowId} className="flex items-start gap-2">
            <div className="grid min-w-0 flex-1 gap-0.5">
              <Label htmlFor={`${uid}-step-${row.rowId}`} className="sr-only">
                {`Step ${index + 1}`}
              </Label>
              <Textarea
                id={`${uid}-step-${row.rowId}`}
                value={row.text}
                onChange={(e) => setStep(row.rowId, e.target.value)}
                placeholder={`Step ${index + 1}: heat the oven…`}
                rows={2}
                aria-invalid={!!errors.steps && !row.text.trim()}
                className="min-h-16"
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeStep(row.rowId)}
              aria-label={`Remove step ${index + 1}`}
              className="text-muted-foreground"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {errors.steps && <p className="text-sm text-destructive">{errors.steps}</p>}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="self-start"
          onClick={() => setStepRows((rows) => [...rows, makeStepRow()])}
        >
          <Plus className="h-4 w-4" /> Add step
        </Button>
      </fieldset>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
