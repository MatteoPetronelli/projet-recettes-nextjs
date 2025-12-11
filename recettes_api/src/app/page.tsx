"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Recipe } from "@/types/recipe";
import SearchBar from "@/components/SearchBar";
import FilterTabs from "@/components/FilterTabs";
import RecipeImage from "@/components/RecipeImage";
import UserHeader from "@/components/UserHeader";

function HomeContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q");
  const type = searchParams.get("type");

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecipes = async () => {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (type) params.set("type", type);

      const token = sessionStorage.getItem("token");
      const headers: HeadersInit = {};
      
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      try {
        const res = await fetch(`http://127.0.0.1:4000/api/recettes?${params.toString()}`, {
          headers: headers,
          cache: "no-store"
        });
        
        if (res.status === 403) {
            sessionStorage.removeItem("token");
            sessionStorage.removeItem("user");
            window.location.reload();
            return;
        }
        
        if (res.ok) {
          const data = await res.json();
          setRecipes(data);
        }
      } catch (error) {
        console.error("Erreur chargement recettes", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipes();
  }, [q, type]);

  return (
    <main className="min-h-screen pb-20">
      {/* HEADER */}
      <div className="bg-white shadow-sm border-b mb-10">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Miam<span className="text-orange-500">Miam</span> 🍳
            </h1>
            <UserHeader />
          </div>
          
          <div className="mt-4 max-w-2xl">
            <SearchBar />
            <FilterTabs />
          </div>
        </div>
      </div>

      {/* GRILLE DE RECETTES */}
      <div className="max-w-6xl mx-auto px-6">
        {loading ? (
          <p className="text-center text-slate-500">Chargement des recettes...</p>
        ) : recipes.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-slate-100">
            <p className="text-2xl text-slate-400 font-medium">Aucune recette trouvée 😔</p>
            {(q || type) && <p className="text-slate-400 mt-2">Essayez de changer vos filtres !</p>}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {recipes.map((recipe) => (
              <Link 
                key={recipe.id} 
                href={`/routes/${recipe.id}`}
                className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col h-full"
              >
                <div className="h-48 w-full relative bg-slate-200">
                  <RecipeImage 
                    src={recipe.imageUrl} 
                    alt={recipe.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute top-2 right-2 flex gap-1">
                    {recipe.visibility === 'private' && (
                       <span className="bg-slate-800/90 text-white backdrop-blur-sm px-2 py-1 rounded text-xs font-bold shadow-sm">
                         🔒 Privé
                       </span>
                    )}
                    <span className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold shadow-sm">
                      {recipe.type}
                    </span>
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-3">
                    <h2 className="text-xl font-bold text-slate-800 group-hover:text-orange-600 transition">
                      {recipe.name}
                    </h2>
                    <span className="text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-3 py-1 rounded-full">
                      {recipe.country}
                    </span>
                  </div>
                  
                  <div className="flex gap-4 text-sm text-slate-500 mb-4 font-medium">
                    <span className="flex items-center gap-1">⏱️ {recipe.time} min</span>
                    <span className="flex items-center gap-1">💪 {recipe.difficulty}/5</span>
                  </div>

                  <p className="text-sm text-slate-600 mb-6 line-clamp-2 flex-1">
                    Ingrédients : {recipe.ingredients.slice(0, 3).join(', ')}...
                  </p>

                  <div className="w-full text-center py-3 rounded-xl bg-slate-50 text-slate-700 font-semibold group-hover:bg-orange-50 group-hover:text-orange-700 transition">
                    Voir la recette
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-500">Chargement de l'application...</div>}>
      <HomeContent />
    </Suspense>
  );
}