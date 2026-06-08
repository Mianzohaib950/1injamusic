import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, ShoppingBag, User, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { apiGet } from "@/lib/api";

type CmsNavPage = {
  pageKey: string;
  title: string;
  active: boolean;
};

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cmsNavLinks, setCmsNavLinks] = useState<Array<{ name: string; path: string }>>([]);
  const location = useLocation();
  const navigate = useNavigate();
  const { totalItems, setCartOpen } = useCart();
  const { isLoggedIn, user, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const fallbackNavLinks = [
    { name: "HOME", path: "/" },
    { name: "ARTISTS", path: "/artists" },
    { name: "SHOP", path: "/shop" },
    { name: "EVENTS & CONTACT", path: "/events" },
    { name: "BOOKING", path: "/booking" },
  ];

  useEffect(() => {
    let active = true;
    const loadNav = async () => {
      try {
        const rows = await apiGet<CmsNavPage[]>("/cms/pages");
        if (!active || !Array.isArray(rows) || rows.length === 0) return;

        const order: Record<string, number> = {
          home: 1,
          artists: 2,
          shop: 3,
          events: 4,
          booking: 5,
        };

        const labelFromTitle = (title: string, pageKey: string) => {
          const clean = String(title ?? "").trim();
          const base = clean.replace(/\s*page\s*$/i, "") || pageKey;
          return base.toUpperCase();
        };

        const pathFromPageKey = (pageKey: string) => {
          const key = pageKey.toLowerCase();
          if (key === "home") return "/";
          return `/${key}`;
        };

        const links = rows
          .map((page) => ({
            key: String(page.pageKey ?? "").toLowerCase(),
            name: labelFromTitle(String(page.title ?? ""), String(page.pageKey ?? "")),
            path: pathFromPageKey(String(page.pageKey ?? "")),
          }))
          .filter((link) => link.key && link.key !== "admin")
          .sort((a, b) => {
            const aOrder = order[a.key] ?? 999;
            const bOrder = order[b.key] ?? 999;
            if (aOrder !== bOrder) return aOrder - bOrder;
            return a.name.localeCompare(b.name);
          })
          .map(({ name, path }) => ({ name, path }));

        if (links.length > 0) {
          setCmsNavLinks(links);
        }
      } catch {
        // Keep fallback nav links when CMS pages are unavailable.
      }
    };

    loadNav();
    return () => {
      active = false;
    };
  }, []);

  const navLinks = cmsNavLinks.length > 0 ? cmsNavLinks : fallbackNavLinks;
  const visibleNavLinks = user?.role === "admin"
    ? [...navLinks, { name: "ADMIN", path: "/admin" }]
    : navLinks;

  const handleAccountClick = () => {
    if (isLoggedIn) {
      navigate(user?.role === "admin" ? "/admin" : "/account");
    } else {
      navigate("/auth");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <>
      <nav
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          scrolled ? "bg-black/80 backdrop-blur-xl py-4" : "bg-transparent py-6"
        )}
      >
        <div className="container mx-auto px-6 md:px-12 flex items-center justify-between">
          <Link to="/" className="flex items-center z-50">
            <img src="/logo-1jamaica.png" alt="1 Jamaica Music" className="h-20 w-auto object-contain" />
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {visibleNavLinks.map((link) => {
              const isActive =
                location.pathname === link.path ||
                (link.path !== "/" && location.pathname.startsWith(link.path));
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={cn(
                    "font-bebas text-lg tracking-widest transition-all duration-300 hover:text-[var(--brand-yellow)] hover:tracking-[0.15em]",
                    isActive
                      ? "text-[var(--brand-yellow)] border-b-2 border-[var(--brand-yellow)]"
                      : "text-white"
                  )}
                >
                  {link.name}
                </Link>
              );
            })}

            {/* Account button */}
            {isLoggedIn ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleAccountClick}
                  className="flex items-center gap-1.5 text-[var(--brand-yellow)] font-bebas tracking-widest text-base hover:opacity-80 transition-opacity"
                  title={`Signed in as ${user?.name}`}
                >
                  <User size={18} />
                  <span className="max-w-[80px] truncate">{user?.name.split(" ")[0].toUpperCase()}</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="text-[#555] hover:text-red-400 transition-colors"
                  title="Log out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={handleAccountClick}
                className="flex items-center gap-1.5 text-white hover:text-[var(--brand-yellow)] transition-colors font-bebas tracking-widest text-base"
              >
                <User size={18} /> LOG IN
              </button>
            )}

            {/* Cart button */}
            <button
              onClick={() => setCartOpen(true)}
              className="relative text-white hover:text-[var(--brand-yellow)] transition-colors"
              aria-label="Open cart"
            >
              <ShoppingBag size={22} />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-[var(--brand-yellow)] text-black font-bebas text-xs rounded-full flex items-center justify-center leading-none">
                  {totalItems > 9 ? "9+" : totalItems}
                </span>
              )}
            </button>
          </div>

          <div className="flex md:hidden items-center gap-4 z-50">
            {/* Mobile account */}
            <button
              onClick={handleAccountClick}
              className={cn(
                "transition-colors",
                isLoggedIn ? "text-[var(--brand-yellow)]" : "text-white"
              )}
              aria-label="Account"
            >
              <User size={20} />
            </button>

            {/* Mobile cart */}
            <button
              onClick={() => setCartOpen(true)}
              className="relative text-white hover:text-[var(--brand-yellow)] transition-colors"
              aria-label="Open cart"
            >
              <ShoppingBag size={22} />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-[var(--brand-yellow)] text-black font-bebas text-xs rounded-full flex items-center justify-center leading-none">
                  {totalItems > 9 ? "9+" : totalItems}
                </span>
              )}
            </button>

            <button
              className="text-[var(--brand-yellow)]"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={32} /> : <Menu size={32} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black flex flex-col items-center justify-center">
          <div className="flex flex-col items-center gap-8">
            {visibleNavLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className="font-bebas text-4xl text-white hover:text-[var(--brand-yellow)] tracking-widest transition-colors"
              >
                {link.name}
              </Link>
            ))}
            <button
              onClick={() => { setMobileMenuOpen(false); handleAccountClick(); }}
              className="font-bebas text-4xl text-white hover:text-[var(--brand-yellow)] tracking-widest transition-colors"
            >
              {isLoggedIn ? "MY ACCOUNT" : "LOG IN / SIGN UP"}
            </button>
            {isLoggedIn && (
              <button
                onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                className="font-bebas text-2xl text-red-400 tracking-widest transition-colors"
              >
                LOG OUT
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
