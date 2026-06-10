import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  createdAt: string;
}

export interface SavedAddress {
  id: string;
  label: string;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  isDefault: boolean;
}

export interface OrderHistoryItem {
  cartKey: string;
  productId: string;
  name: string;
  artist: string;
  price: number;
  image: string;
  size: string;
  quantity: number;
}

export interface Order {
  id: string;
  items: OrderHistoryItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  status: "Pending" | "Processing" | "Shipped" | "Delivered" | "Cancelled";
  createdAt: string;
  shippingAddress: Omit<SavedAddress, "id" | "label" | "isDefault">;
}

interface AuthContextType {
  user: UserProfile | null;
  isLoggedIn: boolean;
  isAuthLoading: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  signup: (name: string, email: string, phone: string, password: string) => Promise<string | null>;
  logout: () => void;
  updateProfile: (data: Partial<Pick<UserProfile, "name" | "phone">>) => Promise<string | null>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<string | null>;
  savedAddresses: SavedAddress[];
  addAddress: (address: Omit<SavedAddress, "id">) => Promise<void>;
  updateAddress: (id: string, address: Omit<SavedAddress, "id">) => Promise<void>;
  removeAddress: (id: string) => Promise<void>;
  setDefaultAddress: (id: string) => Promise<void>;
  orders: Order[];
  refreshOrders: () => Promise<void>;
  addOrder: (order: Omit<Order, "id" | "createdAt" | "status">) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);
const USER_CACHE_KEY = "1jm_user";

const mapApiOrder = (order: any): Order => ({
  id: order.id,
  items: order.items.map((item: any) => ({
    cartKey: `${item.productId}::${item.size}`,
    productId: item.productId,
    name: item.name,
    artist: item.artist,
    price: item.price / 100,
    image: item.image,
    size: item.size,
    quantity: item.quantity,
  })),
  subtotal: order.subtotalCents / 100,
  shipping: order.shippingCents / 100,
  tax: order.taxCents / 100,
  total: order.totalCents / 100,
  status: order.status,
  createdAt: order.createdAt,
  shippingAddress: {
    firstName: order.firstName,
    lastName: order.lastName,
    address: order.address,
    city: order.city,
    state: order.state,
    zip: order.zip,
    country: order.country,
  },
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  const refreshAddresses = async () => {
    try {
      const data = await apiGet<SavedAddress[]>("/addresses");
      setSavedAddresses(data);
    } catch {
      setSavedAddresses([]);
    }
  };

  const refreshOrders = async () => {
    try {
      const data = await apiGet<any[]>("/orders");
      setOrders(data.map(mapApiOrder));
    } catch {
      setOrders([]);
    }
  };

  const loadSession = async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("1jm_token") : null;
    if (!token) {
      localStorage.removeItem(USER_CACHE_KEY);
      setIsAuthLoading(false);
      return;
    }

    try {
      const cachedUser = localStorage.getItem(USER_CACHE_KEY);
      if (cachedUser) {
        setUser(JSON.parse(cachedUser));
      }
    } catch {
      localStorage.removeItem(USER_CACHE_KEY);
    }

    try {
      const profile = await apiGet<UserProfile>("/auth/me");
      setUser(profile);
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(profile));
      await Promise.all([refreshAddresses(), refreshOrders()]);
    } catch (error: any) {
      const status = Number(error?.status ?? 0);
      const isAuthError = status === 401 || status === 403;
      if (isAuthError) {
        localStorage.removeItem("1jm_token");
        localStorage.removeItem("1nja_cart");
        localStorage.removeItem(USER_CACHE_KEY);
        setUser(null);
        setSavedAddresses([]);
        setOrders([]);
      }
    } finally {
      setIsAuthLoading(false);
    }
  };

  useEffect(() => {
    loadSession();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const result = await apiPost<{ user: UserProfile; token: string }>("/auth/login", { email, password });
      localStorage.setItem("1jm_token", result.token);
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(result.user));
      setUser(result.user);
      await Promise.all([refreshAddresses(), refreshOrders()]);
      return null;
    } catch (error: any) {
      return error?.message ?? "Unable to log in.";
    }
  };

  const signup = async (name: string, email: string, phone: string, password: string) => {
    try {
      const result = await apiPost<{ user: UserProfile; token: string }>("/auth/signup", { name, email, phone, password });
      localStorage.setItem("1jm_token", result.token);
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(result.user));
      setUser(result.user);
      setSavedAddresses([]);
      setOrders([]);
      return null;
    } catch (error: any) {
      return error?.message ?? "Unable to sign up.";
    }
  };

  const logout = () => {
    setUser(null);
    setSavedAddresses([]);
    setOrders([]);
    localStorage.removeItem("1jm_token");
    localStorage.removeItem("1nja_cart");
    localStorage.removeItem(USER_CACHE_KEY);
  };

  const updateProfile = async (data: Partial<Pick<UserProfile, "name" | "phone">>) => {
    if (!user) return "Not logged in.";
    try {
      const updated = await apiPut<UserProfile>("/auth/me", data);
      setUser(updated);
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(updated));
      return null;
    } catch (error: any) {
      return error?.message ?? "Unable to update profile.";
    }
  };

  const changePassword = async (oldPassword: string, newPassword: string) => {
    if (!user) return "Not logged in.";
    try {
      await apiPost("/auth/me/change-password", { currentPassword: oldPassword, newPassword });
      return null;
    } catch (error: any) {
      return error?.message ?? "Unable to change password.";
    }
  };

  const addAddress = async (address: Omit<SavedAddress, "id">) => {
    if (!user) return;
    const created = await apiPost<SavedAddress>("/addresses", address);
    setSavedAddresses((current) => current.map((a) => (address.isDefault ? { ...a, isDefault: false } : a)).concat(created));
  };

  const updateAddress = async (id: string, address: Omit<SavedAddress, "id">) => {
    if (!user) return;
    const updated = await apiPut<SavedAddress>(`/addresses/${id}`, address);
    setSavedAddresses((current) => current.map((item) => (item.id === id ? updated : address.isDefault ? { ...item, isDefault: false } : item)));
  };

  const removeAddress = async (id: string) => {
    if (!user) return;
    await apiDelete(`/addresses/${id}`);
    setSavedAddresses((current) => current.filter((item) => item.id !== id));
  };

  const setDefaultAddress = async (id: string) => {
    if (!user) return;
    const address = savedAddresses.find((item) => item.id === id);
    if (!address) return;
    await updateAddress(id, { ...address, isDefault: true });
  };

  const addOrder = async (order: Omit<Order, "id" | "createdAt" | "status">) => {
    if (!user) return;
    const newOrder: Order = {
      ...order,
      id: `1JM-${Math.floor(10000 + Math.random() * 90000)}`,
      createdAt: new Date().toISOString(),
      status: "Pending",
    };
    setOrders((current) => [newOrder, ...current]);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        isAuthLoading,
        login,
        signup,
        logout,
        updateProfile,
        changePassword,
        savedAddresses,
        addAddress,
        updateAddress,
        removeAddress,
        setDefaultAddress,
        orders,
        refreshOrders,
        addOrder,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
