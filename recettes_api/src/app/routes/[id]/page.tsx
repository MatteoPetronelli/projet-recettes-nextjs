"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Recipe } from "@/types/recipe";
import RecipeImage from "@/components/RecipeImage";
import DeleteButton from "@/components/DeleteButton";
import ReviewsSection from "@/components/ReviewsSection";

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

  const isOwner = currentUserId === recipe.authorId;

  return (
    <main className="min-h-screen bg-slate-50 pb-20">
      
      {/* --- NOUVEAU HEADER --- */}
      <div className="relative h-[50vh] min-h-[400px] w-full bg-slate-900 overflow-hidden group">
        
        {/* 1. IMAGE (Fond) */}
        <RecipeImage 
          src={recipe.imageUrl} 
          alt={recipe.name} 
          priority={true} // Priorité LCP
          className="w-full h-full opacity-90 object-cover"
        />
        
        {/* 2. GRADIENT (Pour lisibilité) */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none"></div>

        {/* 3. BOUTON RETOUR */}
        <Link 
          href="/" 
          className="absolute top-6 left-6 z-30 bg-white/20 backdrop-blur-md hover:bg-white/30 text-white px-4 py-2 rounded-full font-medium transition-all flex items-center gap-2"
        >
          ← Retour au menu
        </Link>

        {/* 4. CONTENU TEXTE */}
        <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 z-20 text-white">
          <div className="max-w-4xl mx-auto">
            
            {/* Badges */}
            <div className="flex flex-wrap gap-3 mb-4">
              <span className="bg-orange-600 px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                 {recipe.type}
              </span>
              <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-sm font-bold border border-white/30">
                 📍 {recipe.country}
              </span>
              {recipe.visibility === 'private' && (
                 <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold border border-white/20">
                   🔒 Privé
                 </span>
              )}
            </div>

            {/* Titre */}
            <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4 drop-shadow-lg">
              {recipe.name}
            </h1>

            {/* Infos rapides */}
            <div className="flex items-center gap-6 text-white/90 font-medium text-lg mb-6">
               <span className="flex items-center gap-2">⏱️ {recipe.time} min</span>
               <span className="flex items-center gap-2">💪 {recipe.difficulty}/5</span>
               <div className="flex items-center gap-1 text-amber-400">
                  <span className="text-xl">★</span> 
                  <span>{recipe.rating > 0 ? recipe.rating : "N/A"}</span>
               </div>
            </div>

            {/* Boutons Actions (Propriétaire uniquement) */}
            {isOwner && (
               <div className="flex gap-4 mt-2">
                   <Link 
                     href={`/routes/${recipe.id}/modifier`}
                     className="bg-white text-slate-900 hover:bg-slate-100 px-5 py-2 rounded-lg font-bold transition shadow-lg flex items-center gap-2"
                   >
                     ✏️ Modifier
                   </Link>
                   <DeleteButton id={recipe.id} />
               </div>
            )}
          </div>
        </div>
      </div>
      {/* --- FIN DU HEADER --- */}


      {/* CONTENU PRINCIPAL */}
      <div className="max-w-4xl mx-auto px-6 -mt-10 relative z-20">
        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-slate-100">
          
          {/* Grille Infos Détails */}
          <div className="grid grid-cols-3 gap-4 border-b border-slate-100 pb-8 mb-8 text-center">
            <div>
              <p className="text-slate-500 text-sm uppercase tracking-wider font-semibold">Temps</p>
              <p className="text-2xl font-bold text-slate-800">{recipe.time} min</p>
            </div>
            <div>
              <p className="text-slate-500 text-sm uppercase tracking-wider font-semibold">Difficulté</p>
              <p className="text-2xl font-bold text-slate-800">{recipe.difficulty}/5</p>
            </div>
            <div>
              <p className="text-slate-500 text-sm uppercase tracking-wider font-semibold">Régime</p>
              <p className="text-2xl font-bold text-slate-800">{recipe.diet}</p>
            </div>
          </div>

          <div className="grid md:grid-cols-12 gap-12">
            {/* Colonne Ingrédients */}
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

            {/* Colonne Étapes */}
            <div className="md:col-span-8 space-y-6">
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <span className="text-orange-500">🔥</span> Préparation
              </h2>
              <div className="space-y-6">
                {recipe.steps.map((step, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="shrink-0 w-8 h-8 bg-orange-100 text-orange-600 font-bold rounded-full flex items-center justify-center">
                      {index + 1}
                    </div>
                    <p className="text-slate-600 leading-relaxed pt-1 text-lg">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section Avis */}
          <ReviewsSection 
            recipeId={recipe.id} 
            initialReviews={recipe.reviews} 
            visibility={recipe.visibility}
          />

        </div>
      </div>
    </main>
  );
}
