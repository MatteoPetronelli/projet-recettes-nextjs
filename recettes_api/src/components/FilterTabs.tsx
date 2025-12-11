"use client";

import { useRouter, useSearchParams } from "next/navigation";

const types = ["Entrée", "Plat", "Dessert"];

export default function FilterTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentType = searchParams.get("type");

  const handleFilter = (type: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (currentType === type) {
      params.delete("type");
    } else {
      params.set("type", type);
    }

    router.replace(`/?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
      {types.map((type) => (
        <button
          key={type}
          onClick={() => handleFilter(type)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition whitespace-nowrap ${
            currentType === type
              ? "bg-orange-600 text-white shadow-md"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {type}
        </button>
      ))}
    </div>
  );
}