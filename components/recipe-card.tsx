import Link from "next/link";
import { Clock, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Recipe } from "@/lib/db";
import { formatTime, type IngredientMatch } from "@/lib/recipes-search";

/**
 * One recipe in the box: name, category, time and servings, and — while a search is active — how
 * many of the typed ingredients it contains and which ones it is missing.
 */
export function RecipeCard({ recipe, match }: { recipe: Recipe; match?: IngredientMatch }) {
  return (
    <Link
      href={`/recipes/${recipe.id}`}
      className="group block h-full rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Card className="h-full gap-3 border-border/80 transition-shadow group-hover:shadow-md">
        <CardHeader className="gap-1.5">
          <CardTitle className="text-base leading-snug">{recipe.name}</CardTitle>
          <CardDescription className="flex items-center gap-2 text-xs">
            <Badge variant="secondary">{recipe.category}</Badge>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" aria-hidden />
              {formatTime(recipe.timeMinutes)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" aria-hidden />
              {recipe.servings} servings
            </span>
          </CardDescription>
        </CardHeader>
        {match ? (
          <CardContent className="pt-0">
            <p className="text-sm font-medium">
              {match.matched} of {match.matched + match.missing.length}{" "}
              {match.matched + match.missing.length === 1 ? "ingredient" : "ingredients"}
            </p>
            {match.missing.length > 0 && (
              <p className="mt-0.5 text-sm text-muted-foreground">
                Missing: <span className="text-destructive">{match.missing.join(", ")}</span>
              </p>
            )}
          </CardContent>
        ) : (
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground">
              {recipe.ingredients.length} {recipe.ingredients.length === 1 ? "ingredient" : "ingredients"}
              {" · "}
              {recipe.steps.length} {recipe.steps.length === 1 ? "step" : "steps"}
            </p>
          </CardContent>
        )}
      </Card>
    </Link>
  );
}
