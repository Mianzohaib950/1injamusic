"use client";

import { useState, useCallback, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnimatePresence } from "framer-motion";

import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import CustomCursor from "@/components/CustomCursor";
import GrainOverlay from "@/components/GrainOverlay";
import Navigation from "@/components/Navigation";
import CartDrawer from "@/components/CartDrawer";
import WishlistDrawer from "@/components/WishlistDrawer";
import Loader from "@/components/Loader";

import Home from "@/views/Home";
import Artists from "@/views/Artists";
import ArtistPage from "@/views/ArtistPage";
import ReleaseDetail from "@/views/ReleaseDetail";
import Events from "@/views/Events";
import EventDetail from "@/views/EventDetail";
import Booking from "@/views/Booking";
import ShopPage from "@/views/ShopPage";
import ProductDetail from "@/views/ProductDetail";
import CheckoutPage from "@/views/CheckoutPage";
import OrderConfirmation from "@/views/OrderConfirmation";
import AuthPage from "@/views/AuthPage";
import AccountPage from "@/views/AccountPage";
import AdminPage from "@/views/AdminPage";
import CmsPage from "@/views/CmsPage";
import NotFound from "@/views/not-found";
import { loadProductsCatalog } from "@/lib/productCatalogClient";

const queryClient = new QueryClient();

function App() {
  const [loaded, setLoaded] = useState(false);
  const handleLoaderComplete = useCallback(() => setLoaded(true), []);

  useEffect(() => {
    loadProductsCatalog().catch(() => {
      // Prefetch is best-effort.
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <CartProvider>
            <Loader onComplete={handleLoaderComplete} />
            <BrowserRouter>
              <CustomCursor />
              <GrainOverlay />
              <Navigation />
              <CartDrawer />
              <WishlistDrawer />
              <AnimatePresence mode="wait">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/artists" element={<Artists />} />
                  <Route path="/artists/:artist" element={<ArtistPage />} />
                  <Route path="/releases/:slug" element={<ReleaseDetail />} />
                  <Route path="/events" element={<Events />} />
                  <Route path="/events/:slug" element={<EventDetail />} />
                  <Route path="/booking" element={<Booking />} />
                  <Route path="/shop" element={<ShopPage />} />
                  <Route path="/shop/:productId" element={<ProductDetail />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/order-confirmation" element={<OrderConfirmation />} />
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="/account" element={<AccountPage />} />
                  <Route path="/admin" element={<AdminPage />} />
                  <Route path="/admin/:section" element={<AdminPage />} />
                  <Route path="/admin/orders/:orderId" element={<AdminPage />} />
                  <Route path="/:pageKey" element={<CmsPage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </AnimatePresence>
            </BrowserRouter>
            <Toaster />
          </CartProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
