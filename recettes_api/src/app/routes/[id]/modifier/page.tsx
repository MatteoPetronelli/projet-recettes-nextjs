import RecipeForm from "@/components/RecipeForm";
import Link from "next/link";
import { notFound } from "next/navigation";

async function getRecipe(id: string) {
   const res = await fetch(`http://127.0.0.1:4000/api/recettes/${id}`, { cache: 'no-store' });
   if (!res.ok) return null;
   return res.json();
}

export default async function EditRecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const recipe = await getRecipe(id);
  if (!recipe) notFound();

  if (!recipe) notFound();

  return (
    <main className="max-w-2xl mx-auto p-8 font-sans">
      <Link href={`/routes/${id}`} className="text-blue-600 hover:underline mb-6 block">
        ← Annuler
      </Link>
      
      {/* On passe les données existantes au formulaire */}
      <RecipeForm initialData={recipe} />
    </main>
  );
}
