"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteButton({ id }: { id: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette recette ?")) return;

    setIsDeleting(true);

    try {
      const res = await fetch(`http://localhost:4000/api/recettes/${id}`, { method: "DELETE" });

      if (res.ok) {
        router.push("/");
        router.refresh();
      } else {
        alert("Erreur lors de la suppression");
        setIsDeleting(false);
      }
    } catch (error) {
      console.error(error);
      setIsDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="bg-red-100 text-red-600 px-4 py-2 rounded-lg hover:bg-red-200 transition font-medium flex items-center gap-2"
    >
      {isDeleting ? "Suppression..." : "🗑️ Supprimer"}
    </button>
  );
}
