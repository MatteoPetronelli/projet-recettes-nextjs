"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function UserHeader() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string } | null>(null);

  useEffect(() => {
    const storedUser = sessionStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    setUser(null);
    window.location.reload();
  };

  if (user) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-slate-600 font-medium">
          👋 Bonjour, <strong className="text-orange-600">{user.name}</strong>
        </span>
        <button 
          onClick={handleLogout}
          className="text-sm text-red-600 hover:text-red-700 underline"
        >
          Se déconnecter
        </button>
        <Link 
          href="/routes/ajouter" 
          className="bg-orange-600 text-white px-4 py-2 rounded-full font-bold shadow hover:bg-orange-700 transition"
        >
          + Créer
        </Link>
      </div>
    );
  }

  return (
    <div className="flex gap-4">
      <Link 
        href="/auth/connexion" 
        className="text-slate-600 hover:text-slate-900 font-medium px-4 py-2"
      >
        Se connecter
      </Link>
      <Link 
        href="/auth/inscription" 
        className="bg-slate-800 text-white px-4 py-2 rounded-full font-bold shadow hover:bg-slate-700 transition"
      >
        S'inscrire
      </Link>
    </div>
  );
}