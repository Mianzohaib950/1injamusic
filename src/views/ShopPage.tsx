import { useState, useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { categories } from "@/data/merch";
import { merchProducts } from "@/data/merch";
import type { MerchProduct } from "@/data/merch";
import MerchCard from "@/components/MerchCard";
import QuickAddModal from "@/components/QuickAddModal";
import { apiGet } from "@/lib/api";
import { getCachedProducts, loadProductsCatalog } from "@/lib/productCatalogClient";

gsap.registerPlugin(ScrollTrigger);

export default function ShopPage() {
  const sizeOptions = ["S", "M", "L", "XL"] as const;
  const baseCategoryOrder = ["TEE", "HOODIE", "CAP", "VINYL", "POSTER", "BUNDLE"];
  const [searchParams] = useSearchParams();
  const [activeArtist, setActiveArtist] = useState("All Artists");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [quickProduct, setQuickProduct] = useState<MerchProduct | null>(null);
  const [products, setProducts] = useState<MerchProduct[]>(() => getCachedProducts() ?? merchProducts);
  const [productsLoading, setProductsLoading] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 0]);
  const [priceRangeTouched, setPriceRangeTouched] = useState(false);
  const [heroTitle, setHeroTitle] = useState("OFFICIAL\nMERCH SHOP");
  const [heroBody, setHeroBody] = useState("Exclusive drops from Hintell, Dark Koko, Swazz & Mee$ch. Represent the movement.");
  const [heroSubtitle, setHeroSubtitle] = useState("");
  const [heroImage, setHeroImage] = useState("");
  const [contentTitle, setContentTitle] = useState("NEW DROPS EVERY MONTH");
  const [contentBody, setContentBody] = useState("Follow 1 Jamaica Music on Instagram for first access to limited drops and exclusive bundles.");
  const [shopCategories, setShopCategories] = useState<string[]>(() => categories.map((category) => category.toUpperCase()));
  const gridRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  const artists = ["All Artists", ...Array.from(new Set(products.map((product) => product.artist)))];
  const categoryOptions = useMemo(() => {
    const options = new Set(shopCategories);
    products.forEach((product) => {
      const category = String(product.category ?? "").trim();
      if (category) options.add(category.toUpperCase());
    });
    const merged = Array.from(options);
    const orderedBase = baseCategoryOrder.filter((category) => merged.includes(category));
    const extras = merged
      .filter((category) => !baseCategoryOrder.includes(category))
      .sort((a, b) => a.localeCompare(b));
    return [...orderedBase, ...extras];
  }, [products, shopCategories]);
  const productMaxPrice = useMemo(
    () => Math.max(0, ...products.map((product) => Math.ceil(Number(product.price) || 0))),
    [products],
  );
  const rangeMax = Math.max(productMaxPrice, 1);
  const selectedMinPrice = Math.min(priceRange[0], rangeMax);
  const selectedMaxPrice = Math.min(priceRange[1] || rangeMax, rangeMax);
  const priceMinPercent = (selectedMinPrice / rangeMax) * 100;
  const priceMaxPercent = (selectedMaxPrice / rangeMax) * 100;
  const priceRangeActive = priceRangeTouched && (selectedMinPrice > 0 || selectedMaxPrice < productMaxPrice);
  const categoryFilterLabel = selectedCategories.length === 0 ? "All Categories" : `${selectedCategories.length} Selected`;
  const sizeFilterLabel = selectedSizes.length === 0 ? "All Sizes" : `${selectedSizes.length} Selected`;
  const artistFilterLabel = activeArtist === "All Artists" ? "All Artists" : activeArtist;

  const filtered = useMemo(
    () => products.filter((p) => {
      const artistMatch =
        activeArtist === "All Artists" || p.artist === activeArtist;
      const catMatch =
        selectedCategories.length === 0 || selectedCategories.includes(p.category.toUpperCase());
      const price = Number(p.price) || 0;
      const priceMatch = productMaxPrice <= 0 || (price >= selectedMinPrice && price <= selectedMaxPrice);
      const stockBySize = p.stockBySize && typeof p.stockBySize === "object" ? p.stockBySize : undefined;
      const hasAnyStockBySize = Boolean(stockBySize) && Object.values(stockBySize ?? {}).some((qty) => Number(qty) > 0);
      const productInStock = Boolean(p.inStock) || hasAnyStockBySize;
      const stockMatch = !inStockOnly || productInStock;
      const sizeMatch =
        selectedSizes.length === 0
          ? true
          : selectedSizes.some((size) => {
            const hasSize = Array.isArray(p.sizes) && p.sizes.includes(size);
            if (!hasSize) return false;
            if (!stockBySize) return Boolean(p.inStock);
            return Number(stockBySize[size] ?? 0) > 0;
          });
      return artistMatch && catMatch && priceMatch && stockMatch && sizeMatch;
    }),
    [activeArtist, inStockOnly, productMaxPrice, products, selectedCategories, selectedMaxPrice, selectedMinPrice, selectedSizes],
  );

  useEffect(() => {
    let active = true;
    const loadProducts = async () => {
      setProductsLoading(true);
      try {
        const rows = await loadProductsCatalog({ force: Boolean(getCachedProducts()) });
        if (!active) return;
        setProducts((current) => {
          if (Array.isArray(rows) && rows.length > 0) return rows;
          return current.length > 0 ? current : merchProducts;
        });
        setProductsLoading(false);
      } catch {
        if (!active) return;
        setProducts((current) => (current.length > 0 ? current : merchProducts));
        setProductsLoading(false);
      }
    };
    loadProducts();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (productMaxPrice <= 0) {
      setPriceRange([0, 0]);
      return;
    }

    setPriceRange(([min, max]) => {
      if (!priceRangeTouched || max === 0) return [0, productMaxPrice];
      const nextMin = Math.min(min, productMaxPrice);
      const nextMax = Math.min(Math.max(max, nextMin), productMaxPrice);
      return [nextMin, nextMax];
    });
  }, [productMaxPrice, priceRangeTouched]);

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
    let active = true;
    const loadCategories = async () => {
      try {
        const rows = await apiGet<any[]>("/categories");
        if (!active || !Array.isArray(rows)) return;
        const options = rows
          .map((row) => String(row.slug ?? "").trim().toUpperCase())
          .filter(Boolean);
        if (options.length > 0) {
          setShopCategories(options);
        }
      } catch {
        // Keep fallback category list.
      }
    };
    loadCategories();
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
      setSelectedCategories([categoryFromQuery.toUpperCase()]);
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

  const updateMinPrice = (value: number) => {
    setPriceRangeTouched(true);
    setPriceRange(([, max]) => {
      const nextMax = max || rangeMax;
      return [Math.min(value, nextMax), nextMax];
    });
  };

  const updateMaxPrice = (value: number) => {
    setPriceRangeTouched(true);
    setPriceRange(([min]) => [min, Math.max(value, min)]);
  };

  const resetPriceRange = () => {
    setPriceRangeTouched(false);
    setPriceRange([0, productMaxPrice]);
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category],
    );
  };

  const removeCategory = (category: string) => {
    setSelectedCategories((current) => current.filter((item) => item !== category));
  };

  const toggleSize = (size: string) => {
    setSelectedSizes((current) =>
      current.includes(size) ? current.filter((item) => item !== size) : [...current, size],
    );
  };

  const removeSize = (size: string) => {
    setSelectedSizes((current) => current.filter((item) => item !== size));
  };

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
        <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-2">
          <SlidersHorizontal size={16} className="text-[var(--brand-yellow)] mr-1" />

          <details className="group relative">
            <summary className="list-none inline-flex min-w-[170px] cursor-pointer items-center justify-between gap-2 border border-[#333] px-3 py-2 font-bebas text-sm tracking-widest text-[var(--brand-gray)] hover:border-[var(--brand-yellow)] hover:text-[var(--brand-yellow)]">
              <span>CATEGORY: {categoryFilterLabel}</span>
              <ChevronDown className="h-4 w-4 text-[var(--brand-yellow)] transition-transform group-open:rotate-180" />
            </summary>
            <div className="absolute left-0 top-full mt-2 z-40 w-[220px] border border-[#333] bg-[#111] p-2">
              <label className="flex cursor-pointer items-center gap-2 px-2 py-2 font-bebas text-sm tracking-widest text-white hover:bg-white/5">
                <input
                  type="checkbox"
                  checked={selectedCategories.length === 0}
                  onChange={() => setSelectedCategories([])}
                  className="h-3.5 w-3.5 accent-[var(--brand-yellow)]"
                />
                ALL CATEGORIES
              </label>
              {categoryOptions.map((cat) => (
                <label key={cat} className="flex cursor-pointer items-center gap-2 px-2 py-2 font-bebas text-sm tracking-widest text-white hover:bg-white/5">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(cat)}
                    onChange={() => toggleCategory(cat)}
                    className="h-3.5 w-3.5 accent-[var(--brand-yellow)]"
                  />
                  {cat}
                </label>
              ))}
            </div>
          </details>

          <label className="inline-flex min-w-[170px] items-center justify-between gap-2 border border-[#333] px-3 py-2 font-bebas text-sm tracking-widest text-[var(--brand-gray)] hover:border-[var(--brand-green)] hover:text-[var(--brand-green)]">
            <span>ARTIST</span>
            <select
              value={activeArtist}
              onChange={(event) => setActiveArtist(event.target.value)}
              className="bg-transparent text-white focus:outline-none"
            >
              {artists.map((artist) => (
                <option key={artist} value={artist} className="bg-[#111] text-white">
                  {artist.toUpperCase()}
                </option>
              ))}
            </select>
          </label>

          <details className="group relative">
            <summary className="list-none inline-flex min-w-[150px] cursor-pointer items-center justify-between gap-2 border border-[#333] px-3 py-2 font-bebas text-sm tracking-widest text-[var(--brand-gray)] hover:border-[var(--brand-yellow)] hover:text-[var(--brand-yellow)]">
              <span>SIZE: {sizeFilterLabel}</span>
              <ChevronDown className="h-4 w-4 text-[var(--brand-yellow)] transition-transform group-open:rotate-180" />
            </summary>
            <div className="absolute left-0 top-full mt-2 z-40 w-[200px] border border-[#333] bg-[#111] p-2">
              <label className="flex cursor-pointer items-center gap-2 px-2 py-2 font-bebas text-sm tracking-widest text-white hover:bg-white/5">
                <input
                  type="checkbox"
                  checked={selectedSizes.length === 0}
                  onChange={() => setSelectedSizes([])}
                  className="h-3.5 w-3.5 accent-[var(--brand-yellow)]"
                />
                ALL SIZES
              </label>
              {sizeOptions.map((size) => (
                <label key={size} className="flex cursor-pointer items-center gap-2 px-2 py-2 font-bebas text-sm tracking-widest text-white hover:bg-white/5">
                  <input
                    type="checkbox"
                    checked={selectedSizes.includes(size)}
                    onChange={() => toggleSize(size)}
                    className="h-3.5 w-3.5 accent-[var(--brand-yellow)]"
                  />
                  {size}
                </label>
              ))}
            </div>
          </details>

          <label className={`inline-flex cursor-pointer items-center gap-2 border px-3 py-2 font-bebas text-sm tracking-widest transition-all duration-150 ${
            inStockOnly
              ? "border-[var(--brand-green)] bg-[var(--brand-green)] text-black"
              : "border-[#333] text-[var(--brand-gray)] hover:border-[var(--brand-green)] hover:text-[var(--brand-green)]"
          }`}>
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(event) => setInStockOnly(event.target.checked)}
              className="h-3.5 w-3.5 accent-[var(--brand-green)]"
            />
            IN STOCK ONLY
          </label>
        </div>

        <div className="max-w-7xl mx-auto mt-3 flex flex-col gap-3 border-t border-[#222] pt-3 sm:flex-row sm:items-center">
          <div className="flex shrink-0 items-center justify-between gap-4 sm:justify-start">
            <span className="font-bebas text-sm tracking-widest text-[var(--brand-gray)]">PRICE RANGE</span>
            <span className="min-w-[88px] font-bebas text-base tracking-widest text-[var(--brand-yellow)]">
              ${selectedMinPrice} - ${selectedMaxPrice}
            </span>
          </div>
          <div className="relative h-7 w-full sm:w-[340px] lg:w-[420px]">
            <div className="absolute left-0 right-0 top-1/2 h-0.5 -translate-y-1/2 bg-[#333]" />
            <div
              className="absolute top-1/2 h-0.5 -translate-y-1/2 bg-[var(--brand-yellow)]"
              style={{
                left: `${priceMinPercent}%`,
                right: `${100 - priceMaxPercent}%`,
              }}
            />
            <input
              type="range"
              min={0}
              max={rangeMax}
              step={1}
              value={selectedMinPrice}
              onChange={(event) => updateMinPrice(Number(event.target.value))}
              className="pointer-events-none absolute inset-x-0 top-1/2 h-0.5 w-full -translate-y-1/2 appearance-none bg-transparent accent-[var(--brand-yellow)] [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:bg-[var(--brand-yellow)] [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-black [&::-moz-range-thumb]:bg-[var(--brand-yellow)]"
              aria-label="Minimum price"
            />
            <input
              type="range"
              min={0}
              max={rangeMax}
              step={1}
              value={selectedMaxPrice}
              onChange={(event) => updateMaxPrice(Number(event.target.value))}
              className="pointer-events-none absolute inset-x-0 top-1/2 h-0.5 w-full -translate-y-1/2 appearance-none bg-transparent accent-[var(--brand-yellow)] [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:bg-[var(--brand-yellow)] [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-black [&::-moz-range-thumb]:bg-[var(--brand-yellow)]"
              aria-label="Maximum price"
            />
          </div>
          <button
            onClick={resetPriceRange}
            disabled={!priceRangeActive}
            className="w-fit font-bebas text-sm tracking-widest text-[var(--brand-gray)] hover:text-[var(--brand-yellow)] disabled:opacity-40 disabled:hover:text-[var(--brand-gray)]"
          >
            RESET
          </button>
        </div>

        {/* Active filter tags */}
        {(activeArtist !== "All Artists" || selectedCategories.length > 0 || selectedSizes.length > 0 || inStockOnly || priceRangeActive) && (
          <div className="max-w-7xl mx-auto mt-3 flex items-center gap-2">
            <span className="text-[var(--brand-gray)] font-sans text-xs">Filtered:</span>
            {activeArtist !== "All Artists" && (
              <span className="flex items-center gap-1 bg-[#1a1a1a] border border-[#333] text-white font-sans text-xs px-3 py-1">
                {activeArtist}
                <button onClick={() => setActiveArtist("All Artists")} className="text-[var(--brand-gray)] hover:text-white ml-1"><X size={10} /></button>
              </span>
            )}
            {inStockOnly && (
              <span className="flex items-center gap-1 bg-[#1a1a1a] border border-[#333] text-white font-sans text-xs px-3 py-1">
                In Stock
                <button onClick={() => setInStockOnly(false)} className="text-[var(--brand-gray)] hover:text-white ml-1"><X size={10} /></button>
              </span>
            )}
            {selectedCategories.map((category) => (
              <span key={category} className="flex items-center gap-1 bg-[#1a1a1a] border border-[#333] text-white font-sans text-xs px-3 py-1">
                {category}
                <button onClick={() => removeCategory(category)} className="text-[var(--brand-gray)] hover:text-white ml-1"><X size={10} /></button>
              </span>
            ))}
            {selectedSizes.map((size) => (
              <span key={size} className="flex items-center gap-1 bg-[#1a1a1a] border border-[#333] text-white font-sans text-xs px-3 py-1">
                Size {size}
                <button onClick={() => removeSize(size)} className="text-[var(--brand-gray)] hover:text-white ml-1"><X size={10} /></button>
              </span>
            ))}
            {priceRangeActive && (
              <span className="flex items-center gap-1 bg-[#1a1a1a] border border-[#333] text-white font-sans text-xs px-3 py-1">
                ${selectedMinPrice} - ${selectedMaxPrice}
                <button onClick={resetPriceRange} className="text-[var(--brand-gray)] hover:text-white ml-1"><X size={10} /></button>
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
          key={`${activeArtist}-${selectedCategories.join("-") || "All"}`}
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
