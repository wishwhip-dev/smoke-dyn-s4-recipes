import type { Metadata } from "next";
import { RecipeDetail } from "@/components/recipe-detail";
import { identity } from "@/app/identity";

export const metadata: Metadata = {
  title: "Recipe",
};

/** A recipe's own address. Opened directly — pasted, bookmarked — it renders that recipe. */
export default async function RecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
      <span className="sr-only">{identity.name}</span>
      <RecipeDetail id={id} />
    </main>
  );
}
