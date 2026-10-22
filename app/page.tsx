import { RecipeBox } from "@/components/recipe-box";
import { identity } from "./identity";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{identity.name}</h1>
        <p className="mt-2 max-w-prose text-muted-foreground">
          The family recipes, on one shelf. Look one up by whatever is already in the kitchen — type
          an ingredient, or two, or five.
        </p>
      </header>
      <RecipeBox />
    </main>
  );
}
