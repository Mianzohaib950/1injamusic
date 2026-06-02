import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/context/CartContext";

export default function CartDrawer() {
  const { cartItems, removeFromCart, updateQuantity, totalItems, totalPrice, isCartOpen, setCartOpen } = useCart();
  const navigate = useNavigate();

  const handleCheckout = () => {
    setCartOpen(false);
    navigate("/checkout");
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="cart-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[55] bg-black/60 backdrop-blur-sm"
            onClick={() => setCartOpen(false)}
          />

          {/* Drawer */}
          <motion.div
            key="cart-drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="fixed top-0 right-0 h-full w-full max-w-[420px] z-[56] bg-[#0f0f0f] border-l border-[#222] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#222]">
              <div className="flex items-center gap-3">
                <ShoppingBag size={20} className="text-[var(--brand-yellow)]" />
                <span className="text-white font-bebas text-2xl tracking-widest">
                  CART
                </span>
                {totalItems > 0 && (
                  <span className="bg-[var(--brand-yellow)] text-black font-bebas text-sm px-2 py-0.5 rounded-full leading-none">
                    {totalItems}
                  </span>
                )}
              </div>
              <button
                onClick={() => setCartOpen(false)}
                className="text-[var(--brand-gray)] hover:text-white transition-colors"
              >
                <X size={22} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                  <ShoppingBag size={48} className="text-[#333]" />
                  <p className="text-[var(--brand-gray)] font-bebas text-2xl tracking-widest">
                    YOUR CART IS EMPTY
                  </p>
                  <button
                    onClick={() => { setCartOpen(false); navigate("/shop"); }}
                    className="px-6 py-2 border border-[var(--brand-yellow)] text-[var(--brand-yellow)] font-bebas tracking-widest hover:bg-[var(--brand-yellow)] hover:text-black transition-colors"
                  >
                    BROWSE SHOP
                  </button>
                </div>
              ) : (
                cartItems.map((item) => (
                  <div
                    key={item.cartKey}
                    className="flex gap-4 pb-4 border-b border-[#222]"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-20 h-20 object-cover flex-shrink-0 border border-[#222]"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[var(--brand-gray)] font-bebas text-xs tracking-widest">{item.artist.toUpperCase()}</p>
                      <p className="text-white font-sans text-sm font-semibold leading-tight truncate">{item.name}</p>
                      <p className="text-[var(--brand-gray)] font-sans text-xs mt-0.5">Size: {item.size}</p>
                      <div className="flex items-center justify-between mt-2">
                        {/* Qty */}
                        <div className="flex items-center border border-[#333]">
                          <button
                            onClick={() => updateQuantity(item.cartKey, item.quantity - 1)}
                            className="px-2 py-1 text-[var(--brand-gray)] hover:text-white transition-colors"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="px-3 text-white font-bebas text-base">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.cartKey, item.quantity + 1)}
                            className="px-2 py-1 text-[var(--brand-gray)] hover:text-white transition-colors"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                        <span className="text-[var(--brand-yellow)] font-bebas text-lg">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.cartKey)}
                      className="text-[#444] hover:text-red-400 transition-colors flex-shrink-0 self-start mt-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {cartItems.length > 0 && (
              <div className="px-6 py-5 border-t border-[#222] space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--brand-gray)] font-sans text-sm">Subtotal</span>
                  <span className="text-white font-bebas text-2xl">${totalPrice.toFixed(2)}</span>
                </div>
                <p className="text-[var(--brand-gray)] font-sans text-xs">
                  Shipping & taxes calculated at checkout
                </p>
                <button
                  onClick={handleCheckout}
                  className="w-full bg-[var(--brand-yellow)] text-black font-bebas text-xl tracking-widest py-4 hover:bg-white transition-colors"
                >
                  CHECKOUT — ${totalPrice.toFixed(2)}
                </button>
                <button
                  onClick={() => { setCartOpen(false); navigate("/shop"); }}
                  className="w-full border border-[#333] text-[var(--brand-gray)] font-bebas tracking-widest py-3 hover:border-[var(--brand-yellow)] hover:text-[var(--brand-yellow)] transition-colors"
                >
                  CONTINUE SHOPPING
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
