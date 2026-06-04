import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { MerchProduct } from "@/data/merch";

interface MerchCardProps {
  product: MerchProduct;
  onQuickAdd: (product: MerchProduct) => void;
}

const BADGE_STYLES: Record<string, string> = {
  NEW: "bg-[var(--brand-yellow)] text-black",
  LIMITED: "bg-[var(--brand-green)] text-black",
  SALE: "bg-red-500 text-white",
};

export default function MerchCard({ product, onQuickAdd }: MerchCardProps) {
  const [hovered, setHovered] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const navigate = useNavigate();

  const goToDetail = () => navigate(`/shop/${product.id}`);
  const fallbackImage = `https://picsum.photos/seed/${product.id}-fallback/800/800`;
  const currentImage = imageFailed ? fallbackImage : hovered ? product.imageHover : product.image;

  return (
    <div
      className="group flex flex-col bg-[#161616] border border-[#222222] hover:border-[var(--brand-yellow)] transition-all duration-300 hover:shadow-[0_0_24px_rgba(232,255,0,0.12)] cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={goToDetail}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-[#111]">
        <img
          src={currentImage}
          alt={product.name}
          onError={() => setImageFailed(true)}
          className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
        />

        {/* Badge */}
        {product.badge && (
          <span className={`absolute top-3 left-3 font-bebas text-sm px-3 py-0.5 tracking-widest ${BADGE_STYLES[product.badge]}`}>
            {product.badge}
          </span>
        )}

        {/* Quick Add overlay — stops propagation so it doesn't navigate */}
        <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <button
            onClick={(e) => { e.stopPropagation(); onQuickAdd(product); }}
            className="w-full bg-[var(--brand-yellow)] text-black font-bebas text-lg tracking-widest py-3 hover:bg-white transition-colors"
          >
            QUICK ADD
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col gap-1 flex-1">
        <span className="text-[var(--brand-gray)] font-bebas text-sm tracking-widest">
          {product.artist.toUpperCase()}
        </span>
        <h3 className="text-[var(--brand-white)] font-sans font-semibold text-base leading-snug group-hover:text-[var(--brand-yellow)] transition-colors line-clamp-2">
          {product.name}
        </h3>
        <div className="mt-auto pt-3 flex items-center gap-3">
          <span className="text-[var(--brand-yellow)] font-bebas text-2xl">
            ${product.price}
          </span>
          {product.originalPrice && (
            <span className="text-[var(--brand-gray)] font-sans text-sm line-through">
              ${product.originalPrice}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
