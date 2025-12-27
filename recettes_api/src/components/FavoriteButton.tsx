"use client";

import { useState } from "react";

interface Props {
  recipeId: string;
  initialIsFavorite: boolean;
  onToggle: (newStatus: boolean) => void;
}

export default function FavoriteButton({ recipeId, initialIsFavorite, onToggle }: Props) {
  const [isFav, setIsFav] = useState(initialIsFavorite);
  const [loading, setLoading] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const token = sessionStorage.getItem("token");
    if (!token) {
        alert("Connectez-vous pour ajouter aux favoris !");
        return;
    }

    setLoading(true);

    try {
      const res = await fetch(`http://127.0.0.1:4000/api/recettes/${recipeId}/favorite`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        const newStatus = !isFav;
        setIsFav(newStatus);
        
        const userStr = sessionStorage.getItem("user");
        if (userStr) {
            const user = JSON.parse(userStr);
            user.favorites = data.favorites;
            sessionStorage.setItem("user", JSON.stringify(user));
        }

        onToggle(newStatus);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleClick}
      disabled={loading}
      className={`p-2 rounded-full transition-all duration-300 hover:scale-110 shadow-sm ${
        isFav ? "bg-red-50 text-red-500" : "bg-white/80 text-slate-400 hover:text-red-400"
      }`}
    >
      {isFav ? "❤️" : "🤍"}
    </button>
  );
}