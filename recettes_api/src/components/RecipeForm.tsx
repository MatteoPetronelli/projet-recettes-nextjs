"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Recipe } from "@/types/recipe";

interface RecipeFormProps {
  initialData?: Recipe;
}

export default function RecipeForm({ initialData }: RecipeFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isEditMode = !!initialData;

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    imageUrl: initialData?.imageUrl || "",
    country: initialData?.country || "",
    type: initialData?.type || "Plat",
    diet: initialData?.diet || "Non-végétarien",
    visibility: initialData?.visibility || "public",
    time: initialData?.time || 0,
    difficulty: initialData?.difficulty || 1,
    ingredientsString: initialData?.ingredients.join('\n') || "",
    stepsString: initialData?.steps.join('\n') || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    const payload = {
      name: formData.name,
      imageUrl: formData.imageUrl,
      country: formData.country,
      type: formData.type,
      diet: formData.diet,
      visibility: formData.visibility,
      time: Number(formData.time),
      difficulty: Number(formData.difficulty),
      authorId: "current_user",
      ingredients: formData.ingredientsString.split('\n').filter(i => i.trim() !== ""),
      steps: formData.stepsString.split('\n').filter(s => s.trim() !== "")
    };

    try {
      const token = sessionStorage.getItem("token");
      const headers: Record<string, string> = { 
        'Content-Type': 'application/json' 
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      } else {
        console.error("ATTENTION : Pas de token trouvé dans sessionStorage !");
        alert("Vous semblez déconnecté. Veuillez vous reconnecter.");
        router.push('/auth/connexion');
        return;
      }

      const url = isEditMode ? `http://127.0.0.1:4000/api/recettes/${initialData.id}` : 'http://127.0.0.1:4000/api/recettes';
      const method = isEditMode ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method: method,
        headers: headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        
        if (res.status === 400 && errorData.errors) {
          const newErrors: Record<string, string> = {};
          
          errorData.errors.forEach((err: any) => {
            newErrors[err.field] = err.message;
          });
          
          setErrors(newErrors);
          setLoading(false);
          return;
        }

        if (res.status === 401 || res.status === 403) {
          alert("Session expirée ou droits insuffisants. Veuillez vous reconnecter.");
          router.push('/auth/connexion');
          return;
        }
        
        alert("Une erreur est survenue : " + (errorData.message || res.statusText));
        setLoading(false);
        return;
      }
      router.push(isEditMode ? `/routes/${initialData.id}` : '/'); 
      router.refresh();
      
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-md border border-slate-200">
      <h2 className="text-xl font-semibold mb-4">
        {isEditMode ? "Modifier la recette ✏️" : "Nouvelle recette 🍳"}
      </h2>

      {/* Nom et Pays */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Nom</label>
          <input required name="name" value={formData.name} onChange={handleChange} type="text" className={`w-full border p-2 rounded mt-1 ${errors.name ? 'border-red-500' : 'border-slate-300'}`} />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Pays</label>
          <input required name="country" value={formData.country} onChange={handleChange} type="text" className={`w-full border p-2 rounded mt-1 ${errors.country ? 'border-red-500' : 'border-slate-300'}`} />
          {errors.country && <p className="text-red-500 text-xs mt-1">{errors.country}</p>}
        </div>
      </div>

      {/* URL Image */}
      <div>
        <label className="block text-sm font-medium text-slate-700">URL de l'image</label>
        <input 
          name="imageUrl" 
          value={formData.imageUrl} 
          onChange={handleChange} 
          type="url" 
          placeholder="https://..." 
          className={`w-full border p-2 rounded mt-1 ${errors.imageUrl ? 'border-red-500' : 'border-slate-300'}`} 
        />
        {errors.imageUrl && <p className="text-red-500 text-xs mt-1">{errors.imageUrl}</p>}
      </div>

      {/* SELECTEURS : Type, Diet, Visibilité, Difficulté */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Type</label>
          <select name="type" value={formData.type} onChange={handleChange} className="w-full border border-slate-300 p-2 rounded mt-1">
            <option>Entrée</option>
            <option>Plat</option>
            <option>Dessert</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Régime</label>
          <select name="diet" value={formData.diet} onChange={handleChange} className="w-full border border-slate-300 p-2 rounded mt-1">
            <option>Non-végétarien</option>
            <option>Végétarien</option>
            <option>Vegan</option>
          </select>
        </div>
        
        {/* 3. NOUVEAU SELECTEUR DE VISIBILITÉ */}
        <div>
          <label className="block text-sm font-medium text-slate-700">Visibilité</label>
          <select 
            name="visibility" 
            value={formData.visibility} 
            onChange={handleChange} 
            className="w-full border border-slate-300 p-2 rounded mt-1 bg-slate-50 font-medium"
          >
            <option value="public">🌍 Publique</option>
            <option value="private">🔒 Privée</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Difficulté</label>
          <input required name="difficulty" value={formData.difficulty} onChange={handleChange} type="number" min="1" max="5" className={`w-full border p-2 rounded mt-1 ${errors.difficulty ? 'border-red-500' : 'border-slate-300'}`} />
          {errors.difficulty && <p className="text-red-500 text-xs mt-1">{errors.difficulty}</p>}
        </div>
      </div>

      {/* Temps */}
      <div>
        <label className="block text-sm font-medium text-slate-700">Temps (min)</label>
        <input required name="time" value={formData.time} onChange={handleChange} type="number" className={`w-full border p-2 rounded mt-1 ${errors.time ? 'border-red-500' : 'border-slate-300'}`} />
        {errors.time && <p className="text-red-500 text-xs mt-1">{errors.time}</p>}
      </div>

      {/* Text Areas */}
      <div>
        <label className="block text-sm font-medium text-slate-700">Ingrédients (un par ligne)</label>
        <textarea required name="ingredientsString" value={formData.ingredientsString} onChange={handleChange} rows={4} className="w-full border border-slate-300 p-2 rounded mt-1"></textarea>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Étapes (une par ligne)</label>
        <textarea required name="stepsString" value={formData.stepsString} onChange={handleChange} rows={4} className="w-full border border-slate-300 p-2 rounded mt-1"></textarea>
      </div>

      <button 
        type="submit" 
        disabled={loading}
        className={`w-full text-white py-3 rounded font-bold transition disabled:bg-gray-400 ${
            isEditMode ? "bg-blue-600 hover:bg-blue-700" : "bg-green-600 hover:bg-green-700"
        }`}
      >
        {loading ? "Sauvegarde..." : (isEditMode ? "Enregistrer les modifications" : "Créer la recette")}
      </button>
    </form>
  );
}
