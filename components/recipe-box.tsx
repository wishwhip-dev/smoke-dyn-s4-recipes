"use client";

/**
 * The recipe box screen: the count of what the box holds, a search by ingredient, category filter
 * chips, the grid of cards, and the Add recipe dialog. All filtering happens here over the live
 * query's list — a family recipe box is small, so everything is in memory.
 */
import { useMemo, useState } from "react";
import { Plus, Search, X } from "lucide-react";
import { toast } from "sonner";
import { BackupSection } from "@/components/backup-section";
import { RecipeCard } from "@/components/recipe-card";
import { RecipeForm, type RecipeDraft } from "@/components/recipe-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { CATEGORIES, database, type Category, type Recipe } from "@/lib/db";
import { addRecipe, listRecipes } from "@/lib/data/recipes";
import { matchRecipe, parseSearchTerms, type IngredientMatch } from "@/lib/recipes-search";
import { useStorageStatus, useStoredQuery } from "@/lib/storage/react";

type Filter = Category | "All";
type Result = { recipe: Recipe; match?: IngredientMatch };

export function RecipeBox() {
  const { data, isLoading } = useStoredQuery(database, listRecipes);
  const storageStatus = useStorageStatus(database);
  const [searchText, setSearchText] = useState("");
  const [filter, setFilter] = useState<Filter>("All");
  const [addOpen, setAddOpen] = useState(false);

  const recipes = useMemo(() => data ?? [], [data]);
  const terms = useMemo(() => parseSearchTerms(searchText), [searchText]);

  const counts = useMemo(() => {
    const byCategory = new Map<Category, number>();
    for (const recipe of recipes) {
      byCategory.set(recipe.category, (byCategory.get(recipe.category) ?? 0) + 1);
    }
    return byCategory;
  }, [recipes]);

  const results = useMemo<Result[]>(() => {
    const inCategory = recipes.filter((recipe) => filter === "All" || recipe.category === filter);
    if (terms.length === 0) return inCategory.map((recipe) => ({ recipe }));
    return inCategory
      .map((recipe) => ({ recipe, match: matchRecipe(recipe, terms) }))
      .filter((entry) => entry.match.matched > 0)
      // The recipes containing the most of the typed ingredients come first.
      .sort((a, b) => b.match.matched - a.match.matched);
  }, [recipes, filter, terms]);

  const handleAdd = async (draft: RecipeDraft) => {
    try {
      await addRecipe(draft);
      toast.success(`“${draft.name}” added to the box`);
      setAddOpen(false);
    } catch (error) {
      // The dialog stays open with the typed values, and the failure is named.
      toast.error(error instanceof Error ? error.message : "Could not save the recipe");
    }
  };

  const clearSearch = () => {
    setSearchText("");
    setFilter("All");
  };

  const searching = terms.length > 0;

  return (
    <div className="flex flex-col gap-5">
      {storageStatus === "memory" && (
        <Alert>
          <AlertTitle>This browser will not keep your recipes</AlertTitle>
          <AlertDescription>
            Everything works, but nothing survives closing the tab. Export a backup to carry the
            box somewhere it is kept.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p aria-live="polite" className="text-sm font-medium text-muted-foreground">
          {isLoading ? "Opening the recipe box…" : `${recipes.length} ${recipes.length === 1 ? "recipe" : "recipes"}`}
          {searching && !isLoading && ` · ${results.length} ${results.length === 1 ? "match" : "matches"}`}
          {filter !== "All" && !searching && ` · ${results.length} in ${filter}`}
        </p>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" aria-hidden /> Add recipe
        </Button>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="ingredient-search">Search by ingredient</Label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            id="ingredient-search"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="e.g. chicken, garlic — separate with commas"
            className="h-11 pl-9 pr-10"
            enterKeyHint="search"
          />
          {searchText && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 text-muted-foreground"
              onClick={() => setSearchText("")}
              aria-label="Clear the ingredient search"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div role="group" aria-label="Filter by category" className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={filter === "All" ? "default" : "outline"}
          aria-pressed={filter === "All"}
          onClick={() => setFilter("All")}
        >
          All <span className="tabular-nums">{recipes.length}</span>
        </Button>
        {CATEGORIES.map((option) => (
          <Button
            key={option}
            type="button"
            size="sm"
            variant={filter === option ? "default" : "outline"}
            aria-pressed={filter === option}
            onClick={() => setFilter(option)}
          >
            {option} <span className="tabular-nums">{counts.get(option) ?? 0}</span>
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <Card key={index}>
              <CardContent className="grid gap-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : recipes.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-muted/40 px-6 py-12 text-center">
          <h2 className="text-lg font-semibold">Your recipe box is empty</h2>
          <p className="mx-auto mt-1 max-w-sm text-muted-foreground">
            Add the first family recipe — its ingredients, its steps — and it will be here every time you open the box.
          </p>
          <Button className="mt-4" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden /> Add recipe
          </Button>
        </div>
      ) : results.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-muted/40 px-6 py-12 text-center">
          <h2 className="text-lg font-semibold">
            {filter === "All" ? "No recipes use those ingredients" : `No ${filter} recipes use those ingredients`}
          </h2>
          <p className="mx-auto mt-1 max-w-sm text-muted-foreground">
            Try fewer or different ingredients, or look in another category.
          </p>
          <Button className="mt-4" variant="outline" onClick={clearSearch}>
            <X className="h-4 w-4" aria-hidden /> Clear search
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((entry) => (
            <RecipeCard key={entry.recipe.id} recipe={entry.recipe} match={entry.match} />
          ))}
        </div>
      )}

      {!isLoading && recipes.length > 0 && <BackupSection />}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-h-[88dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add recipe</DialogTitle>
            <DialogDescription>Write it as you would on a card in the box.</DialogDescription>
          </DialogHeader>
          <RecipeForm
            key="add"
            submitLabel="Save recipe"
            onSubmit={handleAdd}
            onCancel={() => setAddOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
