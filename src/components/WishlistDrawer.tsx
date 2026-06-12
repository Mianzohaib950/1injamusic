import { AnimatePresence, motion } from "framer-motion";
import { Heart, ShoppingBag, Trash2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import type { MerchProduct } from "@/data/merch";

const CATEGORY_OPTIONS: MerchProduct["category"][] = ["tee", "hoodie", "cap", "vinyl", "poster", "bundle"];
const BADGE_OPTIONS: Array<Exclude<MerchProduct["badge"], null>> = ["NEW", "LIMITED", "SALE"];

export default function WishlistDrawer() {
  const { isLoggedIn, wishlistItems, isWishlistOpen, setWishlistOpen, toggleWishlist } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const visibleItems = wishlistItems.filter((item) => item.product);

  const handleAddToCart = (productId: string) => {
    const item = visibleItems.find((row) => row.productId === productId);
    const product = item?.product;
    if (!product) return;

    const category = CATEGORY_OPTIONS.includes(product.category as MerchProduct["category"])
      ? (product.category as MerchProduct["category"])
      : "tee";
    const badge = BADGE_OPTIONS.includes((product.badge ?? "").toUpperCase() as Exclude<MerchProduct["badge"], null>)
      ? ((product.badge ?? "").toUpperCase() as Exclude<MerchProduct["badge"], null>)
      : null;

    const mappedProduct: MerchProduct = {
      id: product.id,
      name: product.name,
      artist: product.artist,
      artistSlug: product.artistSlug,
      category,
      price: product.price,
      originalPrice: product.originalPrice,
      image: product.image,
      imageHover: product.imageHover,
      description: product.description,
      badge,
      sizes: product.sizes,
      inStock: product.inStock,
    };
    const preferredSize = product.sizes?.[0] || "One Size";
    const added = addToCart(mappedProduct, preferredSize, 1);
    if (!added) {
      setWishlistOpen(false);
      navigate("/auth", { state: { from: "/shop", tab: "login" } });
    }
  };

  return (
    <AnimatePresence>
      {isWishlistOpen && (
        <>
          <motion.div
            key="wishlist-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[55] bg-black/60 backdrop-blur-sm"
            onClick={() => setWishlistOpen(false)}
          />

          <motion.div
            key="wishlist-drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="fixed top-0 right-0 h-full w-full max-w-[420px] z-[56] bg-[#0f0f0f] border-l border-[#222] flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#222]">
              <div className="flex items-center gap-3">
                <Heart size={20} className="text-[var(--brand-yellow)]" />
                <span className="text-white font-bebas text-2xl tracking-widest">WISHLIST</span>
                {visibleItems.length > 0 && (
                  <span className="bg-[var(--brand-yellow)] text-black font-bebas text-sm px-2 py-0.5 rounded-full leading-none">
                    {visibleItems.length}
                  </span>
                )}
              </div>
              <button
                onClick={() => setWishlistOpen(false)}
                className="text-[var(--brand-gray)] hover:text-white transition-colors"
              >
                <X size={22} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {!isLoggedIn || visibleItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                  <Heart size={48} className="text-[#333]" />
                  <p className="text-[var(--brand-gray)] font-bebas text-2xl tracking-widest">
                    YOUR WISHLIST IS EMPTY
                  </p>
                  <button
                    onClick={() => {
                      setWishlistOpen(false);
                      navigate("/shop");
                    }}
                    className="px-6 py-2 border border-[var(--brand-yellow)] text-[var(--brand-yellow)] font-bebas tracking-widest hover:bg-[var(--brand-yellow)] hover:text-black transition-colors"
                  >
                    BROWSE SHOP
                  </button>
                </div>
              ) : (
                visibleItems.map((item) => (
                  <div key={item.id} className="flex gap-4 pb-4 border-b border-[#222]">
                    <button
                      onClick={() => {
                        setWishlistOpen(false);
                        navigate(`/shop/${item.productId}`);
                      }}
                      className="w-20 h-20 flex-shrink-0 border border-[#222] overflow-hidden"
                    >
                      <img
                        src={item.product?.image || ""}
                        alt={item.product?.name || "Product"}
                        className="w-full h-full object-cover"
                      />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-[var(--brand-gray)] font-bebas text-xs tracking-widest">
                        {(item.product?.artist || "").toUpperCase()}
                      </p>
                      <button
                        onClick={() => {
                          setWishlistOpen(false);
                          navigate(`/shop/${item.productId}`);
                        }}
                        className="text-white font-sans text-sm font-semibold leading-tight truncate hover:text-[var(--brand-yellow)] transition-colors text-left"
                      >
                        {item.product?.name}
                      </button>
                      <p className="text-[var(--brand-yellow)] font-bebas text-lg mt-2">
                        ${item.product?.price}
                      </p>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleAddToCart(item.productId)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--brand-yellow)] text-black font-bebas tracking-widest hover:bg-white transition-colors"
                        >
                          <ShoppingBag size={14} />
                          ADD
                        </button>
                        <button
                          onClick={() => void toggleWishlist(item.productId)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#333] text-[var(--brand-gray)] font-bebas tracking-widest hover:border-red-500 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={14} />
                          REMOVE
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
