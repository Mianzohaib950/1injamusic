import { createContext, useContext, useReducer, useState, useEffect, ReactNode } from "react";
import { merchProducts, type MerchProduct } from "@/data/merch";
import { useAuth } from "@/context/AuthContext";
import { getStockForSize } from "@/lib/stock";
import { toast } from "sonner";

export interface CartItem {
  cartKey: string;
  productId: string;
  name: string;
  artist: string;
  price: number;
  image: string;
  size: string;
  quantity: number;
  inStock?: boolean;
  stockBySize?: Record<string, number>;
}

interface CartState {
  items: CartItem[];
}

type CartAction =
  | { type: "ADD"; item: CartItem }
  | { type: "REMOVE"; cartKey: string }
  | { type: "UPDATE_QTY"; cartKey: string; quantity: number }
  | { type: "CLEAR" }
  | { type: "LOAD"; items: CartItem[] };

function findProductForStoredItem(item: Partial<CartItem> & { id?: string }) {
  const possibleIds = [
    item.productId,
    item.id,
    typeof item.cartKey === "string" ? item.cartKey.split("::")[0] : undefined,
  ].filter(Boolean);

  return (
    possibleIds
      .map((id) => merchProducts.find((product) => product.id === id))
      .find(Boolean) ??
    merchProducts.find((product) => product.name === item.name) ??
    null
  );
}

function normalizeStoredCartItems(items: unknown): CartItem[] {
  if (!Array.isArray(items)) return [];

  const normalized = items
    .map<CartItem | null>((item) => {
      if (!item || typeof item !== "object") return null;
      const storedItem = item as Partial<CartItem> & { id?: string };
      const product = findProductForStoredItem(storedItem);

      const size = storedItem.size || product?.sizes?.[0] || "One Size";
      const quantity = Math.max(1, Number(storedItem.quantity) || 1);
      const productId = storedItem.productId || storedItem.id || product?.id;
      if (!productId) return null;

      return {
        cartKey: `${productId}::${size}`,
        productId,
        name: storedItem.name || product?.name || "Product",
        artist: storedItem.artist || product?.artist || "Artist",
        price: Number(storedItem.price ?? product?.price ?? 0),
        image: storedItem.image || product?.image || "",
        size,
        quantity,
        inStock: storedItem.inStock ?? product?.inStock,
        stockBySize: storedItem.stockBySize ?? product?.stockBySize,
      };
    })
    .filter((item): item is CartItem => Boolean(item));

  return normalized.reduce<CartItem[]>((items, item) => {
    const existing = items.find((candidate) => candidate.cartKey === item.cartKey);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      items.push(item);
    }
    return items;
  }, []);
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "LOAD":
      return { items: action.items };
    case "ADD": {
      const existing = state.items.find((i) => i.cartKey === action.item.cartKey);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.cartKey === action.item.cartKey
              ? { ...i, quantity: i.quantity + action.item.quantity }
              : i
          ),
        };
      }
      return { items: [...state.items, action.item] };
    }
    case "REMOVE":
      return { items: state.items.filter((i) => i.cartKey !== action.cartKey) };
    case "UPDATE_QTY":
      return {
        items: state.items.map((i) =>
          i.cartKey === action.cartKey ? { ...i, quantity: action.quantity } : i
        ),
      };
    case "CLEAR":
      return { items: [] };
    default:
      return state;
  }
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: MerchProduct, size: string, quantity?: number) => CartAddResult;
  removeFromCart: (cartKey: string) => void;
  updateQuantity: (cartKey: string, quantity: number) => boolean;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isCartOpen: boolean;
  setCartOpen: (open: boolean) => void;
}

type CartAddResult =
  | { ok: true }
  | { ok: false; reason: "auth" | "stock"; message?: string };

const CartContext = createContext<CartContextType | null>(null);

