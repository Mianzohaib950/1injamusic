import type { MerchProduct } from "@/data/merch";

const LOW_STOCK_THRESHOLD = 3;

function getExplicitStock(product: MerchProduct, size: string) {
  const count = product.stockBySize?.[size];
  return typeof count === "number" && Number.isFinite(count) ? Math.max(0, Math.floor(count)) : null;
}

function getFallbackLowStock(product: MerchProduct, size: string) {
  if (!product.inStock || size.toLowerCase() === "one size") return null;

  const badge = product.badge?.toUpperCase();
  if (badge === "SALE" && ["L", "XL", "XXL"].includes(size)) return size === "XXL" ? 1 : 2;
  if (badge === "LIMITED" && ["M", "L", "XL", "XXL"].includes(size)) return size === "XXL" ? 2 : 3;
  if (/limited|exclusive|drop|edition/i.test(product.name) && ["XL", "XXL"].includes(size)) return 3;

  return null;
}

export function getStockForSize(product: MerchProduct, size: string) {
  return getExplicitStock(product, size) ?? getFallbackLowStock(product, size);
}

export function getLowStockLabel(product: MerchProduct, size: string) {
  const count = getStockForSize(product, size);
  if (count == null || count <= 0 || count > LOW_STOCK_THRESHOLD) return "";
  return `Only ${count} left in this size!`;
}

export function hasAnyLowStock(product: MerchProduct) {
  return product.sizes.some((size) => Boolean(getLowStockLabel(product, size)));
}
