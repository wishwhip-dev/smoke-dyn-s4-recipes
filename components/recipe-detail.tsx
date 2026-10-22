"use client";

/**
 * One recipe, opened either from the box or straight by its URL. Everything is read from the
 * browser database; an unknown id gets a "recipe not found" message with a way back, not an error.
 */
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock, Users } from "lucide-react";
import { toast } from "sonner";
import { ShareButton } from "@/components/share-button";
import { RecipeForm, type RecipeDraft } from "@/components/recipe-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { database, type Recipe } from "@/lib/db";
import { deleteRecipe, getRecipe, updateRecipe } from "@/lib/data/recipes";
import { formatTime } from "@/lib/recipes-search";
import { renderShareCard } from "@/lib/share";
import { useStorageStatus, useStoredQuery } from "@/lib/storage/react";

export function RecipeDetail({ id }: { id: string }) {
  const router = useRouter();
  const { data: recipe, isLoading } = useStoredQuery(database, () => getRecipe(id), [id]);
  const storageStatus = useStorageStatus(database);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleEdit = async (draft: RecipeDraft) => {
    if (!recipe) return;
    try {
      await updateRecipe({ ...recipe, ...draft });
      toast.success(`“${draft.name}” updated`);
      setEditOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the recipe");
    }
  };

  const handleDelete = async () => {
    if (!recipe) return;
    setDeleting(true);
    try {
      await deleteRecipe(recipe.id);
      toast(`“${recipe.name}” deleted from the box`);
      router.push("/");
    } catch (error) {
      // Still here, so say so and leave the dialog usable.
      toast.error(error instanceof Error ? error.message : "Could not delete the recipe");
      setDeleting(false);
    }
  };

  const shareLines = useMemo(() => {
    if (!recipe) return [];
    return [
      `${recipe.category} · ${formatTime(recipe.timeMinutes)} · ${recipe.servings} servings`,
      "",
      "Ingredients",
      ...recipe.ingredients.map((ingredient) => `• ${ingredient.amount} ${ingredient.name}`.trim()),
      "",
      "Steps",
      ...recipe.steps.map((step, index) => `${index + 1}. ${step}`),
    ];
  }, [recipe]);

  if (isLoading) {
    return (
      <div className="grid gap-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-9 w-3/4" />
        <Skeleton className="h-4 w-56" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="mx-auto mt-16 max-w-md rounded-xl border border-dashed bg-muted/40 px-6 py-12 text-center">
        <h1 className="text-lg font-semibold">Recipe not found</h1>
        <p className="mt-1 text-muted-foreground">
          That recipe isn&apos;t in the box — it may have been deleted, or the link is to somewhere else.
        </p>
        <Button asChild className="mt-4">
          <Link href="/">Back to the recipe box</Link>
        </Button>
      </div>
    );
  }

  return (
    <article className="flex flex-col gap-6">
      {storageStatus === "memory" && (
        <Alert>
          <AlertTitle>This browser will not keep your recipes</AlertTitle>
          <AlertDescription>
            Everything works, but nothing survives closing the tab.
          </AlertDescription>
        </Alert>
      )}

      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> Back to the recipe box
      </Link>

      <header className="grid gap-2">
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{recipe.name}</h1>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
          <Badge variant="secondary">{recipe.category}</Badge>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-4 w-4" aria-hidden /> Total time {formatTime(recipe.timeMinutes)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Users className="h-4 w-4" aria-hidden /> {recipe.servings} servings
          </span>
        </div>
      </header>

      <div className="flex flex-wrap items-start gap-2">
        <Button onClick={() => setEditOpen(true)}>Edit</Button>
        <Button variant="outline" onClick={() => setDeleteOpen(true)}>
          Delete recipe
        </Button>
        <ShareButton
          label="Share recipe"
          className="grow-0"
          title={recipe.name}
          text={`${recipe.name} — from the family recipe box`}
          filename={`${slugify(recipe.name)}.png`}
          cacheKey={recipe.updatedAt}
          makeImage={() =>
            renderShareCard({
              title: recipe.name,
              subtitle: `${recipe.category} · ${formatTime(recipe.timeMinutes)} · ${recipe.servings} servings`,
              lines: shareLines,
              format: "story",
            })
          }
        />
      </div>

      <Separator />

      <section aria-labelledby="ingredients-heading" className="grid gap-3">
        <h2 id="ingredients-heading" className="text-lg font-semibold">
          Ingredients
        </h2>
        <ul className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
          {recipe.ingredients.map((ingredient, index) => (
            <li key={index} className="flex items-baseline gap-2 text-sm">
              <span className="min-w-20 shrink-0 text-right font-medium tabular-nums">{ingredient.amount}</span>
              <span>{ingredient.name}</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="steps-heading" className="grid gap-3">
        <h2 id="steps-heading" className="text-lg font-semibold">
          Steps
        </h2>
        <ol className="grid list-decimal gap-3 pl-5">
          {recipe.steps.map((step, index) => (
            <li key={index} className="pl-1 text-sm leading-relaxed marker:font-semibold">
              {step}
            </li>
          ))}
        </ol>
      </section>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[88dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit recipe</DialogTitle>
            <DialogDescription>Change anything and save — or leave without saving to keep it as it is.</DialogDescription>
          </DialogHeader>
          <RecipeForm
            key={recipe.id}
            initial={recipe}
            submitLabel="Save recipe"
            onSubmit={handleEdit}
            onCancel={() => setEditOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete “{recipe.name}”?</DialogTitle>
            <DialogDescription>
              This removes the recipe from the box for good. There is no undo — export a backup first
              if you might want it back.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => void handleDelete()} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete recipe"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </article>
  );
}

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "recipe"
  );
}
