"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import RecipeForm from "@/components/RecipeForm";
import { Recipe } from "@/types/recipe";

export default function EditRecipePage() {
  const { id } = useParams();
  const router = useRouter();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchRecipe = async () => {
      const token = sessionStorage.getItem("token");
      const headers: HeadersInit = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      try {
        const res = await fetch(`http://127.0.0.1:4000/api/recettes/${id}`, {
            headers,
            cache: "no-store"
        });

        if (!res.ok) {
            if (res.status === 403 || res.status === 401) {
                throw new Error("Accès refusé. Êtes-vous connecté avec le bon compte ?");
            }
            throw new Error("Impossible de charger la recette");
        }
        
        const data = await res.json();
        setRecipe(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchRecipe();
  }, [id]);

  if (loading) return <div className="text-center p-20">Chargement...</div>;
  if (error) return (
    <div className="text-center p-20">
        <p className="text-red-500 font-bold mb-4">{error}</p>
        <button onClick={() => router.back()} className="text-blue-500 underline">Retour</button>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-slate-800">Modifier la recette</h1>
      {/* On passe les données existantes au formulaire */}
      {recipe && <RecipeForm initialData={recipe} />}
    </div>
  );
}
