import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <main className="w-full h-screen bg-[var(--brand-black)] flex flex-col items-center justify-center px-6 text-center">
      <h1 className="text-[var(--brand-yellow)] text-8xl md:text-[12rem] font-bebas leading-none mb-6 drop-shadow-2xl">
        LOST IN THE MUSIC
      </h1>
      <p className="text-[var(--brand-gray)] font-sans text-xl md:text-2xl mb-12 max-w-lg">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link 
        to="/"
        className="px-8 py-3 rounded-full border-2 border-[var(--brand-yellow)] text-[var(--brand-yellow)] font-bebas text-2xl tracking-widest hover:bg-[var(--brand-yellow)] hover:text-black transition-colors"
      >
        BACK TO HOME
      </Link>
    </main>
  );
}
