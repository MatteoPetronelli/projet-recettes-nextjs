"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Recipe } from "@/types/recipe";
import RecipeImage from "@/components/RecipeImage";
import DeleteButton from "@/components/DeleteButton";

async function getRecipe(id: string): Promise<Recipe | null> {
  const res = await fetch(`http://127.0.0.1:4000/api/recettes/${id}`, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

export default function RecipePage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const userStr = sessionStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      setCurrentUserId(user.id);
    }

    const fetchRecipe = async () => {
      if (!id) return;
      
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
          if (res.status === 404) throw new Error("Recette introuvable");
          if (res.status === 403) throw new Error("Vous n'avez pas les droits pour voir cette recette privée.");
          throw new Error("Erreur serveur");
        }

        const data = await res.json();
        setRecipe(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [id]);

  if (loading) return <div className="text-center p-20 text-slate-500">Chargement de la recette...</div>;
  if (error) return <div className="text-center p-20 text-red-500 font-bold">{error}</div>;
  if (!recipe) return null;

  const headerGradient = recipe.type === 'Dessert' ? 'from-pink-500 to-rose-600' : 
                         recipe.type === 'Entrée' ? 'from-emerald-500 to-teal-600' : 
                         'from-orange-500 to-amber-600';

  const isOwner = currentUserId === recipe.authorId;

  return (
    <main className="min-h-screen bg-slate-50 pb-20">
      {/* BANNIÈRE HAUTE */}
      <div className="w-full h-80 relative shadow-lg group overflow-hidden">
        
        <RecipeImage 
          src={recipe.imageUrl} 
          alt={recipe.name}
          className="absolute inset-0 w-full h-full object-cover z-0"
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/30"></div>

        <div className="max-w-4xl mx-auto px-6 h-full flex flex-col justify-end pb-8 relative z-10">
          
          <div className="flex justify-between items-center mb-4">
            <Link href="/" className="text-white/80 hover:text-white font-medium inline-flex items-center gap-2 transition">
              ← Retour au menu
            </Link>
            
            {/* On n'affiche les boutons que si c'est MON ID */}
            {isOwner && (
              <div className="flex gap-3">
                <Link 
                  href={`/routes/${recipe.id}/modifier`}
                  className="bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-lg hover:bg-white/30 transition font-medium flex items-center gap-2"
                >
                  ✏️ Modifier
                </Link>
                <DeleteButton id={recipe.id} />
              </div>
            )}
          </div>

          <h1 className="text-5xl font-extrabold text-white drop-shadow-md mb-2">{recipe.name}</h1>
          <div className="flex gap-4 text-white/90 font-medium">
             {recipe.visibility === 'private' && (
                <span className="bg-red-500/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                  🔒 Privé
                </span>
             )}
             <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
               🌍 {recipe.country}
             </span>
             <span className="flex items-center">⏱️ {recipe.time} min</span>
             <span className="flex items-center">💪 {recipe.difficulty}/5</span>
          </div>
        </div>
      </div>

      {/* CONTENU CARTE */}
      <div className="max-w-4xl mx-auto px-6 -mt-10 relative z-20">
        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12">
          
          <div className="grid grid-cols-3 gap-4 border-b pb-8 mb-8 text-center">
            <div>
              <p className="text-slate-400 text-sm uppercase tracking-wider font-semibold">Temps</p>
              <p className="text-2xl font-bold text-slate-800">{recipe.time} min</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm uppercase tracking-wider font-semibold">Difficulté</p>
              <p className="text-2xl font-bold text-slate-800">{recipe.difficulty}/5</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm uppercase tracking-wider font-semibold">Régime</p>
              <p className="text-2xl font-bold text-slate-800">{recipe.diet}</p>
            </div>
          </div>

          <div className="grid md:grid-cols-12 gap-12">
            <div className="md:col-span-4 space-y-6">
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <span className="text-orange-500">🥕</span> Ingrédients
              </h2>
              <ul className="space-y-3">
                {recipe.ingredients.map((ing, index) => (
                  <li key={index} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <div className="w-2 h-2 rounded-full bg-orange-400 mt-2 shrink-0"></div>
                    <span className="text-slate-700 font-medium">{ing}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="md:col-span-8 space-y-6">
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <span className="text-orange-500">🔥</span> Préparation
              </h2>
              <div className="space-y-6">
                {recipe.steps.map((step, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-orange-100 text-orange-600 font-bold rounded-full flex items-center justify-center">
                      {index + 1}
                    </div>
                    <p className="text-slate-600 leading-relaxed pt-1 text-lg">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
