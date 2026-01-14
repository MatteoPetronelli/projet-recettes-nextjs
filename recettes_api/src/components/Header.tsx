
"use client";
import SearchBar from "@/components/SearchBar";
import FilterTabs from "@/components/FilterTabs";
import UserHeader from "@/components/UserHeader";

export default function Header() {
  return (
     <div className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/80 border-b border-slate-200/60 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0 cursor-pointer group" onClick={() => window.scrollTo({top:0, behavior:'smooth'})}>
              <h1 className="text-2xl font-black tracking-tighter text-slate-800 group-hover:scale-105 transition-transform">
                Miam<span className="text-orange-600">Miam</span>
                <span className="text-3xl ml-1 inline-block group-hover:rotate-12 transition-transform">🍳</span>
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <UserHeader />
            </div>
          </div>
          <div className="pb-4 pt-2 flex flex-col md:flex-row gap-4 md:items-center justify-between">
            <div className="w-full md:w-1/2 lg:w-1/3">
              <SearchBar />
            </div>
            <div className="overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
              <FilterTabs />
            </div>
          </div>
        </div>
      </div>
  );
}