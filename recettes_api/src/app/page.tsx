"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Recipe } from "@/types/recipe";
import RecipeImage from "@/components/RecipeImage";
import FavoriteButton from "@/components/FavoriteButton";

// --- 1. COMPOSANT CARTE ---
const RecipeCard = ({ 
  recipe, 
  index, 
  currentUserId, 
  favorites, 
  refreshData,
  priority 
}: { 
  recipe: Recipe, 
  index: number, 
  currentUserId: string | null, 
  favorites: string[], 
  refreshData: () => void,
  priority: boolean
}) => {
  return (
    <Link 
      href={`/routes/${recipe.id}`}
      className="animate-slide-up group bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-xl hover:border-orange-100 transition-all duration-300 flex flex-col h-full transform hover:-translate-y-1 relative"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="h-56 w-full relative overflow-hidden bg-slate-100">
         <RecipeImage 
            src={recipe.imageUrl} 
            alt={recipe.name} 
            priority={priority}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
         />
         
         <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

         {currentUserId && (
            <div className="absolute top-3 left-3 z-20">
                <FavoriteButton 
                    recipeId={recipe.id} 
                    initialIsFavorite={favorites.includes(recipe.id)}
                    onToggle={refreshData}
                />
            </div>
         )}

         <div className="absolute top-3 right-3 flex gap-2">
            {recipe.visibility === 'private' && (
               <span className="bg-slate-800/90 text-white backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold shadow-md">
                 🔒 Privé
               </span>
            )}
            <span className="bg-white/95 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold shadow-md text-slate-700 flex items-center gap-1">
               {recipe.type === 'Dessert' ? '🍰' : recipe.type === 'Entrée' ? '🥗' : '🥘'} {recipe.type}
            </span>
         </div>
      </div>

      <div className="p-6 flex-1 flex flex-col relative">
        <div className="flex justify-between items-start mb-2">
          <h2 className="text-lg font-bold text-slate-800 leading-tight group-hover:text-orange-700 transition-colors">
            {recipe.name}
          </h2>
          <div className="flex items-center gap-1 text-amber-500 text-sm font-bold bg-amber-50 px-2 py-0.5 rounded-full">
            <span>★</span> {recipe.rating > 0 ? recipe.rating : '-'}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
          <span>📍 {recipe.country}</span>
          <span>•</span>
          <span className={recipe.difficulty > 3 ? "text-red-600" : "text-green-600"}>
            {recipe.difficulty === 1 ? "Facile" : recipe.difficulty === 5 ? "Expert" : "Moyen"}
          </span>
        </div>
        
        <p className="text-slate-600 text-sm line-clamp-2 mb-6 flex-1">
           Avec {recipe.ingredients.slice(0, 3).join(', ')}...
        </p>

        <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-sm text-slate-500">
           <span className="flex items-center gap-1.5">
             ⏱️ {recipe.time} min
           </span>
           <span className="group-hover:translate-x-1 transition-transform text-orange-700 font-bold flex items-center gap-1">
             Voir la recette →
           </span>
        </div>
      </div>
    </Link>
  );
};

// --- 2. CONTENU PRINCIPAL ---
function HomeContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q");
  const type = searchParams.get("type");

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshData = () => {
    const userStr = sessionStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      setCurrentUserId(user.id);
      setFavorites(user.favorites || []);
    } else {
      setCurrentUserId(null);
      setFavorites([]);
    }
  };

  useEffect(() => {
    refreshData();
    const handleAuthChange = () => {
       refreshData();
       fetchRecipes(); 
    };

    window.addEventListener("auth-change", handleAuthChange);

    const fetchRecipes = async () => {
      setLoading(true);
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (type) params.set("type", type);

      const token = sessionStorage.getItem("token");
      const headers: HeadersInit = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      try {
        const res = await fetch(`http://127.0.0.1:4000/api/recettes?${params.toString()}`, {
          headers,
          cache: "no-store"
        });
        
        if (res.status === 403) {
            sessionStorage.removeItem("token");
            sessionStorage.removeItem("user");
            window.dispatchEvent(new Event("auth-change"));
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

    return () => {
      window.removeEventListener("auth-change", handleAuthChange);
    };
  }, [q, type]);

  // --- FILTRES ---
  const myRecipes = recipes.filter(r => r.authorId === currentUserId);
  const favRecipes = recipes.filter(r => favorites.includes(r.id));
  const communityRecipes = recipes.filter(r => r.authorId !== currentUserId);

  // Helper pour afficher une section
  const RecipeSection = ({ title, icon, list }: { title: string, icon: string, list: Recipe[] }) => {
    if (list.length === 0) return null;
    return (
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <span className="text-3xl">{icon}</span> {title}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {list.map((recipe, index) => (
            <RecipeCard 
              key={recipe.id} 
              recipe={recipe} 
              index={index} 
              currentUserId={currentUserId}
              favorites={favorites}
              refreshData={refreshData}
              priority={index < 4}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <main className="min-h-screen pb-20">
      {/* GRILLES */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 animate-pulse">
            <div className="h-12 w-12 bg-orange-200 rounded-full mb-4"></div>
            <p className="text-slate-500 font-medium">Nos chefs préparent la liste...</p>
          </div>
        ) : recipes.length === 0 ? (
          <div className="text-center py-20 bg-white/50 rounded-3xl border border-dashed border-slate-300 mx-auto max-w-2xl animate-fade-in">
            <p className="text-4xl mb-4">🥗</p>
            <p className="text-xl text-slate-600 font-bold">Aucune recette trouvée</p>
            <p className="text-slate-400">Essayez d'autres mots-clés !</p>
          </div>
        ) : (
          <>
            {currentUserId ? (
              // MODE CONNECTÉ
              <>
                <RecipeSection title="Mes Recettes" icon="👨‍🍳" list={myRecipes} />
                <RecipeSection title="Mes Favoris" icon="❤️" list={favRecipes} />
                {(myRecipes.length > 0 || favRecipes.length > 0) && (
                    <div className="border-t border-slate-200/60 my-10"></div>
                )}
                <RecipeSection title="Communauté" icon="🌍" list={communityRecipes} />
              </>
            ) : (
              // MODE VISITEUR
              <RecipeSection title="Recettes de la communauté" icon="🌍" list={recipes} />
            )}
          </>
        )}
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-500">Chargement...</div>}>
      <HomeContent />
    </Suspense>
  );
}