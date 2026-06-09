import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SlidersHorizontal, X } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { categories } from "@/data/merch";
import type { MerchProduct } from "@/data/merch";
import MerchCard from "@/components/MerchCard";
import QuickAddModal from "@/components/QuickAddModal";
import { apiGet } from "@/lib/api";
import { getCachedProducts, loadProductsCatalog } from "@/lib/productCatalogClient";

gsap.registerPlugin(ScrollTrigger);

const CATS = ["All", ...categories.map((c) => c.toUpperCase())];

export default function ShopPage() {
  const [searchParams] = useSearchParams();
  const [activeArtist, setActiveArtist] = useState("All Artists");
  const [activeCat, setActiveCat] = useState("All");
  const [quickProduct, setQuickProduct] = useState<MerchProduct | null>(null);
  const [products, setProducts] = useState<MerchProduct[]>(() => getCachedProducts() ?? []);
  const [productsLoading, setProductsLoading] = useState(() => !getCachedProducts());
  const [heroTitle, setHeroTitle] = useState("OFFICIAL\nMERCH SHOP");
  const [heroBody, setHeroBody] = useState("Exclusive drops from Hintell, Dark Koko, Swazz & Mee$ch. Represent the movement.");
  const [heroSubtitle, setHeroSubtitle] = useState("");
  const [heroImage, setHeroImage] = useState("");
  const [contentTitle, setContentTitle] = useState("NEW DROPS EVERY MONTH");
  const [contentBody, setContentBody] = useState("Follow 1 Jamaica Music on Instagram for first access to limited drops and exclusive bundles.");
  const gridRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  const artists = ["All Artists", ...Array.from(new Set(products.map((product) => product.artist)))];

  const filtered = products.filter((p) => {
    const artistMatch =
      activeArtist === "All Artists" || p.artist === activeArtist;
    const catMatch =
      activeCat === "All" || p.category.toUpperCase() === activeCat;
    return artistMatch && catMatch;
  });

  useEffect(() => {
    let active = true;
    const loadProducts = async () => {
      try {
        const rows = await loadProductsCatalog();
        if (!active) return;
        setProducts(rows);
        setProductsLoading(false);
      } catch {
        if (active) setProductsLoading(false);
      }
    };
    loadProducts();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const loadCms = async () => {
      try {
        const data = await apiGet<any>("/cms/shop");
        if (!active) return;
        const sections = Array.isArray(data?.sections) ? data.sections : [];
        const hero = sections.find((section: any) => section.sectionKey === "hero");
        const content = sections.find((section: any) => section.sectionKey === "content");
        setHeroTitle(String(hero?.title || "OFFICIAL\nMERCH SHOP"));
        setHeroSubtitle(String(hero?.subtitle || ""));
        setHeroBody(String(hero?.body || "Exclusive drops from Hintell, Dark Koko, Swazz & Mee$ch. Represent the movement."));
        setHeroImage(String(hero?.imageUrl || ""));
        setContentTitle(String(content?.title || "NEW DROPS EVERY MONTH"));
        setContentBody(String(content?.body || "Follow 1 Jamaica Music on Instagram for first access to limited drops and exclusive bundles."));
      } catch {
        // Keep static fallback content.
      }
    };
    loadCms();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const artistFromQuery = searchParams.get("artist");
    const categoryFromQuery = searchParams.get("category");

    if (artistFromQuery) {
      setActiveArtist(artistFromQuery);
    }
    if (categoryFromQuery) {
      setActiveCat(categoryFromQuery.toUpperCase());
    }
  }, [searchParams]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".shop-hero-text span", {
        y: 80,
        opacity: 0,
        stagger: 0.02,
        ease: "power4.out",
        duration: 1,
        delay: 0.1,
      });
    }, heroRef);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".merch-grid-card", {
        y: 40,
        opacity: 0,
        stagger: 0.05,
        ease: "power3.out",
        duration: 0.6,
        scrollTrigger: {
          trigger: gridRef.current,
          start: "top 85%",
        },
      });
    }, gridRef);
    return () => ctx.revert();
  }, [filtered]);

  const splitHero = (text: string) =>
    text
      .split(/\s+/)
      .filter(Boolean)
      .map((word, wordIndex) => (
        <span key={`${word}-${wordIndex}`} className="inline-block whitespace-nowrap mr-[0.18em]">
          {word.split("").map((ch, charIndex) => (
            <span key={`${ch}-${charIndex}`} className="inline-block">
              {ch}
            </span>
          ))}
        </span>
      ));

  const cleanHeroTitle = String(heroTitle || "").trim();
  const heroLines = (() => {
    const fromNewLine = cleanHeroTitle.split("\n").map((line) => line.trim()).filter(Boolean);
    if (fromNewLine.length > 0) return fromNewLine;
    const cleanSubtitle = String(heroSubtitle || "").trim();
    if (cleanSubtitle) return [cleanHeroTitle, cleanSubtitle].filter(Boolean);
    return ["OFFICIAL", "MERCH SHOP"];
  })();

  return (
    <main className="w-full bg-[var(--brand-black)] min-h-screen">
      <QuickAddModal product={quickProduct} onClose={() => setQuickProduct(null)} />

      {/* HERO */}
      <section
        ref={heroRef}
        className="relative pt-40 pb-20 px-6 md:px-12 border-b border-[#222] overflow-hidden"
      >
        {heroImage && (
          <div
            className="absolute inset-0 z-0 bg-cover bg-center brightness-[0.28]"
            style={{ backgroundImage: `url('${heroImage}')` }}
          />
        )}
        <div className="absolute inset-0 z-0 bg-black/60" />
        <div className="absolute inset-0 hero-grid opacity-10 pointer-events-none" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[140px] opacity-10 pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(232,255,0,0.3) 0%, transparent 70%)" }} />

        <div className="relative z-10 max-w-7xl mx-auto">
          <span className="inline-block text-[var(--brand-yellow)] font-bebas text-lg tracking-[0.3em] mb-4">
            1 JAMAICA MUSIC
          </span>
          <h1 className="shop-hero-text text-white font-bebas text-7xl md:text-[9rem] leading-none mb-6">
            {heroLines.map((line, index) => (
              <span key={`${line}-${index}`}>
                {splitHero(line.toUpperCase())}
                {index < heroLines.length - 1 && <br />}
              </span>
            ))}
          </h1>
          <p className="text-[var(--brand-gray)] font-sans text-lg max-w-xl">
            {heroBody}
          </p>
        </div>
      </section>

      {/* FILTERS */}
      <section className="sticky top-[72px] z-30 bg-[#0A0A0A]/95 backdrop-blur-xl border-b border-[#222] px-6 md:px-12 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* Category pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <SlidersHorizontal size={16} className="text-[var(--brand-yellow)] flex-shrink-0" />
            {CATS.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCat(cat)}
                className={`font-bebas text-base tracking-widest px-4 py-1 border transition-all duration-150 ${
                  activeCat === cat
                    ? "border-[var(--brand-yellow)] bg-[var(--brand-yellow)] text-black"
                    : "border-[#333] text-[var(--brand-gray)] hover:border-[var(--brand-yellow)] hover:text-[var(--brand-yellow)]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Artist select */}
          <div className="flex items-center gap-2 flex-wrap">
            {artists.map((a) => (
              <button
                key={a}
                onClick={() => setActiveArtist(a)}
                className={`font-bebas text-base tracking-widest px-4 py-1 border transition-all duration-150 rounded-full ${
                  activeArtist === a
                    ? "border-[var(--brand-green)] bg-[var(--brand-green)] text-black"
                    : "border-[#333] text-[var(--brand-gray)] hover:border-[var(--brand-green)] hover:text-[var(--brand-green)]"
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        {/* Active filter tags */}
        {(activeArtist !== "All Artists" || activeCat !== "All") && (
          <div className="max-w-7xl mx-auto mt-3 flex items-center gap-2">
            <span className="text-[var(--brand-gray)] font-sans text-xs">Filtered:</span>
            {activeArtist !== "All Artists" && (
              <span className="flex items-center gap-1 bg-[#1a1a1a] border border-[#333] text-white font-sans text-xs px-3 py-1">
                {activeArtist}
                <button onClick={() => setActiveArtist("All Artists")} className="text-[var(--brand-gray)] hover:text-white ml-1"><X size={10} /></button>
              </span>
            )}
            {activeCat !== "All" && (
              <span className="flex items-center gap-1 bg-[#1a1a1a] border border-[#333] text-white font-sans text-xs px-3 py-1">
                {activeCat}
                <button onClick={() => setActiveCat("All")} className="text-[var(--brand-gray)] hover:text-white ml-1"><X size={10} /></button>
              </span>
            )}
          </div>
        )}
      </section>

      {/* GRID */}
      <section ref={gridRef} className="max-w-7xl mx-auto px-6 md:px-12 py-16">
        <div className="flex items-center justify-between mb-8">
          <p className="text-[var(--brand-gray)] font-sans text-sm">
            {filtered.length} product{filtered.length !== 1 ? "s" : ""}
          </p>
          {productsLoading && <p className="text-[var(--brand-gray)] font-sans text-xs">Loading products...</p>}
        </div>

        <motion.div
          key={`${activeArtist}-${activeCat}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5"
        >
          {filtered.map((product) => (
            <div key={product.id} className="merch-grid-card">
              <MerchCard product={product} onQuickAdd={setQuickProduct} />
            </div>
          ))}
        </motion.div>
      </section>

      {/* CTA STRIP */}
      <section className="bg-[var(--brand-yellow)] py-16 px-6 md:px-12 text-center">
        <h2 className="text-black font-bebas text-5xl md:text-7xl mb-4">
          {contentTitle}
        </h2>
        <p className="text-black/70 font-sans text-lg max-w-xl mx-auto">
          {contentBody}
        </p>
      </section>
    </main>
  );
}
