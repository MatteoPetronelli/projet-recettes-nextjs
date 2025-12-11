"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://127.0.0.1:4000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Une erreur est survenue");
      }

      alert("Compte créé ! Connectez-vous maintenant.");
      router.push("/auth/connexion");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md border border-slate-100">
        <h1 className="text-3xl font-bold text-slate-800 mb-6 text-center">Inscription 📝</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Nom</label>
            <input 
              type="text" 
              required
              className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Email</label>
            <input 
              type="email" 
              required
              className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Mot de passe</label>
            <input 
              type="password" 
              required
              className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>

          {error && <p className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">{error}</p>}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-orange-600 text-white py-3 rounded-lg font-bold hover:bg-orange-700 transition disabled:opacity-50"
          >
            {loading ? "Création..." : "S'inscrire"}
          </button>
        </form>

        <p className="mt-6 text-center text-slate-500 text-sm">
          Déjà un compte ?{" "}
          <Link href="/auth/connexion" className="text-orange-600 font-semibold hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </main>
  );
}
