"use client";

import { useState, useEffect } from "react";
import StarRating from "./StarRating";
import { Review } from "@/types/recipe";

interface Props {
  recipeId: string;
  initialReviews: Review[];
  visibility: 'public' | 'private'; // On a besoin de savoir si c'est privé
}

export default function ReviewsSection({ recipeId, initialReviews, visibility }: Props) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews || []);
  const [user, setUser] = useState<{ id: string, name: string } | null>(null);
  
  // États formulaire
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Mode édition
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const userStr = sessionStorage.getItem("user");
    if (userStr) {
        const u = JSON.parse(userStr);
        setUser(u);
        
        // Vérifier si l'utilisateur a déjà posté un avis pour pré-remplir ou cacher le formulaire
        const existingReview = initialReviews?.find(r => r.userId === u.id);
        if (existingReview) {
             // On ne pré-remplit pas tout de suite, on attend qu'il clique sur "Modifier"
        }
    }
  }, [initialReviews]);

  // Si la recette est privée, on n'affiche RIEN (ni liste, ni formulaire)
  if (visibility === 'private') return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) { setError("Veuillez mettre une note."); return; }
    setError("");
    setLoading(true);

    try {
      const token = sessionStorage.getItem("token");
      // Si mode édition -> PUT, sinon POST
      const method = isEditing ? "PUT" : "POST";
      
      const res = await fetch(`http://127.0.0.1:4000/api/recettes/${recipeId}/reviews`, {
        method: method,
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ rating, comment })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      if (isEditing) {
         // Mise à jour de la liste locale
         setReviews(reviews.map(r => r.userId === user?.id ? data : r));
         setIsEditing(false);
         alert("Avis modifié !");
      } else {
         // Ajout
         setReviews([...reviews, data]);
         alert("Avis publié !");
      }
      
      // Reset si c'est un nouvel ajout (si edit, on garde les valeurs c'est plus sympa ou on reset)
      if (!isEditing) {
          setRating(0);
          setComment("");
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Supprimer votre avis ?")) return;
    setLoading(true);
    try {
        const token = sessionStorage.getItem("token");
        const res = await fetch(`http://127.0.0.1:4000/api/recettes/${recipeId}/reviews`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!res.ok) throw new Error("Erreur suppression");

        // Retrait local
        setReviews(reviews.filter(r => r.userId !== user?.id));
        
        // Reset formulaire
        setRating(0);
        setComment("");
        setIsEditing(false);

    } catch (err) {
        alert("Erreur lors de la suppression");
    } finally {
        setLoading(false);
    }
  };

  const startEdit = (review: Review) => {
      setRating(review.rating);
      setComment(review.comment);
      setIsEditing(true);
      // Scroll vers le formulaire (simple astuce UX)
      document.getElementById('review-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  // On vérifie si l'utilisateur a déjà laissé un avis
  const userHasReview = reviews.some(r => r.userId === user?.id);

  return (
    <div className="mt-12 border-t pt-10">
      <h3 className="text-2xl font-bold text-slate-800 mb-6">
        Avis de la communauté ({reviews.length})
      </h3>

      {/* LISTE DES AVIS */}
      <div className="space-y-6 mb-10">
        {reviews.length === 0 ? (
          <p className="text-slate-500 italic">Aucun avis pour le moment.</p>
        ) : (
          reviews.map((rev, idx) => {
            const isMyReview = user?.id === rev.userId;
            return (
                <div key={idx} className={`p-4 rounded-xl border ${isMyReview ? 'bg-orange-50 border-orange-200' : 'bg-slate-50 border-slate-100'}`}>
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <span className="font-bold text-slate-900">
                            {rev.userName} {isMyReview && "(Vous)"}
                        </span>
                        <span className="text-xs text-slate-500 ml-2">
                            {new Date(rev.createdAt).toLocaleDateString()}
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <StarRating rating={rev.rating} />
                        {/* BOUTONS EDIT/DELETE */}
                        {isMyReview && (
                            <div className="flex gap-2 text-sm">
                                <button onClick={() => startEdit(rev)} className="text-blue-600 hover:underline">Modifier</button>
                                <button onClick={handleDelete} className="text-red-600 hover:underline">Supprimer</button>
                            </div>
                        )}
                    </div>
                </div>
                <p className="text-slate-700">{rev.comment}</p>
                </div>
            );
          })
        )}
      </div>

      {/* FORMULAIRE */}
      {/* On affiche le formulaire SI : L'utilisateur est connecté ET (n'a pas encore d'avis OU est en train d'éditer) */}
      {user ? (
        (!userHasReview || isEditing) && (
            <form id="review-form" onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h4 className="text-lg font-bold mb-4">
                    {isEditing ? "Modifier votre avis ✏️" : "Donnez votre avis 📝"}
                </h4>
                
                {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

                <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Votre note</label>
                    <StarRating rating={rating} interactive onChange={setRating} />
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Votre commentaire</label>
                    <textarea 
                        className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-orange-500 outline-none"
                        rows={3}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        required
                    />
                </div>

                <div className="flex gap-3">
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="bg-orange-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-orange-700 transition disabled:opacity-50"
                    >
                        {loading ? "Envoi..." : (isEditing ? "Mettre à jour" : "Publier")}
                    </button>
                    
                    {isEditing && (
                        <button 
                            type="button"
                            onClick={() => { setIsEditing(false); setRating(0); setComment(""); }}
                            className="text-slate-500 px-4 py-2 hover:bg-slate-100 rounded-lg"
                        >
                            Annuler
                        </button>
                    )}
                </div>
            </form>
        )
      ) : (
        <div className="bg-slate-50 p-6 rounded-xl text-center border border-slate-200">
            <p className="text-slate-600">Connectez-vous pour laisser un avis.</p>
        </div>
      )}
    </div>
  );
}