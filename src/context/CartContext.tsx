import { createContext, useContext, useReducer, useState, useEffect, ReactNode } from "react";
import { merchProducts, type MerchProduct } from "@/data/merch";

export interface CartItem {
  cartKey: string;
  productId: string;
  name: string;
  artist: string;
  price: number;
  image: string;
  size: string;
  quantity: number;
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
    .map((item) => {
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
  addToCart: (product: MerchProduct, size: string, quantity?: number) => void;
  removeFromCart: (cartKey: string) => void;
  updateQuantity: (cartKey: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isCartOpen: boolean;
  setCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });
  const [isCartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("1nja_cart");
      if (stored) {
        dispatch({ type: "LOAD", items: normalizeStoredCartItems(JSON.parse(stored)) });
      }
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem("1nja_cart", JSON.stringify(state.items));
  }, [state.items]);

  const addToCart = (product: MerchProduct, size: string, quantity = 1) => {
    const cartKey = `${product.id}::${size}`;
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
        quantity,
      },
    });
    setCartOpen(true);
  };

  const removeFromCart = (cartKey: string) => dispatch({ type: "REMOVE", cartKey });

  const updateQuantity = (cartKey: string, quantity: number) => {
    if (quantity < 1) {
      dispatch({ type: "REMOVE", cartKey });
    } else {
      dispatch({ type: "UPDATE_QTY", cartKey, quantity });
    }
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
