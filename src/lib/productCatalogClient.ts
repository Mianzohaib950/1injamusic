import type { MerchProduct } from "@/data/merch";
import { categories } from "@/data/merch";
import { apiGet } from "@/lib/api";

type ProductResponse = Omit<MerchProduct, "category" | "badge"> & {
  category: string;
  badge: string | null;
};

let cachedProducts: MerchProduct[] | null = null;
let inFlight: Promise<MerchProduct[]> | null = null;

function normalizeProduct(product: ProductResponse): MerchProduct {
  const normalizedCategory = categories.includes(product.category as (typeof categories)[number])
    ? (product.category as (typeof categories)[number])
    : "tee";

  return {
    ...product,
    category: normalizedCategory,
    badge: product.badge as MerchProduct["badge"],
    sizes: Array.isArray(product.sizes) && product.sizes.length > 0 ? product.sizes : ["One Size"],
    imageHover: product.imageHover || product.image,
  };
}

export function getCachedProducts() {
  return cachedProducts;
}

export async function loadProductsCatalog() {
  if (cachedProducts) return cachedProducts;
  if (inFlight) return inFlight;

  inFlight = (async () => {
    const rows = await apiGet<ProductResponse[]>("/products");
    const normalized = Array.isArray(rows) ? rows.map(normalizeProduct) : [];
    cachedProducts = normalized;
    return normalized;
  })().finally(() => {
    inFlight = null;
  });

  return inFlight;
}

