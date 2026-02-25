"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Recipe } from "@/types/recipe";

interface Props {
  initialData?: Recipe;
}

export default function RecipeForm({ initialData }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    imageKeyword: initialData?.imageUrl ? "keep" : "", 
    time: initialData?.time || 15,
    difficulty: initialData?.difficulty || 1,
    country: initialData?.country || "France",
    type: initialData?.type || "Plat",
    diet: initialData?.diet || "Végétarien",
    visibility: initialData?.visibility || "public",
    ingredients: initialData?.ingredients || [""],
    steps: initialData?.steps || [""]
  });

  // --- GESTION DES LISTES ---
  const handleArrayChange = (
    field: "ingredients" | "steps",
    index: number,
    value: string
  ) => {
    const newArray = [...formData[field]];
    newArray[index] = value;
    setFormData({ ...formData, [field]: newArray });
  };

  const addField = (field: "ingredients" | "steps") => {
    setFormData({ ...formData, [field]: [...formData[field], ""] });
  };

  const removeField = (field: "ingredients" | "steps", index: number) => {
    const newArray = formData[field].filter((_, i) => i !== index);
    setFormData({ ...formData, [field]: newArray });
  };

  // --- SOUMISSION ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const token = sessionStorage.getItem("token");
      if (!token) throw new Error("Vous devez être connecté");

      let finalImageUrl = formData.imageKeyword === "keep" ? (initialData?.imageUrl || "") : formData.imageKeyword;

      if (imageFile) {
        const fileData = new FormData();
        fileData.append("image", imageFile);

        const uploadRes = await fetch("http://127.0.0.1:4000/api/upload", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`
          },
          body: fileData
        });

        if (!uploadRes.ok) {
          const errData = await uploadRes.json();
          throw new Error(errData.message || "Erreur lors de l'upload de l'image");
        }

        const uploadData = await uploadRes.json();
        finalImageUrl = uploadData.imageUrl;
      }

      const url = initialData 
        ? `http://127.0.0.1:4000/api/recettes/${initialData.id}`
        : "http://127.0.0.1:4000/api/recettes";

      const method = initialData ? "PUT" : "POST";

      const payload = {
        name: formData.name,
        country: formData.country,
        type: formData.type,
        diet: formData.diet,
        time: formData.time,
        difficulty: formData.difficulty,
        visibility: formData.visibility,
        ingredients: formData.ingredients,
        steps: formData.steps,
        imageUrl: finalImageUrl
      };

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      
      if (!res.ok) {
         const detailedErrors = data.errors ? data.errors.map((e: any) => e.message).join(' | ') : data.message;
         throw new Error(detailedErrors || "Erreur lors de l'enregistrement");
      }

      router.push("/");
      router.refresh();

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
      
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-center font-bold">
            {error}
        </div>
      )}

      {/* SECTION 1 : INFOS GÉNÉRALES */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="col-span-2">
            <label htmlFor="name" className="block text-sm font-bold text-slate-700 mb-2">Nom de la recette</label>
            <input 
                id="name"
                className="w-full border border-slate-300 rounded-xl p-4 focus:ring-2 focus:ring-orange-500 outline-none font-medium"
                placeholder="Ex: Tarte aux pommes"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                required
            />
        </div>

        <div>
            <label htmlFor="country" className="block text-sm font-bold text-slate-700 mb-2">Pays d'origine</label>
            <input 
                id="country"
                className="w-full border border-slate-300 rounded-xl p-4 focus:ring-2 focus:ring-orange-500 outline-none"
                placeholder="Ex: Italie"
                value={formData.country}
                onChange={e => setFormData({...formData, country: e.target.value})}
                required
            />
        </div>

        <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Image de la recette</label>
            <div className="flex flex-col gap-3">
              <input 
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-orange-500 outline-none bg-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 transition"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setImageFile(e.target.files[0]);
                      setFormData({...formData, imageKeyword: ""});
                    }
                  }}
              />
              <p className="text-xs text-slate-500 font-medium">Ou utilisez une URL externe :</p>
              <input 
                  id="imageKeyword"
                  className="w-full border border-slate-300 rounded-xl p-4 focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                  placeholder="https://images.unsplash.com/..."
                  value={formData.imageKeyword === "keep" ? "" : formData.imageKeyword}
                  onChange={e => {
                    setFormData({...formData, imageKeyword: e.target.value});
                    setImageFile(null); 
                  }}
                  disabled={!!imageFile}
              />
              {initialData && formData.imageKeyword === "keep" && !imageFile && (
                <p className="text-xs text-orange-600 font-bold">L'image actuelle sera conservée.</p>
              )}
            </div>
        </div>
      </div>

      {/* SECTION 2 : SLIDERS & SELECTS */}
      <div className="grid md:grid-cols-3 gap-6 bg-slate-50 p-6 rounded-2xl">
        <div>
            <label htmlFor="time" className="block text-sm font-bold text-slate-700 mb-2">Temps : {formData.time} min</label>
            <input 
                id="time"
                type="range" 
                min="5" max="180" step="5"
                className="w-full accent-orange-600 cursor-pointer"
                value={formData.time}
                onChange={e => setFormData({...formData, time: Number(e.target.value)})}
            />
        </div>

        <div>
            <label htmlFor="difficulty" className="block text-sm font-bold text-slate-700 mb-2">Difficulté : {formData.difficulty}/5</label>
            <input 
                id="difficulty"
                type="range" 
                min="1" max="5" 
                className="w-full accent-orange-600 cursor-pointer"
                value={formData.difficulty}
                onChange={e => setFormData({...formData, difficulty: Number(e.target.value)})}
            />
        </div>

        <div>
            <label htmlFor="type" className="block text-sm font-bold text-slate-700 mb-2">Type de plat</label>
            <select 
                id="type"
                className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-orange-500 outline-none bg-white"
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value})}
            >
                <option value="Entrée">🥗 Entrée</option>
                <option value="Plat">🥘 Plat</option>
                <option value="Dessert">🍰 Dessert</option>
            </select>
        </div>
        
        <div>
            <label htmlFor="diet" className="block text-sm font-bold text-slate-700 mb-2">Régime</label>
            <select 
                id="diet"
                className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-orange-500 outline-none bg-white"
                value={formData.diet}
                onChange={e => setFormData({...formData, diet: e.target.value})}
            >
                <option value="Végétarien">🌿 Végétarien</option>
                <option value="Vegan">🌱 Vegan</option>
                <option value="Carné">🥩 Carné</option>
                <option value="Sans Gluten">🌾 Sans Gluten</option>
            </select>
        </div>

        <div>
            <label htmlFor="visibility" className="block text-sm font-bold text-slate-700 mb-2">Visibilité</label>
            <select 
                id="visibility"
                className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-orange-500 outline-none bg-white"
                value={formData.visibility}
                onChange={e => setFormData({...formData, visibility: e.target.value as 'public' | 'private'})}
            >
                <option value="public">🌍 Public (Visible par tous)</option>
                <option value="private">🔒 Privé (Visible par moi seul)</option>
            </select>
        </div>
      </div>

      {/* SECTION 3 : LISTES DYNAMIQUES (LA CORRECTION EST ICI) */}
      
      {/* Ingrédients */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
            🥕 Ingrédients
        </h2>
        {formData.ingredients.map((ing, index) => (
            <div key={index} className="flex gap-2 mb-2">
                <input 
                    value={ing}
                    onChange={(e) => handleArrayChange("ingredients", index, e.target.value)}
                    placeholder="Ex: 200g de farine"
                    className="flex-1 border border-slate-300 rounded-lg p-3 outline-none focus:border-orange-500"
                    aria-label={`Ingrédient ${index + 1}`} 
                />
                <button 
                    type="button" 
                    onClick={() => removeField("ingredients", index)}
                    className="text-red-500 hover:bg-red-50 p-3 rounded-lg font-bold"
                    aria-label={`Supprimer l'ingrédient ${index + 1}`}
                >
                    ✕
                </button>
            </div>
        ))}
        <button type="button" onClick={() => addField("ingredients")} className="text-orange-600 font-bold text-sm hover:underline mt-1">
            + Ajouter un ingrédient
        </button>
      </div>

      {/* Étapes */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
            🔥 Étapes
        </h2>
        {formData.steps.map((step, index) => (
            <div key={index} className="flex gap-2 mb-2">
                <textarea 
                    value={step}
                    onChange={(e) => handleArrayChange("steps", index, e.target.value)}
                    placeholder={`Étape ${index + 1}`}
                    rows={2}
                    className="flex-1 border border-slate-300 rounded-lg p-3 outline-none focus:border-orange-500 resize-none"
                    aria-label={`Étape de préparation ${index + 1}`}
                />
                <button 
                    type="button" 
                    onClick={() => removeField("steps", index)}
                    className="text-red-500 hover:bg-red-50 p-3 rounded-lg font-bold h-fit"
                    aria-label={`Supprimer l'étape ${index + 1}`}
                >
                    ✕
                </button>
            </div>
        ))}
        <button type="button" onClick={() => addField("steps")} className="text-orange-600 font-bold text-sm hover:underline mt-1">
            + Ajouter une étape
        </button>
      </div>

      {/* SUBMIT */}
      <div className="pt-6 border-t">
        <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xl py-4 rounded-xl shadow-lg hover:shadow-orange-200/50 transition-all transform hover:-translate-y-1"
        >
            {loading ? "Mijotage en cours..." : (initialData ? "Sauvegarder les modifications" : "Créer la recette 👨‍🍳")}
        </button>
      </div>
    </form>
  );
}
