"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Voulez-vous vraiment supprimer cette recette ?")) return;

    setLoading(true);

    try {
      const token = sessionStorage.getItem("token");
      const headers: Record<string, string> = {};
      
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      } else {
        alert("Vous devez être connecté.");
        return;
      }

      const res = await fetch(`http://127.0.0.1:4000/api/recettes/${id}`, {
        method: "DELETE",
        headers: headers,
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
            alert("Session expirée ou non autorisée.");
            sessionStorage.removeItem("token");
            window.location.href = "/auth/connexion";
            return;
        }
        throw new Error("Erreur lors de la suppression");
      }

      alert("Recette supprimée !");
      router.push("/");
      router.refresh();
      
    } catch (error) {
      console.error(error);
      alert("Impossible de supprimer la recette.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleDelete} 
      disabled={loading}
      className="bg-red-500/80 backdrop-blur-md text-white px-4 py-2 rounded-lg hover:bg-red-600/90 transition font-medium flex items-center gap-2 disabled:opacity-50"
    >
      {loading ? "..." : "🗑️ Supprimer"}
    </button>
  );
}
