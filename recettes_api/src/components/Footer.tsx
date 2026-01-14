"use client";

export default function Footer() {
    return (
        <footer className="w-full bg-slate-500 text-slate-200 py-6 mt-12">
            <div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <p className="text-sm">
                        &copy; {new Date().getFullYear()} MiamMiam. Tous droits réservés.
                    </p>
                </div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 text-center cursor-pointer group" onClick={() => window.scrollTo({top:0, behavior:'smooth'})}>
                    <h1 className="text-2xl font-black tracking-tighter text-slate-800 group-hover:scale-105 transition-transform">
                        Miam<span className="text-orange-600">Miam</span>
                        <span className="text-3xl ml-1 inline-block group-hover:rotate-12 transition-transform">🍳</span>
                    </h1>
                </div>
            </div>
        </footer>
    );
}