function getCartItemStock(item: CartItem) {
  const product = merchProducts.find((candidate) => candidate.id === item.productId);
  const stockProduct: MerchProduct = {
    id: item.productId,
    name: item.name,
    artist: item.artist,
    artistSlug: product?.artistSlug ?? "",
    category: product?.category ?? "tee",
    price: item.price,
    originalPrice: product?.originalPrice ?? null,
    sizes: product?.sizes ?? [item.size],
    image: item.image,
    imageHover: product?.imageHover ?? item.image,
    description: product?.description ?? "",
    badge: product?.badge ?? null,
    inStock: item.inStock ?? product?.inStock ?? true,
    stockBySize: item.stockBySize ?? product?.stockBySize,
  };
  return getStockForSize(stockProduct, item.size);
}

function makeStockError(stock: number, size: string) {
  return stock <= 0
    ? `This product is out of stock in ${size}.`
    : `Only ${stock} left in this size.`;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { isLoggedIn } = useAuth();
  const [state, dispatch] = useReducer(cartReducer, { items: [] });
  const [isCartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    try {
      const hasToken = localStorage.getItem("1jm_token");
      if (!hasToken) {
        localStorage.removeItem("1nja_cart");
        dispatch({ type: "CLEAR" });
        return;
      }
      const stored = localStorage.getItem("1nja_cart");
      if (stored) {
        dispatch({ type: "LOAD", items: normalizeStoredCartItems(JSON.parse(stored)) });
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      const hasToken = localStorage.getItem("1jm_token");
      if (!isLoggedIn && !hasToken) {
        dispatch({ type: "CLEAR" });
        setCartOpen(false);
        localStorage.removeItem("1nja_cart");
      }
    } catch {}
  }, [isLoggedIn]);

  useEffect(() => {
    localStorage.setItem("1nja_cart", JSON.stringify(state.items));
  }, [state.items]);

  const addToCart = (product: MerchProduct, size: string, quantity = 1): CartAddResult => {
    const hasToken = typeof window !== "undefined" ? localStorage.getItem("1jm_token") : null;
    if (!isLoggedIn && !hasToken) {
      dispatch({ type: "CLEAR" });
      setCartOpen(false);
      localStorage.removeItem("1nja_cart");
      return { ok: false, reason: "auth" };
    }

    const cartKey = `${product.id}::${size}`;
    const requestedQuantity = Math.max(1, Number(quantity) || 1);
    const existingQuantity = state.items.find((item) => item.cartKey === cartKey)?.quantity ?? 0;
    const availableStock = getStockForSize(product, size);

    if (availableStock != null && existingQuantity + requestedQuantity > availableStock) {
      const message = makeStockError(availableStock, size);
      toast.error(message);
      return { ok: false, reason: "stock", message };
    }

    dispatch({
      type: "ADD",
      item: {
        cartKey,
        productId: product.id,
        name: product.name,
        artist: product.artist,
        price: product.price,
        image: product.image,
        size,
        quantity: requestedQuantity,
        inStock: product.inStock,
        stockBySize: product.stockBySize,
      },
    });
    setCartOpen(true);
    return { ok: true };
  };

  const removeFromCart = (cartKey: string) => dispatch({ type: "REMOVE", cartKey });

  const updateQuantity = (cartKey: string, quantity: number): boolean => {
    if (quantity < 1) {
      dispatch({ type: "REMOVE", cartKey });
      return true;
    }

    const item = state.items.find((candidate) => candidate.cartKey === cartKey);
    const availableStock = item ? getCartItemStock(item) : null;

    if (availableStock != null && quantity > availableStock) {
      toast.error(makeStockError(availableStock, item?.size ?? "this size"));
      return false;
    }

    dispatch({ type: "UPDATE_QTY", cartKey, quantity });
    return true;
  };

  const clearCart = () => dispatch({ type: "CLEAR" });

  const totalItems = state.items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = state.items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems: state.items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        isCartOpen,
        setCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
