import { useEffect, useRef } from "react";
import { useLocation, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, ArrowRight, Music } from "lucide-react";
import gsap from "gsap";

const ORDER_NUM = `1JM-${Math.floor(10000 + Math.random() * 90000)}`;

export default function OrderConfirmation() {
  const location = useLocation();
  const state = location.state as { orderId?: string } | null;
  const orderNumber = state?.orderId ?? ORDER_NUM;
  const lineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.from(lineRef.current, {
      scaleX: 0,
      duration: 1.2,
      ease: "power4.out",
      delay: 0.8,
      transformOrigin: "left center",
    });
  }, []);

  return (
    <main className="w-full min-h-screen bg-[var(--brand-black)] flex items-center justify-center pt-20 pb-24 px-6">
      <div className="max-w-2xl w-full text-center">
        {/* Icon */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 16, stiffness: 200, delay: 0.1 }}
          className="flex justify-center mb-8"
        >
          <div className="w-24 h-24 rounded-full bg-[var(--brand-yellow)] flex items-center justify-center">
            <CheckCircle size={52} className="text-black" />
          </div>
        </motion.div>

        {/* Heading */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.7, ease: "easeOut" }}
        >
          <h1 className="text-white font-bebas text-7xl md:text-[8rem] leading-none mb-2">
            ORDER CONFIRMED
          </h1>
          <div ref={lineRef} className="h-1 bg-[var(--brand-yellow)] mb-6 mx-auto w-48" />
        </motion.div>

        {/* Order Details */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="bg-[#161616] border border-[#222] p-8 mb-8"
        >
          <p className="text-[var(--brand-gray)] font-sans text-sm mb-2">Order Number</p>
          <p className="text-[var(--brand-yellow)] font-bebas text-4xl tracking-widest mb-6">
            {orderNumber}
          </p>
          <p className="text-white font-sans text-lg mb-2">
            Thanks for repping the movement.
          </p>
          <p className="text-[var(--brand-gray)] font-sans">
            A confirmation has been sent to your email. Your order will be shipped within 3–5 business days.
          </p>
        </motion.div>

        {/* What's next */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10"
        >
          <div className="bg-[#161616] border border-[#222] p-5 text-left">
            <div className="flex items-center gap-2 mb-2">
              <Music size={16} className="text-[var(--brand-yellow)]" />
              <span className="text-[var(--brand-yellow)] font-bebas tracking-widest">STREAM NOW</span>
            </div>
            <p className="text-[var(--brand-gray)] font-sans text-sm">
              While you wait, listen to new releases from all four artists on your favourite platform.
            </p>
          </div>
          <div className="bg-[#161616] border border-[#222] p-5 text-left">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle size={16} className="text-[var(--brand-green)]" />
              <span className="text-[var(--brand-green)] font-bebas tracking-widest">TRACK ORDER</span>
            </div>
            <p className="text-[var(--brand-gray)] font-sans text-sm">
              Tracking info will be emailed once your order ships. Check your inbox within 24 hours.
            </p>
          </div>
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link
            to="/shop"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[var(--brand-yellow)] text-black font-bebas text-xl tracking-widest hover:bg-white transition-colors"
          >
            SHOP MORE <ArrowRight size={18} />
          </Link>
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-[#333] text-[var(--brand-gray)] font-bebas text-xl tracking-widest hover:border-[var(--brand-yellow)] hover:text-[var(--brand-yellow)] transition-colors"
          >
            BACK TO HOME
          </Link>
        </motion.div>
      </div>
    </main>
  );
}
