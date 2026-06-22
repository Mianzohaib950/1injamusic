import type { MerchProduct } from "@/data/merch";
import { apiGet } from "@/lib/api";

type ProductResponse = Omit<MerchProduct, "category" | "badge"> & {
  category: string;
  badge: string | null;
};

const PRODUCT_CACHE_KEY = "product-catalog-cache";
const PRODUCT_CACHE_TTL_MS = 5 * 60 * 1000;
let cachedProducts: MerchProduct[] | null = null;
let inFlight: Promise<MerchProduct[]> | null = null;

function normalizeProduct(product: ProductResponse): MerchProduct {
  const normalizedCategory = String(product.category || "tee").trim().toLowerCase() || "tee";
  const stockBySize =
    product.stockBySize && typeof product.stockBySize === "object" && !Array.isArray(product.stockBySize)
      ? product.stockBySize
      : undefined;

  return {
    ...product,
    category: normalizedCategory,
    badge: product.badge as MerchProduct["badge"],
    sizes: Array.isArray(product.sizes) && product.sizes.length > 0 ? product.sizes : ["One Size"],
    imageHover: product.imageHover || product.image,
    stockBySize,
  };
}

function readStoredProducts() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(PRODUCT_CACHE_KEY);
    if (!raw) return null;
    const stored = JSON.parse(raw) as { data: MerchProduct[]; timestamp: number };
    if (!Array.isArray(stored.data) || Date.now() - Number(stored.timestamp) > PRODUCT_CACHE_TTL_MS) {
      window.sessionStorage.removeItem(PRODUCT_CACHE_KEY);
      return null;
    }
    cachedProducts = stored.data;
    return stored.data;
  } catch {
    return null;
  }
}

function storeProducts(products: MerchProduct[]) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(PRODUCT_CACHE_KEY, JSON.stringify({
      data: products,
      timestamp: Date.now(),
    }));
  } catch {
    // Storage is best-effort; in-memory cache still works.
  }
}

export function getCachedProducts() {
  return cachedProducts ?? readStoredProducts();
}

export function clearProductsCatalogCache() {
  cachedProducts = null;
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(PRODUCT_CACHE_KEY);
  }
}

export async function loadProductsCatalog(options: { force?: boolean } = {}) {
  if (!options.force) {
    const cached = getCachedProducts();
    if (cached) return cached;
  }
  if (inFlight) return inFlight;

  inFlight = (async () => {
    const rows = await apiGet<ProductResponse[]>("/products");
    const normalized = Array.isArray(rows) ? rows.map(normalizeProduct) : [];
    cachedProducts = normalized;
    storeProducts(normalized);
    return normalized;
  })().finally(() => {
    inFlight = null;
  });

  return inFlight;
}

