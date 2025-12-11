"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [term, setTerm] = useState(searchParams.get("q") || "");

  useEffect(() => {
    const timer = setTimeout(() => {
      if (term.trim() === "") {
        router.replace("/");
      } else {
        router.replace(`/?q=${encodeURIComponent(term)}`, { scroll: false });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [term, router]);

  return (
    <div className="mb-8">
      <input
        type="text"
        placeholder="Rechercher une recette (ex: poulet, italie)..."
        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
      />
      <p className="text-xs text-gray-400 mt-2 ml-1">
        La recherche se lance automatiquement...
      </p>
    </div>
  );
}
