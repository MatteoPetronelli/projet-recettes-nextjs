import RecipeForm from "@/components/RecipeForm";
import Link from "next/link";

export default function AddRecipePage() {
  return (
    <main className="max-w-2xl mx-auto p-8 font-sans">
      <Link href="/" className="text-blue-600 hover:underline mb-6 block">
        ← Retour à l'accueil
      </Link>
      
      <h1 className="text-3xl font-bold text-gray-800 mb-8">
        Nouvelle Recette 🍳
      </h1>

      <RecipeForm />
    </main>
  );
}
