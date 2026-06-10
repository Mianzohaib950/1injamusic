import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ShoppingBag, ChevronRight, Minus, Plus, Share2, Heart } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { MerchProduct } from "@/data/merch";
import { useCart } from "@/context/CartContext";
import MerchCard from "@/components/MerchCard";
import QuickAddModal from "@/components/QuickAddModal";
import { getCachedProducts, loadProductsCatalog } from "@/lib/productCatalogClient";
import { toast } from "sonner";

gsap.registerPlugin(ScrollTrigger);

const BADGE_STYLES: Record<string, string> = {
  NEW: "bg-[var(--brand-yellow)] text-black",
  LIMITED: "bg-[var(--brand-green)] text-black",
  SALE: "bg-red-500 text-white",
};

const CATEGORY_LABELS: Record<string, string> = {
  tee: "T-SHIRT",
  hoodie: "HOODIE",
  cap: "CAP",
  vinyl: "VINYL",
  poster: "POSTER",
  bundle: "BUNDLE",
};

export default function ProductDetail() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [products, setProducts] = useState<MerchProduct[]>(() => getCachedProducts() ?? []);
  const [productsLoading, setProductsLoading] = useState(() => !getCachedProducts());
  const product = products.find((item) => item.id === (productId ?? ""));
  const [activeImg, setActiveImg] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [sizeError, setSizeError] = useState(false);
  const [added, setAdded] = useState(false);
  const [quickProduct, setQuickProduct] = useState<MerchProduct | null>(null);
  const [mainImageFailed, setMainImageFailed] = useState(false);
  const [wishlistActive, setWishlistActive] = useState(false);

  const heroRef = useRef<HTMLDivElement>(null);
  const relatedRef = useRef<HTMLDivElement>(null);

  const images = product ? [product.image, product.imageHover] : [];
  const fallbackImage = product ? `https://picsum.photos/seed/${product.id}-detail/1200/1200` : "";

  // related = same artist, exclude self, max 4
  const related = product
    ? products
        .filter((item) => item.artistSlug === product.artistSlug)
        .filter((p) => p.id !== product.id)
        .slice(0, 4)
    : [];

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
    setActiveImg(0);
    setMainImageFailed(false);
    setSelectedSize("");
    setQuantity(1);
    setSizeError(false);
    setAdded(false);
    window.scrollTo({ top: 0 });
  }, [productId]);

  useEffect(() => {
    if (!product) return;
    const ctx = gsap.context(() => {
      gsap.from(".pd-reveal", {
        y: 30,
        opacity: 0,
        stagger: 0.08,
        ease: "power3.out",
        duration: 0.7,
        delay: 0.1,
      });
    }, heroRef);
    return () => ctx.revert();
  }, [product]);

  useEffect(() => {
    if (!related.length) return;
    const ctx = gsap.context(() => {
      gsap.from(".related-card", {
        y: 40,
        opacity: 0,
        stagger: 0.07,
        ease: "power3.out",
        duration: 0.6,
        scrollTrigger: {
          trigger: relatedRef.current,
          start: "top 85%",
        },
      });
    }, relatedRef);
    return () => ctx.revert();
  }, [related]);

  if (productsLoading) {
    return (
      <main className="min-h-screen bg-[var(--brand-black)] flex flex-col items-center justify-center pt-32 px-6">
        <p className="text-[var(--brand-gray)] font-bebas text-3xl mb-6">LOADING PRODUCT...</p>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="min-h-screen bg-[var(--brand-black)] flex flex-col items-center justify-center pt-32 px-6">
        <p className="text-[var(--brand-gray)] font-bebas text-3xl mb-6">PRODUCT NOT FOUND</p>
        <button
          onClick={() => navigate("/shop")}
          className="px-8 py-3 bg-[var(--brand-yellow)] text-black font-bebas text-xl tracking-widest hover:bg-white transition-colors"
        >
          BACK TO SHOP
        </button>
      </main>
    );
  }

  const handleAddToCart = () => {
    if (!selectedSize) { setSizeError(true); return; }
    const addedToCart = addToCart(product, selectedSize, quantity);
    if (!addedToCart) {
      navigate("/auth", { state: { from: `/shop/${product.id}`, tab: "login" } });
      return;
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 2200);
  };

  const handleWishlist = () => {
    setWishlistActive((value) => !value);
    toast.success(wishlistActive ? "Removed from wishlist" : "Added to wishlist");
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/shop/${product.id}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: product.name,
          text: `${product.artist} - ${product.name}`,
          url: shareUrl,
        });
        return;
      }
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Product link copied");
    } catch {
      toast.error("Unable to share right now");
    }
  };

  return (
    <main className="w-full min-h-screen bg-[var(--brand-black)]">
      <QuickAddModal product={quickProduct} onClose={() => setQuickProduct(null)} />

      {/* Breadcrumb */}
      <div className="pt-28 pb-4 px-6 md:px-12 max-w-7xl mx-auto">
        <nav className="flex items-center gap-2 text-[var(--brand-gray)] font-sans text-sm">
          <Link to="/" className="hover:text-[var(--brand-yellow)] transition-colors">Home</Link>
          <ChevronRight size={14} />
          <Link to="/shop" className="hover:text-[var(--brand-yellow)] transition-colors">Shop</Link>
          <ChevronRight size={14} />
          <Link
            to={`/shop?artist=${encodeURIComponent(product.artist)}`}
            className="hover:text-[var(--brand-yellow)] transition-colors"
          >
            {product.artist}
          </Link>
          <ChevronRight size={14} />
          <span className="text-white truncate max-w-[200px]">{product.name}</span>
        </nav>
      </div>

      {/* Main Product Section */}
      <section ref={heroRef} className="max-w-7xl mx-auto px-6 md:px-12 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">

          {/* LEFT — Image Gallery */}
          <div className="flex flex-col gap-4">
            {/* Main Image */}
            <motion.div
              key={activeImg}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35 }}
              className="relative aspect-square bg-[#111] border border-[#222] overflow-hidden"
            >
              <img
                src={mainImageFailed ? fallbackImage : (images[activeImg] || fallbackImage)}
                alt={product.name}
                onError={() => setMainImageFailed(true)}
                className="w-full h-full object-cover"
              />
              {product.badge && (
                <span className={`absolute top-4 left-4 font-bebas text-base px-4 py-1 tracking-widest ${BADGE_STYLES[product.badge]}`}>
                  {product.badge}
                </span>
              )}
            </motion.div>

            {/* Thumbnails */}
            <div className="flex gap-3">
              {images.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`w-20 h-20 border-2 overflow-hidden flex-shrink-0 transition-all ${
                    activeImg === i
                      ? "border-[var(--brand-yellow)]"
                      : "border-[#222] hover:border-[#444]"
                  }`}
                >
                  <img src={src} alt={`View ${i + 1}`} onError={() => setMainImageFailed(true)} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT — Product Info */}
          <div className="flex flex-col gap-6">

            {/* Artist + Category */}
            <div className="pd-reveal flex items-center gap-3">
              <Link
                to={`/artists/${product.artistSlug}`}
                className="text-[var(--brand-yellow)] font-bebas text-lg tracking-widest hover:opacity-75 transition-opacity"
              >
                {product.artist.toUpperCase()}
              </Link>
              <span className="text-[#333]">·</span>
              <span className="text-[var(--brand-gray)] font-bebas text-lg tracking-widest">
                {CATEGORY_LABELS[product.category] ?? product.category.toUpperCase()}
              </span>
            </div>

            {/* Name */}
            <h1 className="pd-reveal text-white font-bebas text-4xl md:text-5xl leading-tight">
              {product.name}
            </h1>

            {/* Price */}
            <div className="pd-reveal flex items-baseline gap-4">
              <span className="text-[var(--brand-yellow)] font-bebas text-5xl">
                ${product.price}
              </span>
              {product.originalPrice && (
                <>
                  <span className="text-[var(--brand-gray)] font-sans text-xl line-through">
                    ${product.originalPrice}
                  </span>
                  <span className="bg-red-500 text-white font-bebas text-sm px-2 py-0.5 tracking-widest">
                    SAVE ${product.originalPrice - product.price}
                  </span>
                </>
              )}
            </div>

            {/* Divider */}
            <div className="pd-reveal h-px bg-[#222]" />

            {/* Size Selector */}
            <div className="pd-reveal">
              <div className="flex items-center justify-between mb-3">
                <span className={`font-bebas tracking-widest ${sizeError ? "text-red-400" : "text-[var(--brand-gray)]"}`}>
                  {sizeError ? "PLEASE SELECT A SIZE" : "SELECT SIZE"}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => { setSelectedSize(size); setSizeError(false); }}
                    className={`px-5 py-2.5 font-bebas text-lg tracking-widest border-2 transition-all duration-150 ${
                      selectedSize === size
                        ? "border-[var(--brand-yellow)] bg-[var(--brand-yellow)] text-black"
                        : "border-[#333] text-white hover:border-[var(--brand-yellow)]"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity + Add to Cart */}
            <div className="pd-reveal flex gap-3">
              {/* Qty */}
              <div className="flex items-center border-2 border-[#333]">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-3 text-[var(--brand-gray)] hover:text-white transition-colors"
                >
                  <Minus size={16} />
                </button>
                <span className="px-5 text-white font-bebas text-2xl min-w-[50px] text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-4 py-3 text-[var(--brand-gray)] hover:text-white transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>

              {/* Add to Cart */}
              <button
                onClick={handleAddToCart}
                className={`flex-1 flex items-center justify-center gap-3 font-bebas text-xl tracking-widest py-3 transition-all duration-200 ${
                  added
                    ? "bg-[var(--brand-green)] text-black"
                    : "bg-[var(--brand-yellow)] text-black hover:bg-white"
                }`}
              >
                <ShoppingBag size={20} />
                {added ? "ADDED TO CART!" : `ADD TO CART - $${(product.price * quantity).toFixed(2)}`}
              </button>
            </div>

            {/* Share / Wishlist */}
            <div className="pd-reveal flex items-center gap-4">
              <button onClick={handleWishlist} className={`flex items-center gap-2 font-sans text-sm transition-colors ${wishlistActive ? "text-[var(--brand-yellow)]" : "text-[var(--brand-gray)] hover:text-[var(--brand-yellow)]"}`}>
                <Heart size={16} /> Wishlist
              </button>
              <button onClick={handleShare} className="flex items-center gap-2 text-[var(--brand-gray)] hover:text-[var(--brand-yellow)] font-sans text-sm transition-colors">
                <Share2 size={16} /> Share
              </button>
            </div>

            {/* Divider */}
            <div className="pd-reveal h-px bg-[#222]" />

            {/* Description */}
            <div className="pd-reveal">
              <h3 className="text-[var(--brand-yellow)] font-bebas text-xl tracking-widest mb-3">PRODUCT DETAILS</h3>
              <p className="text-[var(--brand-gray)] font-sans text-base leading-relaxed">
                {product.description}
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 mt-8">
        <div className="h-px bg-[#1a1a1a]" />
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <section ref={relatedRef} className="max-w-7xl mx-auto px-6 md:px-12 py-20">
          <div className="flex items-center justify-between mb-10">
            <div>
              <span className="block text-[var(--brand-yellow)] font-bebas text-lg tracking-widest mb-1">
                MORE FROM {product.artist.toUpperCase()}
              </span>
              <h2 className="text-white font-bebas text-4xl md:text-5xl leading-none">
                YOU MIGHT ALSO LIKE
              </h2>
            </div>
            <Link
              to="/shop"
              className="hidden sm:inline-flex items-center gap-2 border border-[#333] text-[var(--brand-gray)] font-bebas tracking-widest px-5 py-2 hover:border-[var(--brand-yellow)] hover:text-[var(--brand-yellow)] transition-colors"
            >
              VIEW ALL <ChevronRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {related.map((p) => (
              <div key={p.id} className="related-card">
                <MerchCard product={p} onQuickAdd={setQuickProduct} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CTA Strip */}
      <section className="bg-[#111] border-t border-[#1a1a1a] py-14 text-center px-6">
        <p className="text-[var(--brand-gray)] font-bebas text-2xl tracking-widest mb-4">
          EXPLORE THE FULL COLLECTION
        </p>
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 px-8 py-4 bg-[var(--brand-yellow)] text-black font-bebas text-xl tracking-widest hover:bg-white transition-colors"
        >
          SHOP ALL MERCH <ShoppingBag size={18} />
        </Link>
      </section>
    </main>
  );
}
