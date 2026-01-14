"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function UserHeader() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string } | null>(null);
  const [mounted, setMounted] = useState(false);

  const checkUser = () => {
    const userStr = sessionStorage.getItem("user");
    if (userStr) {
      setUser(JSON.parse(userStr));
    } else {
      setUser(null);
    }
  };

  useEffect(() => {
    setMounted(true);
    checkUser();
    const handleAuthChange = () => {
      checkUser();
    };

    window.addEventListener("auth-change", handleAuthChange);

    return () => {
      window.removeEventListener("auth-change", handleAuthChange);
    };
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    
    window.dispatchEvent(new Event("auth-change"));
    
    router.push("/");
  };

  if (!mounted) return null;

  if (user) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-slate-700 font-bold">
            👋 Bonjour, <span className="text-orange-600">{user.name}</span>
        </span>
        <button 
            onClick={handleLogout}
            className="text-sm text-red-500 hover:text-red-700 font-medium hover:underline transition"
        >
            Se déconnecter
        </button>
        <Link 
            href="/routes/creation"
            className="bg-orange-600 hover:bg-orange-700 text-white px-5 py-2 rounded-full font-bold transition shadow-sm hover:shadow-orange-200"
        >
            + Créer
        </Link>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
        <Link 
            href="/auth/connexion"
            className="text-slate-600 hover:text-orange-600 font-bold py-2 px-3 transition"
        >
            Se connecter
        </Link>
        <Link 
            href="/auth/inscription"
            className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-full font-bold transition shadow-sm"
        >
            S'inscrire
        </Link>
    </div>
  );
}