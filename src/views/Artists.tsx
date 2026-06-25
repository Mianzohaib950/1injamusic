import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { Search, X } from "lucide-react";
import { apiGet } from "@/lib/api";
import { artistProfiles, type ArtistProfile } from "@/data/artists";

const ARTISTS_REQUEST_TIMEOUT_MS = 8_000;

function isAbortError(error: unknown) {
  const value = error as { name?: string; message?: string };
  return value?.name === "AbortError" || /aborted/i.test(String(value?.message ?? ""));
}

const splitText = (text: string) => {
  return text.split("").map((char, index) => (
    <span key={index} className="inline-block opacity-0 translate-y-[60px]">
      {char === " " ? "\u00A0" : char}
    </span>
  ));
};

export default function Artists() {
  const heroRef = useRef<HTMLHeadingElement>(null);
  const [artists, setArtists] = useState<ArtistProfile[]>(artistProfiles);
  const [heroTitle, setHeroTitle] = useState("OUR ARTISTS");
  const [heroBody, setHeroBody] = useState("Representing the sound of Jamaica to the world.");
  const [heroImage, setHeroImage] = useState("");
  const [contentTitle, setContentTitle] = useState("OUR ARTISTS");
  const [searchQuery, setSearchQuery] = useState("");
  const filteredArtists = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return artists;

    return artists.filter((artist) => {
      const searchable = [
        artist.name,
        artist.slug,
        artist.bio,
        ...artist.genres,
      ].join(" ").toLowerCase();
      return searchable.includes(query);
    });
  }, [artists, searchQuery]);

  useEffect(() => {
    const chars = heroRef.current?.querySelectorAll("span");
    if (chars) {
      gsap.to(chars, {
        y: 0,
        opacity: 1,
        stagger: 0.03,
        ease: "power4.out",
        duration: 1,
        delay: 0.2
      });
    }
  }, []);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), ARTISTS_REQUEST_TIMEOUT_MS);
    const loadArtists = async () => {
      try {
        const rows = await apiGet<ArtistProfile[]>(`/artists?t=${Date.now()}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (active && Array.isArray(rows)) {
          setArtists(rows);
        }
      } catch (error) {
        if (isAbortError(error)) return;
        // Keep bundled artists as fallback when API is unavailable.
      } finally {
        window.clearTimeout(timeoutId);
      }
    };
    loadArtists();
    return () => {
      active = false;
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    let active = true;
    const loadCms = async () => {
      try {
        const data = await apiGet<any>("/cms/artists");
        if (!active) return;
        const sections = Array.isArray(data?.sections) ? data.sections : [];
        const hero = sections.find((section: any) => section.sectionKey === "hero");
        const content = sections.find((section: any) => section.sectionKey === "content");
        setHeroTitle(String(hero?.title || "OUR ARTISTS"));
        setHeroBody(String(hero?.body || "Representing the sound of Jamaica to the world."));
        setHeroImage(String(hero?.imageUrl || ""));
        setContentTitle(String(content?.title || "OUR ARTISTS"));
      } catch {
        // Keep static fallback content.
      }
    };
    loadCms();
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="w-full bg-[var(--brand-black)] min-h-screen pt-32 pb-24 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        
        <div
          className="text-center mb-24 py-16 md:py-20 border border-[var(--brand-border)] relative overflow-hidden"
        >
          {heroImage && (
            <div
              className="absolute inset-0 z-0 bg-cover bg-center brightness-[0.35]"
              style={{ backgroundImage: `url('${heroImage}')` }}
            />
          )}
          <div className="absolute inset-0 z-0 bg-black/60" />
          <div className="relative z-10 px-4">
          <h1 ref={heroRef} className="text-white text-7xl md:text-[9rem] font-bebas leading-none mb-6">
            {splitText(heroTitle.toUpperCase())}
          </h1>
          <p className="text-[var(--brand-gray)] font-sans text-xl max-w-2xl mx-auto">
            {heroBody}
          </p>
          </div>
        </div>

        <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <span className="inline-block text-[var(--brand-yellow)] font-bebas text-xl tracking-widest">{contentTitle}</span>
          <div className="relative w-full md:w-[360px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--brand-yellow)]" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search artists"
              className="w-full border border-[#333] bg-[#0A0A0A] py-3 pl-10 pr-10 font-sans text-sm text-white outline-none transition-colors placeholder:text-[var(--brand-gray)] focus:border-[var(--brand-yellow)]"
              aria-label="Search artists"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--brand-gray)] transition-colors hover:text-white"
                aria-label="Clear artist search"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {filteredArtists.map((artist) => (
            <Link 
              to={`/artists/${artist.slug}`} 
              key={artist.slug}
              className="group relative block aspect-[16/10] overflow-hidden border border-[var(--brand-border)]"
            >
              <div 
                className={`absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105 brightness-50 ${artist.image ? "" : "bg-[#101010]"}`}
                style={artist.image ? { backgroundImage: `url('${artist.image}')` } : undefined}
              />
              
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/70 transition-colors duration-500" />

              <div className="absolute inset-0 p-8 flex flex-col justify-between z-10">
                <div className="flex gap-2 flex-wrap">
                  {artist.genres.map(g => (
                    <span key={g} className="bg-[var(--brand-yellow)] text-black font-bebas px-4 py-1 text-sm tracking-widest rounded-full">
                      {g}
                    </span>
                  ))}
                </div>
                
                <div>
                  <h2 className="text-white text-6xl md:text-8xl font-bebas leading-none mb-2 drop-shadow-xl group-hover:text-[var(--brand-yellow)] transition-colors duration-300">
                    {artist.name}
                  </h2>
                </div>
              </div>

              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                <span className="px-8 py-3 rounded-full border-2 border-[var(--brand-yellow)] text-[var(--brand-yellow)] font-bebas text-2xl tracking-widest bg-black/50 backdrop-blur-sm">
                  VIEW ARTIST
                </span>
              </div>
            </Link>
          ))}
        </div>

        {filteredArtists.length === 0 && (
          <div className="border border-[#222] bg-[#111] px-6 py-12 text-center">
            <p className="font-bebas text-3xl tracking-widest text-[var(--brand-gray)]">NO ARTISTS FOUND</p>
          </div>
        )}

      </div>
    </main>
  );
}
