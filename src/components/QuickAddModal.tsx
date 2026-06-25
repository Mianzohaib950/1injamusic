import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import type { MerchProduct } from "@/data/merch";
import { getLowStockLabel } from "@/lib/stock";

interface QuickAddModalProps {
  product: MerchProduct | null;
  onClose: () => void;
}

export default function QuickAddModal({ product, onClose }: QuickAddModalProps) {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState(false);
  const lowStockLabel = product && selectedSize ? getLowStockLabel(product, selectedSize) : "";

  const handleAdd = () => {
    if (!product) return;
    if (!selectedSize) {
      setError(true);
      return;
    }
    const addResult = addToCart(product, selectedSize, quantity);
    if (!addResult.ok && addResult.reason === "auth") {
      onClose();
      navigate("/auth", { state: { from: "/shop", tab: "login" } });
      return;
    }
    if (!addResult.ok) return;
    onClose();
    setSelectedSize("");
    setQuantity(1);
    setError(false);
  };

  return (
    <AnimatePresence>
      {product && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: "spring", damping: 22, stiffness: 300 }}
            className="fixed inset-0 z-[61] flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="bg-[#161616] border border-[#222] w-full max-w-md pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start justify-between p-5 border-b border-[#222]">
                <div>
                  <p className="text-[var(--brand-gray)] font-bebas tracking-widest text-sm mb-0.5">
                    {product.artist.toUpperCase()}
                  </p>
                  <h3 className="text-white font-sans font-bold text-lg leading-tight">
                    {product.name}
                  </h3>
                </div>
                <button
                  onClick={onClose}
                  className="text-[var(--brand-gray)] hover:text-white transition-colors ml-4 mt-1 flex-shrink-0"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 flex gap-5">
                {/* Thumb */}
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-28 h-28 object-cover flex-shrink-0 border border-[#222]"
                />

                <div className="flex-1 flex flex-col gap-4">
                  {/* Price */}
                  <div className="flex items-center gap-3">
                    <span className="text-[var(--brand-yellow)] font-bebas text-3xl">
                      ${product.price}
                    </span>
                    {product.originalPrice && (
                      <span className="text-[var(--brand-gray)] font-sans text-sm line-through">
                        ${product.originalPrice}
                      </span>
                    )}
                  </div>

                  {/* Sizes */}
                  <div>
                    <p className={`font-bebas tracking-widest text-sm mb-2 ${error ? "text-red-400" : "text-[var(--brand-gray)]"}`}>
                      {error ? "SELECT A SIZE TO CONTINUE" : "SELECT SIZE"}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {product.sizes.map((size) => (
                        <button
                          key={size}
                          onClick={() => { setSelectedSize(size); setError(false); }}
                          className={`px-3 py-1.5 font-bebas text-base tracking-widest border transition-all duration-150 ${
                            selectedSize === size
                              ? "border-[var(--brand-yellow)] bg-[var(--brand-yellow)] text-black"
                              : "border-[#333] text-[var(--brand-white)] hover:border-[var(--brand-yellow)]"
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                    {lowStockLabel && (
                      <p className="mt-2 inline-flex border border-[var(--brand-yellow)]/40 bg-[var(--brand-yellow)]/10 px-2.5 py-1 font-sans text-xs text-[var(--brand-yellow)]">
                        {lowStockLabel}
                      </p>
                    )}
                  </div>

                  {/* Quantity */}
                  <div>
                    <p className="text-[var(--brand-gray)] font-bebas tracking-widest text-sm mb-2">QTY</p>
                    <div className="flex items-center border border-[#333] w-fit">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="p-2 text-[var(--brand-gray)] hover:text-white transition-colors"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="px-4 text-white font-bebas text-xl w-10 text-center">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="p-2 text-[var(--brand-gray)] hover:text-white transition-colors"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 pb-5">
                <button
                  onClick={handleAdd}
                  className="w-full bg-[var(--brand-yellow)] text-black font-bebas text-xl tracking-widest py-3 hover:bg-white transition-colors"
                >
                  ADD TO CART — ${(product.price * quantity).toFixed(2)}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
