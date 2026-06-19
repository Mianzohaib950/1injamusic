import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import {
  BarChart3,
  CalendarCheck,
  ChevronDown,
  ContactRound,
  Layers,
  Mic2,
  Package,
  Save,
  ShoppingCart,
  Trash2,
  Users,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api";

type AdminSection =
  | "dashboard"
  | "cms"
  | "products"
  | "artists"
  | "orders"
  | "users"
  | "bookings"
  | "event-contacts";

const sections: { id: AdminSection; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3 },
  { id: "cms", label: "CMS", icon: Layers },
  { id: "products", label: "Products", icon: Package },
  { id: "artists", label: "Artists", icon: Mic2 },
  { id: "orders", label: "Orders", icon: ShoppingCart },
  { id: "users", label: "Users", icon: Users },
  { id: "bookings", label: "Bookings", icon: CalendarCheck },
  { id: "event-contacts", label: "Event Contact", icon: ContactRound },
];

const inputClass =
  "w-full bg-[#111] border border-[#333] text-white font-sans px-3 py-2 focus:border-[var(--brand-yellow)] focus:outline-none";
const panelClass = "bg-[#161616] border border-[#222]";
const actionClass =
  "inline-flex items-center justify-center gap-2 bg-[var(--brand-yellow)] text-black font-bebas tracking-widest px-4 py-2 hover:bg-white transition-colors disabled:opacity-50";
const ghostClass =
  "inline-flex items-center justify-center gap-2 border border-[#333] text-[var(--brand-gray)] font-bebas tracking-widest px-4 py-2  h-9 hover:border-[var(--brand-yellow)] hover:text-[var(--brand-yellow)] transition-colors";
const selectClass = `${inputClass} appearance-none pr-10 cursor-pointer`;
const cmsSectionTypeOptions = ["hero", "content", "list", "gallery", "video", "marquee", "footer"];
const productCategoryOptions = ["tee", "hoodie", "cap", "vinyl", "poster", "bundle"];
const productSizeOptions = ["S", "M", "L", "XL", "XXL"];
const artistSortOrderOptions = Array.from({ length: 21 }, (_, index) => index);
const ADMIN_CACHE_TTL_MS = 60_000;
const ADMIN_CACHE_STORAGE_PREFIX = "admin-cache:";
const adminDataCache = new Map<string, { data: unknown; timestamp: number }>();
const adminDataInflight = new Map<string, Promise<unknown>>();

function money(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function shortId(value: string, max = 18) {
  if (!value) return "";
  return value.length > max ? `${value.slice(0, max)}...` : value;
}

function capitalizeFirst(value: string) {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function toDisplayLabel(value: string) {
  return capitalizeFirst(value.replace(/([a-z])([A-Z])/g, "$1 $2"));
}

function toUrlSlug(value: string) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toSectionKey(value: string) {
  return toUrlSlug(value).replace(/-/g, "_");
}

function inferProductBadge(value: string) {
  const name = String(value).toLowerCase();
  if (!name.trim()) return "";
  if (/\b(sale|bundle|discount|clearance)\b/.test(name)) return "SALE";
  if (/\b(limited|exclusive|edition|vinyl)\b/.test(name)) return "LIMITED";
  return "NEW";
}

function scrollToForm(ref: React.RefObject<HTMLElement | null>) {
  window.setTimeout(() => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 0);
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function getStoredAdminCache(path: string) {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(`${ADMIN_CACHE_STORAGE_PREFIX}${path}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { data: unknown; timestamp: number };
    if (!parsed || typeof parsed.timestamp !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

function getAnyAdminCache<T>(path: string) {
  const memory = adminDataCache.get(path);
  if (memory) return memory.data as T;
  const stored = getStoredAdminCache(path);
  if (!stored) return null;
  adminDataCache.set(path, stored);
  return stored.data as T;
}

function getFreshAdminCache<T>(path: string) {
  const cached = adminDataCache.get(path) ?? getStoredAdminCache(path);
  if (!cached) return null;
  if (Date.now() - cached.timestamp > ADMIN_CACHE_TTL_MS) return null;
  adminDataCache.set(path, cached);
  return cached.data as T;
}

function setAdminCache(path: string, data: unknown) {
  const payload = { data, timestamp: Date.now() };
  adminDataCache.set(path, payload);
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(`${ADMIN_CACHE_STORAGE_PREFIX}${path}`, JSON.stringify(payload));
  } catch {
    // Ignore storage quota errors.
  }
}

async function fetchAdminData<T>(path: string) {
  const existing = adminDataInflight.get(path);
  if (existing) return existing as Promise<T>;

  const request = apiGet<T>(path)
    .then((result) => {
      setAdminCache(path, result);
      return result;
    })
    .finally(() => {
      adminDataInflight.delete(path);
    });

  adminDataInflight.set(path, request as Promise<unknown>);
  return request;
}

function AdminShell({ section, children }: { section: AdminSection; children: React.ReactNode }) {
  const navigate = useNavigate();

  return (
    <main className="w-full min-h-screen bg-[var(--brand-black)] pt-28 pb-20 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <span className="text-[var(--brand-yellow)] font-bebas tracking-widest text-lg">ADMIN</span>
          <h1 className="text-white font-bebas text-6xl md:text-8xl leading-none">CONTROL ROOM</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <nav className={`${panelClass} lg:col-span-1 p-3 flex lg:flex-col gap-1 overflow-x-auto`}>
            {sections.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => navigate(id === "dashboard" ? "/admin" : `/admin/${id}`)}
                className={`flex items-center gap-2 px-4 py-3 font-bebas tracking-widest whitespace-nowrap text-left transition-colors border-l-2 ${
                  section === id
                    ? "border-[var(--brand-yellow)] text-[var(--brand-yellow)] bg-[var(--brand-yellow)]/5"
                    : "border-transparent text-[var(--brand-gray)] hover:text-white"
                }`}
              >
                <Icon size={16} /> {label.toUpperCase()}
              </button>
            ))}
          </nav>

          <section className="lg:col-span-4 min-w-0">{children}</section>
        </div>
      </div>
    </main>
  );
}

function useAdminData<T>(path: string, fallback: T) {
  const [data, setData] = useState<T>(() => getAnyAdminCache<T>(path) ?? fallback);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = async (options?: { background?: boolean; force?: boolean }) => {
    const cached = options?.force ? null : getAnyAdminCache<T>(path);
    if (cached != null) {
      setData(cached);
    }

    setError("");
    try {
      const fresh = await fetchAdminData<T>(path);
      setData(fresh);
    } catch (error: any) {
      setError(error?.message ?? "Unable to load data.");
    }
  };

  useEffect(() => {
    const cached = getAnyAdminCache<T>(path);
    if (cached != null) {
      setData(cached);
      load({ background: true });
      return;
    }
    load({ background: true });
  }, [path]);

  return { data, loading, error, reload: () => load({ force: true }) };
}

function StatusText({ loading, error }: { loading: boolean; error: string }) {
  if (error) return <p className="text-red-400 font-sans text-sm">{error}</p>;
  return null;
}

function FieldShell({
  label,
  caption,
  className = "",
  children,
}: {
  label: string;
  caption: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`text-[var(--brand-gray)] font-sans text-xs ${className}`}>
      <p className="mb-2">{label}</p>
      {children}
      <p className="mt-1 text-xs leading-snug text-[var(--brand-gray)]/75">{caption}</p>
    </div>
  );
}

function LabeledInput({
  label,
  caption,
  className = "",
  inputClassName = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  caption: string;
  inputClassName?: string;
}) {
  return (
    <FieldShell label={label} caption={caption} className={className}>
      <input {...props} className={`${inputClass} ${inputClassName}`} />
    </FieldShell>
  );
}

function LabeledTextarea({
  label,
  caption,
  className = "",
  textareaClassName = "",
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  caption: string;
  textareaClassName?: string;
}) {
  return (
    <FieldShell label={label} caption={caption} className={className}>
      <textarea {...props} className={`${inputClass} ${textareaClassName}`} />
    </FieldShell>
  );
}

function MoneyInput({
  label,
  caption,
  value,
  onChange,
}: {
  label: string;
  caption: string;
  value: string | number;
  onChange: (value: string) => void;
}) {
  return (
    <FieldShell label={label} caption={caption}>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--brand-yellow)] font-sans">$</span>
        <input
          className={`${inputClass} pl-7`}
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </FieldShell>
  );
}

function FileUrlField({
  label,
  caption,
  value,
  fileName,
  onTextChange,
  onFileChange,
}: {
  label: string;
  caption: string;
  value: string;
  fileName: string;
  onTextChange: (value: string) => void;
  onFileChange: (file?: File) => void;
}) {
  return (
    <FieldShell label={label} caption={caption}>
      <div className="flex min-w-0 border border-[#333] bg-[#111] focus-within:border-[var(--brand-yellow)]">
        <input
          className="min-w-0 flex-1 bg-transparent text-white font-sans px-3 py-2 focus:outline-none"
          value={value}
          onChange={(e) => onTextChange(e.target.value)}
        />
        <label className="inline-flex items-center justify-center border-l border-[#333] px-4 text-[var(--brand-gray)] font-bebas tracking-widest cursor-pointer hover:text-[var(--brand-yellow)]">
          {fileName || "Choose"}
          <input className="hidden" type="file" accept="image/*" onChange={(e) => onFileChange(e.target.files?.[0])} />
        </label>
      </div>
    </FieldShell>
  );
}

function DropdownField({
  label,
  caption,
  value,
  onChange,
  children,
}: {
  label: string;
  caption: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <FieldShell label={label} caption={caption}>
      <div className="relative mt-2">
        <select className={selectClass} value={value} onChange={(e) => onChange(e.target.value)}>
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--brand-yellow)]" />
      </div>
    </FieldShell>
  );
}

function CheckboxDropdownField({
  label,
  caption,
  options,
  selectedValues,
  onToggle,
  placeholder = "Select options",
}: {
  label: string;
  caption: string;
  options: string[];
  selectedValues: string[];
  onToggle: (value: string, checked: boolean) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const selectedText = selectedValues.length > 0 ? selectedValues.join(", ") : placeholder;

  return (
    <FieldShell label={label} caption={caption}>
      <div className="relative">
        <button
          type="button"
          className={`${inputClass} flex items-center justify-between text-left`}
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
        >
          <span className={selectedValues.length > 0 ? "text-white" : "text-[var(--brand-gray)]"}>{selectedText}</span>
          <ChevronDown className={`h-4 w-4 text-[var(--brand-yellow)] transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        {open && (
          <div className="absolute left-0 right-0 top-full z-40 mt-2 border border-[#333] bg-[#111] p-2 shadow-2xl">
            {options.map((option) => (
              <label
                key={option}
                className="flex items-center gap-3 px-3 py-3 text-white font-bebas tracking-widest cursor-pointer hover:bg-white/5"
              >
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option)}
                  onChange={(e) => onToggle(option, e.target.checked)}
                />
                {option}
              </label>
            ))}
          </div>
        )}
      </div>
    </FieldShell>
  );
}

function Dashboard() {
  const { data, loading, error } = useAdminData<any>("/admin/dashboard", null);
  const statusEntries = useMemo(() => {
    const byStatus = (data?.ordersByStatus ?? {}) as Record<string, number>;
    return [
      ["Pending", Number(byStatus.Pending ?? 0)],
      ["Processing", Number(byStatus.Processing ?? 0)],
      ["Shipped", Number(byStatus.Shipped ?? 0)],
      ["Delivered", Number(byStatus.Delivered ?? 0)],
      ["Cancelled", Number(byStatus.Cancelled ?? byStatus.Canceled ?? 0)],
    ] as [string, number][];
  }, [data]);

  const cards = data
    ? [
        ["USERS", data.totals.users],
        ["ORDERS", data.totals.orders],
        ["REVENUE", money(data.totals.revenueCents)],
        ["PRODUCTS", data.totals.products],
        ["ARTISTS", data.totals.artists],
        ["BOOKINGS", data.totals.bookings],
        ["EVENT CONTACT", data.totals.eventContacts],
      ]
    : [];

  return (
    <div>
      <h2 className="text-white font-bebas text-4xl mb-6">DASHBOARD</h2>
      <StatusText loading={loading} error={error} />
      {data && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {cards.map(([label, value]) => (
              <div key={label} className={`${panelClass} p-5`}>
                <p className="text-[var(--brand-gray)] font-bebas tracking-widest text-sm">{label}</p>
                <p className="text-[var(--brand-yellow)] font-bebas text-4xl mt-1">{value}</p>
              </div>
            ))}
          </div>
          <div className={`${panelClass} p-5`}>
            <h3 className="text-white font-bebas text-2xl mb-4">ORDER STATUS</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {statusEntries.map(([status, count]) => (
                <div key={status} className="bg-[#111] border border-[#222] p-4">
                  <p className="text-[var(--brand-gray)] font-bebas tracking-widest">{status}</p>
                  <p className="text-white font-bebas text-3xl">{String(count)}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ProductsPanel() {
  const blank = {
    id: "",
    name: "",
    artist: "",
    artistSlug: "",
    category: "tee",
    price: 0,
    originalPrice: "",
    image: "",
    imageHover: "",
    description: "",
    badge: "",
    sizes: "S,M,L,XL",
    inStock: true,
  };
  const { data, loading, error, reload } = useAdminData<any[]>("/admin/products", []);
  const { data: artists, loading: artistsLoading, error: artistsError } = useAdminData<any[]>("/admin/artists", []);
  const [form, setForm] = useState<any>(blank);
  const [editingId, setEditingId] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [imageFileName, setImageFileName] = useState("");
  const [autoProductSlug, setAutoProductSlug] = useState(true);
  const [autoProductBadge, setAutoProductBadge] = useState(true);
  const productFormRef = useRef<HTMLDivElement>(null);
  const artistOptions = useMemo(() => {
    const options = artists.map((artist) => ({
      name: String(artist.name ?? ""),
      slug: String(artist.slug ?? ""),
    })).filter((artist) => artist.name && artist.slug);
    if (form.artist && form.artistSlug && !options.some((artist) => artist.slug === form.artistSlug)) {
      return [{ name: String(form.artist), slug: String(form.artistSlug) }, ...options];
    }
    return options;
  }, [artists, form.artist, form.artistSlug]);
  const categoryOptions = useMemo(() => {
    const options = new Set(productCategoryOptions);
    data.forEach((product) => {
      const category = String(product.category ?? "").trim();
      if (category) options.add(category);
    });
    if (form.category) options.add(String(form.category));
    return Array.from(options);
  }, [data, form.category]);
  const selectedProductSizes = useMemo(
    () => String(form.sizes ?? "").split(",").map((size) => size.trim()).filter(Boolean),
    [form.sizes],
  );

  const updateProductImage = (image: string) => {
    setForm((current: any) => ({ ...current, image, imageHover: image }));
  };

  const pickProductImage = (file?: File) => {
    if (!file) return;
    setImageFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      updateProductImage(result);
    };
    reader.readAsDataURL(file);
  };

  const save = async () => {
    const payload = {
      ...form,
      imageHover: form.image,
      price: Number(form.price),
      originalPrice: form.originalPrice === "" ? null : Number(form.originalPrice),
      sizes: String(form.sizes).split(",").map((size) => size.trim()).filter(Boolean),
    };
    if (editingId) await apiPut(`/admin/products/${editingId}`, payload);
    else await apiPost("/admin/products", payload);
    setForm(blank);
    setImageFileName("");
    setEditingId("");
    setAutoProductSlug(true);
    setAutoProductBadge(true);
    setShowForm(false);
    await reload();
  };

  const startAddProduct = () => {
    setForm(blank);
    setEditingId("");
    setImageFileName("");
    setAutoProductSlug(true);
    setAutoProductBadge(true);
    setShowForm(true);
  };

  const cancelProductForm = () => {
    setForm(blank);
    setEditingId("");
    setImageFileName("");
    setAutoProductSlug(true);
    setAutoProductBadge(true);
    setShowForm(false);
  };

  const selectProductArtist = (artistSlug: string) => {
    const selectedArtist = artistOptions.find((artist) => artist.slug === artistSlug);
    setForm({
      ...form,
      artist: selectedArtist?.name ?? "",
      artistSlug,
    });
  };

  const updateProductName = (name: string) => {
    setForm((current: any) => ({
      ...current,
      name,
      id: !editingId && autoProductSlug ? toUrlSlug(name) : current.id,
      badge: autoProductBadge ? inferProductBadge(name) : current.badge,
    }));
  };

  const toggleProductSize = (size: string, checked: boolean) => {
    const nextSizes = checked
      ? Array.from(new Set([...selectedProductSizes, size]))
      : selectedProductSizes.filter((item) => item !== size);
    const sortedSizes = productSizeOptions.filter((item) => nextSizes.includes(item));
    setForm({ ...form, sizes: sortedSizes.join(",") });
  };

  return (
    <CrudLayout title="PRODUCTS" loading={loading || artistsLoading} error={error || artistsError}>
      <div className="mb-6 flex items-center justify-end gap-3">
        {!showForm ? (
          <button className={actionClass} onClick={startAddProduct}>
            <Save size={16} /> ADD PRODUCT
          </button>
        ) : (
          <button className={ghostClass} onClick={cancelProductForm}>
            CANCEL
          </button>
        )}
      </div>
      {showForm && (
        <div ref={productFormRef} className={`${panelClass} p-5 mb-6 grid grid-cols-1 md:grid-cols-2 gap-3 scroll-mt-28`}>
          <LabeledInput label="Product Slug" caption="URL-friendly product ID. Use lowercase letters, numbers, and hyphens only; no spaces." value={form.id ?? ""} onChange={(e) => { setAutoProductSlug(false); setForm({ ...form, id: e.target.value }); }} disabled={!!editingId} />
          <LabeledInput label="Product Name" caption="Enter the public product name; slug and badge will auto-fill from this." value={form.name ?? ""} onChange={(e) => updateProductName(e.target.value)} />
          <FileUrlField
            label="Product Image"
            caption="Paste one product image URL or choose an image file from your device."
            value={form.image ?? ""}
            fileName={imageFileName}
            onTextChange={(value) => {
              setImageFileName("");
              updateProductImage(value);
            }}
            onFileChange={pickProductImage}
          />
          <LabeledInput label="Badge" caption="Auto-suggests NEW, LIMITED, or SALE from Product Name; edit if needed." value={form.badge ?? ""} onChange={(e) => { setAutoProductBadge(false); setForm({ ...form, badge: e.target.value }); }} />
          <CheckboxDropdownField
            label="Sizes"
            caption="Open the menu and select all sizes available for this product."
            options={productSizeOptions}
            selectedValues={selectedProductSizes}
            onToggle={toggleProductSize}
            placeholder="Select sizes"
          />
          <DropdownField label="Artist Name" caption="Choose the artist connected to this product." value={form.artistSlug ?? ""} onChange={selectProductArtist}>
            <option value="" disabled>Select artist</option>
            {artistOptions.map((artist) => (
              <option key={artist.slug} value={artist.slug}>{artist.name}</option>
            ))}
          </DropdownField>
          <DropdownField label="Category Name" caption="Choose the product category used for shop filtering." value={form.category ?? ""} onChange={(value) => setForm({ ...form, category: value })}>
            {categoryOptions.map((category) => (
              <option key={category} value={category}>{capitalizeFirst(category)}</option>
            ))}
          </DropdownField>
          <MoneyInput label="Price" caption="Enter the current selling price in USD." value={form.price} onChange={(value) => setForm({ ...form, price: value })} />
          <MoneyInput label="Original Price" caption="Enter the compare-at price in USD, or leave blank when there is no discount." value={form.originalPrice} onChange={(value) => setForm({ ...form, originalPrice: value })} />
          <LabeledTextarea label="Description" caption="Write the product description shown on the product detail page." className="md:col-span-2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <label className="flex items-center gap-2 text-[var(--brand-gray)] font-sans text-sm">
            <input type="checkbox" checked={form.inStock} onChange={(e) => setForm({ ...form, inStock: e.target.checked })} />
            In Stock
          </label>
          <button className={actionClass} onClick={save}><Save size={16} /> {editingId ? "UPDATE" : "ADD"} PRODUCT</button>
        </div>
      )}
      <AdminTable
        rows={data}
        columns={["name", "artist", "category", "price", "inStock"]}
        formatCell={(_, column, value) => {
          if (column === "inStock") return value ? "In Stock" : "Out Of Stock";
          return undefined;
        }}
        actions={(row) => (
          <>
            <button className={ghostClass} onClick={() => { setEditingId(row.id); setForm({ ...row, imageHover: row.image ?? row.imageHover ?? "", sizes: (row.sizes ?? []).join(","), originalPrice: row.originalPrice ?? "" }); setImageFileName(""); setAutoProductSlug(false); setAutoProductBadge(false); setShowForm(true); scrollToForm(productFormRef); }}>EDIT</button>
            <button className={ghostClass} onClick={async () => { await apiDelete(`/admin/products/${row.id}`); await reload(); }}><Trash2 size={14} /></button>
          </>
        )}
      />
    </CrudLayout>
  );
}

function ArtistsPanel() {
  const blank = { slug: "", name: "", genres: "", bio: "", image: "", bookingEmail: "booking@1jamaicamusic.com", active: true, sortOrder: 0 };
  const { data, loading, error, reload } = useAdminData<any[]>("/admin/artists", []);
  const [form, setForm] = useState<any>(blank);
  const [editingSlug, setEditingSlug] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [artistImageFileName, setArtistImageFileName] = useState("");
  const artistFormRef = useRef<HTMLDivElement>(null);

  const pickArtistImage = (file?: File) => {
    if (!file) return;
    setArtistImageFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setForm((current: any) => ({ ...current, image: result }));
    };
    reader.readAsDataURL(file);
  };

  const save = async () => {
    const payload = { ...form, genres: String(form.genres).split(",").map((item) => item.trim()).filter(Boolean), sortOrder: Number(form.sortOrder) };
    if (editingSlug) await apiPut(`/admin/artists/${editingSlug}`, payload);
    else await apiPost("/admin/artists", payload);
    setForm(blank);
    setEditingSlug("");
    setArtistImageFileName("");
    setShowForm(false);
    await reload();
  };

  const startAddArtist = () => {
    setForm(blank);
    setEditingSlug("");
    setArtistImageFileName("");
    setShowForm(true);
  };

  const cancelArtistForm = () => {
    setForm(blank);
    setEditingSlug("");
    setArtistImageFileName("");
    setShowForm(false);
  };

  return (
    <CrudLayout title="ARTISTS" loading={loading} error={error}>
      <div className="mb-6 flex items-center justify-end gap-3">
        {!showForm ? (
          <button className={actionClass} onClick={startAddArtist}>
            <Save size={16} /> ADD ARTIST
          </button>
        ) : (
          <button className={ghostClass} onClick={cancelArtistForm}>
            CANCEL
          </button>
        )}
      </div>
      {showForm && (
        <div ref={artistFormRef} className={`${panelClass} p-5 mb-6 grid grid-cols-1 md:grid-cols-2 gap-3 scroll-mt-28`}>
          <LabeledInput label="Slug" caption="URL-friendly artist name used in the page address. Use lowercase letters, numbers, and hyphens only." value={form.slug ?? ""} disabled={!!editingSlug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          <LabeledInput label="Name" caption="Enter the artist name shown across the website." value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <LabeledInput label="Genres" caption="Enter genres separated by commas, for example Dancehall,Hip-Hop." value={form.genres ?? ""} onChange={(e) => setForm({ ...form, genres: e.target.value })} />
          <LabeledInput label="Bio" caption="Write a short artist biography for the artist page." value={form.bio ?? ""} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
          <FileUrlField
            label="Image"
            caption="Paste a profile image URL or choose an image file from your device."
            value={form.image ?? ""}
            fileName={artistImageFileName}
            onTextChange={(value) => {
              setArtistImageFileName("");
              setForm({ ...form, image: value });
            }}
            onFileChange={pickArtistImage}
          />
          <LabeledInput label="Booking Email" caption="Enter the email address used for artist booking requests." value={form.bookingEmail ?? ""} onChange={(e) => setForm({ ...form, bookingEmail: e.target.value })} />
          <DropdownField label="Sort Order" caption="Choose the display priority for this artist." value={String(form.sortOrder ?? 0)} onChange={(value) => setForm({ ...form, sortOrder: Number(value) })}>
            {artistSortOrderOptions.map((sortOrder) => (
              <option key={sortOrder} value={sortOrder}>{sortOrder}</option>
            ))}
          </DropdownField>
          <label className="flex items-center gap-2 text-[var(--brand-gray)] font-sans text-sm">
            <input type="checkbox" checked={form.active ?? true} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
            Active
          </label>
          <button className={actionClass} onClick={save}><Save size={16} /> {editingSlug ? "UPDATE ARTIST" : "ADD ARTIST"}</button>
        </div>
      )}
      <AdminTable rows={data} columns={["name", "slug", "genres", "active"]} formatCell={(_, column, value) => column === "active" ? (value ? "Active" : "Inactive") : undefined} actions={(row) => (
        <>
          <button className={ghostClass} onClick={() => { setEditingSlug(row.slug); setForm({ ...row, genres: (row.genres ?? []).join(",") }); setArtistImageFileName(""); setShowForm(true); scrollToForm(artistFormRef); }}>EDIT</button>
          <button className={ghostClass} onClick={async () => { await apiDelete(`/admin/artists/${row.slug}`); await reload(); }}><Trash2 size={14} /></button>
        </>
      )} />
    </CrudLayout>
  );
}

type CmsItem = {
  id: string;
  sectionId: string;
  itemKey: string;
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  videoUrl: string;
  linkLabel: string;
  linkUrl: string;
  tags: string[];
  sortOrder: number;
  active: boolean;
};

type CmsPage = {
  id: string;
  pageKey: string;
  title: string;
  active: boolean;
};

type CmsSection = {
  id: string;
  pageId: string;
  sectionKey: string;
  sectionType: string;
  title: string;
  subtitle: string;
  body: string;
  imageUrl: string;
  videoUrl: string;
  ctaLabel: string;
  ctaUrl: string;
  settings: Record<string, unknown>;
  sortOrder: number;
  active: boolean;
  items: CmsItem[];
};

function CmsPanel() {
  const protectedPageKeys = new Set(["home", "artists", "shop", "events", "booking"]);
  const compactActionClass = "inline-flex items-center justify-center gap-1 border border-[#333] text-[var(--brand-gray)] font-bebas tracking-widest px-2 py-1 h-7  text-xs hover:border-[var(--brand-yellow)] hover:text-[var(--brand-yellow)] transition-colors";
  const { data: pages, loading: pagesLoading, error: pagesError, reload: reloadPages } = useAdminData<CmsPage[]>("/admin/cms/pages", []);
  const [selectedPageKey, setSelectedPageKey] = useState("home");
  const [editingPageId, setEditingPageId] = useState("");
  const [pageEditTitle, setPageEditTitle] = useState("");
  const [pageEditActive, setPageEditActive] = useState(true);
  const { data, loading, error, reload } = useAdminData<CmsSection[]>(`/admin/cms/sections?pageKey=${encodeURIComponent(selectedPageKey)}`, []);
  const [editingSectionId, setEditingSectionId] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [newPageKey, setNewPageKey] = useState("");
  const [newPageTitle, setNewPageTitle] = useState("");
  const [showPageForm, setShowPageForm] = useState(false);
  const [showSectionForm, setShowSectionForm] = useState(false);
  const [showItemForm, setShowItemForm] = useState(false);
  const [sectionImageFileName, setSectionImageFileName] = useState("");
  const [itemImageFileName, setItemImageFileName] = useState("");
  const [autoSectionKey, setAutoSectionKey] = useState(true);
  const pageEditFormRef = useRef<HTMLDivElement>(null);
  const sectionFormRef = useRef<HTMLDivElement>(null);
  const sectionItemsPanelRef = useRef<HTMLDivElement>(null);
  const itemFormRef = useRef<HTMLDivElement>(null);
  const [sectionForm, setSectionForm] = useState({
    sectionKey: "",
    sectionType: "content",
    title: "",
    subtitle: "",
    body: "",
    imageUrl: "",
    videoUrl: "",
    ctaLabel: "",
    ctaUrl: "",
    active: true,
  });
  const [editingItemId, setEditingItemId] = useState("");
  const [itemForm, setItemForm] = useState({
    itemKey: "",
    title: "",
    subtitle: "",
    description: "",
    imageUrl: "",
    videoUrl: "",
    linkLabel: "",
    linkUrl: "",
    tags: "",
    active: true,
  });

  const pickCmsImage = (target: "section" | "item", file?: File) => {
    if (!file) return;
    if (target === "section") setSectionImageFileName(file.name);
    if (target === "item") setItemImageFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      if (target === "section") {
        setSectionForm((current) => ({ ...current, imageUrl: result }));
      } else {
        setItemForm((current) => ({ ...current, imageUrl: result }));
      }
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (!selectedPageKey && pages.length > 0) {
      setSelectedPageKey(pages[0].pageKey);
    }
  }, [pages, selectedPageKey]);

  useEffect(() => {
    if (!selectedSectionId) return;
    const hasSelected = data.some((section) => section.id === selectedSectionId);
    if (!hasSelected) {
      setSelectedSectionId("");
      resetItemForm();
      setShowItemForm(false);
    }
  }, [data, selectedSectionId]);

  const currentSection = data.find((section) => section.id === selectedSectionId) ?? null;
  const currentPage = pages.find((page) => page.pageKey === selectedPageKey) ?? null;
  const sectionTypeOptions = useMemo(() => {
    const options = new Set(cmsSectionTypeOptions);
    data.forEach((section) => {
      if (section.sectionType) options.add(section.sectionType);
    });
    if (sectionForm.sectionType) options.add(sectionForm.sectionType);
    return Array.from(options);
  }, [data, sectionForm.sectionType]);

  const clearCmsSectionState = () => {
    setEditingSectionId("");
    setSelectedSectionId("");
    resetItemForm();
    setShowItemForm(false);
    setShowSectionForm(false);
  };

  const selectCmsPage = (pageKey: string) => {
    setSelectedPageKey(pageKey);
    clearCmsSectionState();
    setEditingPageId("");
    setPageEditTitle("");
    setPageEditActive(true);
    setShowPageForm(false);
  };

  const addPage = async () => {
    const pageKey = newPageKey.trim().toLowerCase();
    const title = newPageTitle.trim();
    if (!pageKey) return;
    await apiPost("/admin/cms/pages", { pageKey, title: title || pageKey, active: true });
    setNewPageKey("");
    setNewPageTitle("");
    setShowPageForm(false);
    await reloadPages();
    setSelectedPageKey(pageKey);
  };

  const startAddPage = () => {
    setEditingPageId("");
    setPageEditTitle("");
    setPageEditActive(true);
    setNewPageKey("");
    setNewPageTitle("");
    setShowPageForm(true);
  };

  const cancelPageForm = () => {
    setNewPageKey("");
    setNewPageTitle("");
    setShowPageForm(false);
  };

  const startEditPage = (page: CmsPage) => {
    setSelectedPageKey(page.pageKey);
    clearCmsSectionState();
    setEditingPageId(page.id);
    setPageEditTitle(page.title);
    setPageEditActive(page.active);
    setShowPageForm(false);
    scrollToForm(pageEditFormRef);
  };

  const savePage = async () => {
    if (!editingPageId) return;
    await apiPut(`/admin/cms/pages/${editingPageId}`, {
      title: pageEditTitle.trim(),
      active: pageEditActive,
    });
    setEditingPageId("");
    setPageEditTitle("");
    setPageEditActive(true);
    setShowPageForm(false);
    await reloadPages();
  };

  const deletePage = async (page: CmsPage) => {
    if (protectedPageKeys.has(page.pageKey)) return;
    await apiDelete(`/admin/cms/pages/${page.id}`);
    await reloadPages();
    if (selectedPageKey === page.pageKey) {
      setSelectedPageKey("home");
      setSelectedSectionId("");
      setEditingSectionId("");
    }
  };

  const startAddSection = () => {
    setEditingSectionId("");
    setAutoSectionKey(true);
    setSectionForm({
      sectionKey: "",
      sectionType: "content",
      title: "",
      subtitle: "",
      body: "",
      imageUrl: "",
      videoUrl: "",
      ctaLabel: "",
      ctaUrl: "",
      active: true,
    });
    setSectionImageFileName("");
    setShowSectionForm(true);
  };

  const cancelSectionForm = () => {
    setEditingSectionId("");
    setAutoSectionKey(true);
    setSectionForm({
      sectionKey: "",
      sectionType: "content",
      title: "",
      subtitle: "",
      body: "",
      imageUrl: "",
      videoUrl: "",
      ctaLabel: "",
      ctaUrl: "",
      active: true,
    });
    setSectionImageFileName("");
    setShowSectionForm(false);
  };

  const updateSectionTitle = (title: string) => {
    setSectionForm((current) => ({
      ...current,
      title,
      sectionKey: !editingSectionId && autoSectionKey ? toSectionKey(title) : current.sectionKey,
    }));
  };

  const saveSection = async () => {
    const editingSection = data.find((section) => section.id === editingSectionId);
    const payload = {
      ...sectionForm,
      settings: editingSection?.settings ?? {},
      sortOrder: editingSection?.sortOrder ?? data.length + 1,
      pageId: currentPage?.id,
      pageKey: selectedPageKey,
    };
    if (editingSectionId) await apiPut(`/admin/cms/sections/${editingSectionId}`, payload);
    else await apiPost("/admin/cms/sections", payload);
    setEditingSectionId("");
    setAutoSectionKey(true);
    setSectionForm({
      sectionKey: "",
      sectionType: "content",
      title: "",
      subtitle: "",
      body: "",
      imageUrl: "",
      videoUrl: "",
      ctaLabel: "",
      ctaUrl: "",
      active: true,
    });
    setSectionImageFileName("");
    setShowSectionForm(false);
    await reload();
  };

  const startAddItem = () => {
    setEditingItemId("");
    setItemForm({
      itemKey: "",
      title: "",
      subtitle: "",
      description: "",
      imageUrl: "",
      videoUrl: "",
      linkLabel: "",
      linkUrl: "",
      tags: "",
      active: true,
    });
    setItemImageFileName("");
    setShowItemForm(true);
  };

  const resetItemForm = () => {
    setEditingItemId("");
    setItemForm({
      itemKey: "",
      title: "",
      subtitle: "",
      description: "",
      imageUrl: "",
      videoUrl: "",
      linkLabel: "",
      linkUrl: "",
      tags: "",
      active: true,
    });
    setItemImageFileName("");
  };

  const cancelItemForm = () => {
    resetItemForm();
    setShowItemForm(false);
  };

  const openSectionItems = (sectionId: string) => {
    setSelectedSectionId(sectionId);
    resetItemForm();
    setShowItemForm(false);
    scrollToForm(sectionItemsPanelRef);
  };

  const saveItem = async () => {
    if (!selectedSectionId) return;
    const currentItems = currentSection?.items ?? [];
    const editingItem = currentItems.find((item) => item.id === editingItemId);
    const payload = {
      ...itemForm,
      tags: String(itemForm.tags).split(",").map((tag) => tag.trim()).filter(Boolean),
      sortOrder: editingItem?.sortOrder ?? currentItems.length + 1,
    };
    if (editingItemId) await apiPut(`/admin/cms/items/${editingItemId}`, payload);
    else await apiPost(`/admin/cms/sections/${selectedSectionId}/items`, payload);
    setEditingItemId("");
    setItemForm({
      itemKey: "",
      title: "",
      subtitle: "",
      description: "",
      imageUrl: "",
      videoUrl: "",
      linkLabel: "",
      linkUrl: "",
      tags: "",
      active: true,
    });
    setItemImageFileName("");
    setShowItemForm(false);
    await reload();
  };

  return (
    <CrudLayout title="CMS" loading={loading || pagesLoading} error={error || pagesError}>
      <div className={`${panelClass} p-5 mb-6`}>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-start">
          <DropdownField label="Page" caption="Choose which CMS page you want to manage." value={selectedPageKey} onChange={selectCmsPage}>
            {pages.map((page) => (
              <option key={page.id} value={page.pageKey}>{capitalizeFirst(page.pageKey)}</option>
            ))}
          </DropdownField>
          {!showPageForm && (
            <div className="pt-[24px]">
              <button className={actionClass} onClick={startAddPage}><Save size={16} /> ADD PAGE</button>
            </div>
          )}
        </div>
        {showPageForm && (
          <div className="mt-4 border-t border-[#222] pt-4 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto] gap-3 items-start">
            <LabeledInput label="New Page Key" caption="Internal page identifier used in the URL. Use lowercase letters, numbers, and hyphens; no spaces." value={newPageKey} onChange={(e) => setNewPageKey(e.target.value)} />
            <LabeledInput label="New Page Title" caption="Enter the title shown for this CMS page in admin and page data." value={newPageTitle} onChange={(e) => setNewPageTitle(e.target.value)} />
            <div className="pt-[24px]">
              <button className={actionClass} onClick={addPage}><Save size={16} /> SAVE PAGE</button>
            </div>
            <div className="pt-[24px]">
              <button className={ghostClass} onClick={cancelPageForm}>CANCEL</button>
            </div>
          </div>
        )}
        <div className="mt-4">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full min-w-[620px]">
              <thead>
                <tr className="border-b border-[#222]">
                  <th className="text-left text-[var(--brand-gray)] font-bebas tracking-widest px-3 py-2 text-xs md:text-sm">PAGE KEY</th>
                  <th className="text-left text-[var(--brand-gray)] font-bebas tracking-widest px-3 py-2 text-xs md:text-sm">TITLE</th>
                  <th className="text-left text-[var(--brand-gray)] font-bebas tracking-widest px-3 py-2 text-xs md:text-sm">STATUS</th>
                  <th className="text-left text-[var(--brand-gray)] font-bebas tracking-widest px-3 py-2 text-xs md:text-sm">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {pages.map((page) => (
                  <tr key={page.id} className="border-b border-[#222]">
                    <td className="px-3 py-2 text-white font-mono text-xs">{capitalizeFirst(page.pageKey)}</td>
                    <td className="px-3 py-2 text-white font-sans text-xs md:text-sm">{page.title}</td>
                    <td className="px-3 py-2 text-white font-sans text-xs md:text-sm">{page.active ? "Active" : "Inactive"}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button className={ghostClass} onClick={() => startEditPage(page)}>EDIT</button>
                        <button className={ghostClass} disabled={protectedPageKeys.has(page.pageKey)} onClick={async () => deletePage(page)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {pages.length === 0 && (
                  <tr>
                    <td className="px-3 py-6 text-[var(--brand-gray)] font-bebas text-xl" colSpan={4}>No pages found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="md:hidden divide-y divide-[#222]">
            {pages.map((page) => (
              <div key={page.id} className="py-3 space-y-2">
                <div className="grid grid-cols-[90px_1fr] gap-2 items-start">
                  <p className="text-[var(--brand-gray)] font-bebas tracking-widest text-xs">PAGE KEY</p>
                  <p className="text-white font-mono text-sm break-words">{capitalizeFirst(page.pageKey)}</p>
                </div>
                <div className="grid grid-cols-[90px_1fr] gap-2 items-start">
                  <p className="text-[var(--brand-gray)] font-bebas tracking-widest text-xs">TITLE</p>
                  <p className="text-white font-sans text-sm break-words">{page.title}</p>
                </div>
                <div className="grid grid-cols-[90px_1fr] gap-2 items-start">
                  <p className="text-[var(--brand-gray)] font-bebas tracking-widest text-xs">STATUS</p>
                  <p className="text-white font-sans text-sm">{page.active ? "Active" : "Inactive"}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button className={`${ghostClass} w-full`} onClick={() => startEditPage(page)}>EDIT</button>
                  <button className={`${ghostClass} w-full`} disabled={protectedPageKeys.has(page.pageKey)} onClick={async () => deletePage(page)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
            {pages.length === 0 && (
              <div className="py-6 text-[var(--brand-gray)] font-bebas text-xl">No pages found.</div>
            )}
          </div>
        </div>
        {editingPageId && (
          <div ref={pageEditFormRef} className="mt-4 grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3 items-center scroll-mt-28">
            <LabeledInput label="Page Title" caption="Update the display title for the selected CMS page." value={pageEditTitle} onChange={(e) => setPageEditTitle(e.target.value)} />
            <label className="flex items-center gap-2 text-[var(--brand-gray)] font-sans text-sm">
              <input type="checkbox" checked={pageEditActive} onChange={(e) => setPageEditActive(e.target.checked)} />
              Active
            </label>
            <button className={actionClass} onClick={savePage}><Save size={16} /> SAVE PAGE</button>
          </div>
        )}
      </div>

      <div className="mb-6 flex items-center justify-end gap-3">
        {!showSectionForm ? (
          <button className={actionClass} onClick={startAddSection}><Save size={16} /> ADD SECTION</button>
        ) : (
          <button className={ghostClass} onClick={cancelSectionForm}>CANCEL</button>
        )}
      </div>

      {showSectionForm && (
        <div ref={sectionFormRef} className={`${panelClass} p-5 mb-6 grid grid-cols-1 md:grid-cols-2 gap-3 scroll-mt-28`}>
          <LabeledInput label="Section Key" caption="Internal section identifier. Auto-fills from Title; use lowercase letters, numbers, and underscores." value={sectionForm.sectionKey} onChange={(e) => { setAutoSectionKey(false); setSectionForm({ ...sectionForm, sectionKey: e.target.value }); }} disabled={!!editingSectionId} />
          <DropdownField label="Section Type" caption="Choose the layout behavior for this CMS section." value={sectionForm.sectionType} onChange={(value) => setSectionForm({ ...sectionForm, sectionType: value })}>
            {sectionTypeOptions.map((sectionType) => (
              <option key={sectionType} value={sectionType}>{capitalizeFirst(sectionType)}</option>
            ))}
          </DropdownField>
          <LabeledInput label="Title" caption="Enter the headline displayed for this section; Section Key will auto-fill from it." value={sectionForm.title} onChange={(e) => updateSectionTitle(e.target.value)} />
          <LabeledInput label="Subtitle" caption="Enter optional supporting text shown near the title." value={sectionForm.subtitle} onChange={(e) => setSectionForm({ ...sectionForm, subtitle: e.target.value })} />
          <FileUrlField
            label="Image"
            caption="Paste a section image URL or choose an image file from your device."
            value={sectionForm.imageUrl}
            fileName={sectionImageFileName}
            onTextChange={(value) => {
              setSectionImageFileName("");
              setSectionForm({ ...sectionForm, imageUrl: value });
            }}
            onFileChange={(file) => pickCmsImage("section", file)}
          />
          <LabeledInput label="Video URL" caption="Paste an optional video URL for video-based sections." value={sectionForm.videoUrl} onChange={(e) => setSectionForm({ ...sectionForm, videoUrl: e.target.value })} />
          <LabeledInput label="CTA Label" caption="Enter the button or link text for this section." value={sectionForm.ctaLabel} onChange={(e) => setSectionForm({ ...sectionForm, ctaLabel: e.target.value })} />
          <LabeledInput label="CTA URL" caption="Enter the destination URL for the call-to-action." value={sectionForm.ctaUrl} onChange={(e) => setSectionForm({ ...sectionForm, ctaUrl: e.target.value })} />
          <label className="flex items-center gap-2 text-[var(--brand-gray)] font-sans text-sm">
            <input type="checkbox" checked={sectionForm.active} onChange={(e) => setSectionForm({ ...sectionForm, active: e.target.checked })} />
            Active
          </label>
          <LabeledTextarea label="Description" caption="Add the content that appears under this CMS section heading." className="md:col-span-2" value={sectionForm.body} onChange={(e) => setSectionForm({ ...sectionForm, body: e.target.value })} />
          <button className={actionClass} onClick={saveSection}><Save size={16} /> {editingSectionId ? "UPDATE" : "ADD"} SECTION</button>
        </div>
      )}

      <AdminTable
        rows={data}
        columns={["sectionKey", "sectionType", "title", "active"]}
        formatCell={(row, column, value) => {
          if (column === "sectionKey" || column === "sectionType") {
            return capitalizeFirst(String(value ?? ""));
          }
          if (column === "active") {
            return value ? "Active" : "Inactive";
          }
          return undefined;
        }}
        actions={(row) => (
          <>
            <button className={compactActionClass} onClick={() => {
              setEditingSectionId(row.id);
              setAutoSectionKey(false);
              setSectionForm({
                sectionKey: row.sectionKey,
                sectionType: row.sectionType,
                title: row.title,
                subtitle: row.subtitle,
                body: row.body,
                imageUrl: row.imageUrl,
                videoUrl: row.videoUrl,
                ctaLabel: row.ctaLabel,
                ctaUrl: row.ctaUrl,
                active: row.active ?? true,
              });
              setSectionImageFileName("");
              setShowSectionForm(true);
              scrollToForm(sectionFormRef);
            }}>EDIT</button>
            <button className={compactActionClass} onClick={() => openSectionItems(row.id)}>ITEMS</button>
            <button className={compactActionClass} onClick={async () => { await apiDelete(`/admin/cms/sections/${row.id}`); await reload(); }}><Trash2 size={12} /></button>
          </>
        )}
      />

      {currentSection && (
        <div ref={sectionItemsPanelRef} className={`${panelClass} p-5 mt-6 scroll-mt-28`}>
          <h3 className="text-white font-bebas text-3xl mb-4">SECTION ITEMS ({capitalizeFirst(currentSection.sectionKey)})</h3>
          <div className="mb-6 flex items-center justify-end gap-3">
            {!showItemForm ? (
              <button className={actionClass} onClick={startAddItem}><Save size={16} /> ADD ITEM</button>
            ) : (
              <button className={ghostClass} onClick={cancelItemForm}>CANCEL</button>
            )}
          </div>
          {showItemForm && (
            <div ref={itemFormRef} className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6 scroll-mt-28">
                <LabeledInput label="Item Key" caption="Internal item identifier within this section. Use lowercase letters, numbers, and hyphens or underscores." value={itemForm.itemKey} onChange={(e) => setItemForm({ ...itemForm, itemKey: e.target.value })} />
                <LabeledInput label="Title" caption="Enter the item title shown in this section." value={itemForm.title} onChange={(e) => setItemForm({ ...itemForm, title: e.target.value })} />
                <LabeledInput label="Subtitle" caption="Enter optional supporting text for this item." value={itemForm.subtitle} onChange={(e) => setItemForm({ ...itemForm, subtitle: e.target.value })} />
                <FileUrlField
                  label="Image"
                  caption="Paste an item image URL or choose an image file from your device."
                  value={itemForm.imageUrl}
                  fileName={itemImageFileName}
                  onTextChange={(value) => {
                    setItemImageFileName("");
                    setItemForm({ ...itemForm, imageUrl: value });
                  }}
                  onFileChange={(file) => pickCmsImage("item", file)}
                />
                <LabeledInput label="Video URL" caption="Paste an optional video URL for this item." value={itemForm.videoUrl} onChange={(e) => setItemForm({ ...itemForm, videoUrl: e.target.value })} />
                <LabeledInput label="Link Label" caption="Enter the text shown for this item's link." value={itemForm.linkLabel} onChange={(e) => setItemForm({ ...itemForm, linkLabel: e.target.value })} />
                <LabeledInput label="Link URL" caption="Enter the destination URL for this item's link." value={itemForm.linkUrl} onChange={(e) => setItemForm({ ...itemForm, linkUrl: e.target.value })} />
                <LabeledInput label="Tags" caption="Optional keywords for grouping or metadata. Separate each tag with a comma, for example featured,home." value={itemForm.tags} onChange={(e) => setItemForm({ ...itemForm, tags: e.target.value })} />
                <label className="flex items-center gap-2 text-[var(--brand-gray)] font-sans text-sm">
                  <input type="checkbox" checked={itemForm.active} onChange={(e) => setItemForm({ ...itemForm, active: e.target.checked })} />
                  Active
                </label>
                <LabeledTextarea label="Description" caption="Write the item description displayed in this CMS section." className="md:col-span-2" value={itemForm.description} onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })} />
                <button className={actionClass} onClick={saveItem}><Save size={16} /> {editingItemId ? "UPDATE" : "ADD"} ITEM</button>
            </div>
          )}

          <AdminTable
            rows={currentSection.items ?? []}
            columns={["itemKey", "title", "active"]}
            formatCell={(_, column, value) => {
              if (column === "itemKey") {
                return capitalizeFirst(String(value ?? ""));
              }
              if (column === "active") {
                return value ? "Active" : "Inactive";
              }
              return undefined;
            }}
            actions={(row) => (
              <>
                <button className={compactActionClass} onClick={() => {
                  setEditingItemId(row.id);
                  setItemForm({
                    itemKey: row.itemKey ?? "",
                    title: row.title ?? "",
                    subtitle: row.subtitle ?? "",
                    description: row.description ?? "",
                    imageUrl: row.imageUrl ?? "",
                    videoUrl: row.videoUrl ?? "",
                    linkLabel: row.linkLabel ?? "",
                    linkUrl: row.linkUrl ?? "",
                    tags: Array.isArray(row.tags) ? row.tags.join(",") : "",
                    active: row.active ?? true,
                  });
                  setItemImageFileName("");
                  setShowItemForm(true);
                  scrollToForm(itemFormRef);
                }}>EDIT</button>
                <button className={compactActionClass} onClick={async () => { await apiDelete(`/admin/cms/items/${row.id}`); await reload(); }}><Trash2 size={12} /></button>
              </>
            )}
          />
        </div>
      )}
    </CrudLayout>
  );
}

type AdminOrder = {
  id: string;
  userId: string;
  status: string;
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  createdAt: string;
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    createdAt: string;
  } | null;
  items: {
    id: string;
    productId: string;
    name: string;
    artist: string;
    image: string;
    size: string;
    quantity: number;
    price: number;
  }[];
};

function OrdersPanel({ orderId }: { orderId?: string }) {
  const navigate = useNavigate();
  const { data, loading, error, reload } = useAdminData<AdminOrder[]>("/admin/orders", []);
  const statuses = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const refreshDetail = async (id: string) => {
    try {
      setDetailLoading(true);
      setDetailError("");
      const detail = await apiGet<AdminOrder>(`/admin/orders/${id}`);
      setSelectedOrder(detail);
    } catch (error: any) {
      setSelectedOrder(null);
      setDetailError(error?.message ?? "Unable to load order detail.");
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    if (!orderId) {
      setSelectedOrder(null);
      setDetailError("");
      setDetailLoading(false);
      return;
    }
    refreshDetail(orderId);
  }, [orderId]);

  return (
    <CrudLayout title="ORDERS" loading={loading} error={error}>
      {!orderId && (
        <div className={panelClass}>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full table-fixed">
              <thead>
                <tr className="border-b border-[#222]">
                  <th className="w-[19%] text-left text-[var(--brand-gray)] font-bebas tracking-widest px-2 py-3 whitespace-nowrap">ID</th>
                  <th className="w-[10%] text-left text-[var(--brand-gray)] font-bebas tracking-widest px-2 py-3 whitespace-nowrap">USER</th>
                  <th className="w-[17%] text-left text-[var(--brand-gray)] font-bebas tracking-widest px-2 py-3 whitespace-nowrap">PRODUCTS</th>
                  <th className="w-[9%] text-left text-[var(--brand-gray)] font-bebas tracking-widest px-2 py-3 whitespace-nowrap">TOTAL</th>
                  <th className="w-[14%] text-left text-[var(--brand-gray)] font-bebas tracking-widest px-2 py-3 whitespace-nowrap">CREATED</th>
                  <th className="w-[13%] text-left text-[var(--brand-gray)] font-bebas tracking-widest px-2 py-3 whitespace-nowrap">STATUS</th>
                  <th className="w-[18%] text-left text-[var(--brand-gray)] font-bebas tracking-widest px-2 py-3 whitespace-nowrap">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr key={row.id} className="border-b border-[#222]">
                    <td className="px-2 py-3 text-white font-sans text-sm truncate">{shortId(row.id)}</td>
                    <td className="px-2 py-3 text-white font-sans text-sm truncate">{row.customer?.name || `${row.firstName} ${row.lastName}`}</td>
                    <td className="px-2 py-3 text-white font-mono text-[11px] leading-4 truncate">
                      {row.items.length > 0 ? row.items.map((item) => item.name).join(", ") : "-"}
                    </td>
                    <td className="px-2 py-3 text-white font-sans text-sm whitespace-nowrap">{money(row.totalCents)}</td>
                    <td className="px-2 py-3 text-white font-sans text-sm">
                      <span className="block truncate">{formatDateTime(row.createdAt)}</span>
                    </td>
                    <td className="px-2 py-3 text-white font-sans text-sm">
                      <span className="block truncate">{row.status}</span>
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex flex-col gap-1 w-full">
                        <button
                          className={`${ghostClass} w-full text-xs py-1`}
                          onClick={() => navigate(`/admin/orders/${row.id}`)}
                        >
                          VIEW
                        </button>
                        <select
                          className="w-full bg-[#111] border border-[#333] text-white font-sans px-1 py-1 text-xs focus:border-[var(--brand-yellow)] focus:outline-none"
                          value={row.status}
                          onChange={async (e) => {
                            await apiPut(`/admin/orders/${row.id}/status`, { status: e.target.value });
                            await reload();
                          }}
                        >
                          {statuses.map((status) => <option key={status}>{status}</option>)}
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
                {data.length === 0 && (
                  <tr>
                    <td className="px-4 py-8 text-[var(--brand-gray)] font-bebas text-xl" colSpan={7}>
                      No records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="md:hidden divide-y divide-[#222]">
            {data.map((row) => (
              <div key={row.id} className="p-4 space-y-3">
                <div className="grid grid-cols-[90px_1fr] gap-2 items-start">
                  <p className="text-[var(--brand-gray)] font-bebas tracking-widest text-xs">ID</p>
                  <p className="text-white font-sans text-sm break-all">{row.id}</p>
                </div>
                <div className="grid grid-cols-[90px_1fr] gap-2 items-start">
                  <p className="text-[var(--brand-gray)] font-bebas tracking-widest text-xs">USER</p>
                  <p className="text-white font-sans text-sm break-words">{row.customer?.name || `${row.firstName} ${row.lastName}`}</p>
                </div>
                <div className="grid grid-cols-[90px_1fr] gap-2 items-start">
                  <p className="text-[var(--brand-gray)] font-bebas tracking-widest text-xs">PRODUCTS</p>
                  <p className="text-white font-sans text-sm break-words">{row.items.length > 0 ? row.items.map((item) => item.name).join(", ") : "-"}</p>
                </div>
                <div className="grid grid-cols-[90px_1fr] gap-2 items-start">
                  <p className="text-[var(--brand-gray)] font-bebas tracking-widest text-xs">TOTAL</p>
                  <p className="text-white font-sans text-sm">{money(row.totalCents)}</p>
                </div>
                <div className="grid grid-cols-[90px_1fr] gap-2 items-start">
                  <p className="text-[var(--brand-gray)] font-bebas tracking-widest text-xs">CREATED</p>
                  <p className="text-white font-sans text-sm">{formatDateTime(row.createdAt)}</p>
                </div>
                <div className="grid grid-cols-[90px_1fr] gap-2 items-start">
                  <p className="text-[var(--brand-gray)] font-bebas tracking-widest text-xs">STATUS</p>
                  <p className="text-white font-sans text-sm">{row.status}</p>
                </div>
                <div className="grid grid-cols-1 gap-2 pt-1">
                  <button
                    className={`${ghostClass} w-full text-xs py-2`}
                    onClick={() => navigate(`/admin/orders/${row.id}`)}
                  >
                    VIEW
                  </button>
                  <select
                    className="w-full bg-[#111] border border-[#333] text-white font-sans px-2 py-2 text-sm focus:border-[var(--brand-yellow)] focus:outline-none"
                    value={row.status}
                    onChange={async (e) => {
                      await apiPut(`/admin/orders/${row.id}/status`, { status: e.target.value });
                      await reload();
                    }}
                  >
                    {statuses.map((status) => <option key={status}>{status}</option>)}
                  </select>
                </div>
              </div>
            ))}
            {data.length === 0 && (
              <div className="px-4 py-8 text-[var(--brand-gray)] font-bebas text-xl">
                No records found.
              </div>
            )}
          </div>
        </div>
      )}

      {orderId && (
        <div className={`${panelClass} mt-6 p-5`}>
          <div className="flex items-center justify-between gap-3 mb-4">
            <h3 className="text-white font-bebas text-3xl">ORDER DETAIL</h3>
            <button className={ghostClass} onClick={() => navigate("/admin/orders")}>BACK</button>
          </div>

          {detailLoading && <p className="text-[var(--brand-gray)] font-bebas text-xl">Loading order detail...</p>}
          {detailError && <p className="text-red-400 font-sans text-sm">{detailError}</p>}

          {!detailLoading && !detailError && selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#111] border border-[#222] p-4">
                  <p className="text-[var(--brand-gray)] font-bebas tracking-widest text-xs">USER DETAIL</p>
                  <p className="text-white font-sans text-sm mt-2">Name: {selectedOrder.customer?.name || `${selectedOrder.firstName} ${selectedOrder.lastName}`}</p>
                  <p className="text-white font-sans text-sm">Email: {selectedOrder.customer?.email || "-"}</p>
                  <p className="text-white font-sans text-sm">Phone: {selectedOrder.customer?.phone || "-"}</p>
                  <p className="text-white font-sans text-sm">User ID: {selectedOrder.userId}</p>
                </div>
                <div className="bg-[#111] border border-[#222] p-4">
                  <p className="text-[var(--brand-gray)] font-bebas tracking-widest text-xs">ORDER DETAIL</p>
                  <p className="text-white font-sans text-sm mt-2">Order ID: {selectedOrder.id}</p>
                  <p className="text-white font-sans text-sm">Created: {formatDateTime(selectedOrder.createdAt)}</p>
                  <div className="mt-3 flex items-center gap-3">
                    <span className="text-white font-sans text-sm">Status</span>
                    <select
                      className={inputClass}
                      value={selectedOrder.status}
                      onChange={async (e) => {
                        await apiPut(`/admin/orders/${selectedOrder.id}/status`, { status: e.target.value });
                        await reload();
                        await refreshDetail(selectedOrder.id);
                      }}
                    >
                      {statuses.map((status) => <option key={status}>{status}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-[#111] border border-[#222] p-4">
                <p className="text-[var(--brand-gray)] font-bebas tracking-widest text-xs">SHIPPING ADDRESS</p>
                <p className="text-white font-sans text-sm mt-2">{selectedOrder.firstName} {selectedOrder.lastName}</p>
                <p className="text-white font-sans text-sm">{selectedOrder.address}</p>
                <p className="text-white font-sans text-sm">{selectedOrder.city}, {selectedOrder.state} {selectedOrder.zip}</p>
                <p className="text-white font-sans text-sm">{selectedOrder.country}</p>
              </div>

              <div className="bg-[#111] border border-[#222] overflow-x-auto">
                <table className="w-full min-w-[760px]">
                  <thead>
                    <tr className="border-b border-[#222]">
                      {["PRODUCT", "NAME", "SIZE", "QTY", "PRICE", "LINE TOTAL"].map((column) => (
                        <th key={column} className="text-left text-[var(--brand-gray)] font-bebas tracking-widest px-4 py-3">{column}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items.map((item) => (
                      <tr key={item.id} className="border-b border-[#222]">
                        <td className="px-4 py-3">
                          <img src={item.image} alt={item.name} className="w-12 h-12 object-cover border border-[#222]" />
                        </td>
                        <td className="px-4 py-3 text-white font-sans text-sm">{item.name}</td>
                        <td className="px-4 py-3 text-white font-sans text-sm">{item.size}</td>
                        <td className="px-4 py-3 text-white font-sans text-sm">{item.quantity}</td>
                        <td className="px-4 py-3 text-white font-sans text-sm">{money(item.price)}</td>
                        <td className="px-4 py-3 text-white font-sans text-sm">{money(item.price * item.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-[#111] border border-[#222] p-3">
                  <p className="text-[var(--brand-gray)] font-bebas tracking-widest text-xs">SUBTOTAL</p>
                  <p className="text-white font-bebas text-2xl">{money(selectedOrder.subtotalCents)}</p>
                </div>
                <div className="bg-[#111] border border-[#222] p-3">
                  <p className="text-[var(--brand-gray)] font-bebas tracking-widest text-xs">SHIPPING</p>
                  <p className="text-white font-bebas text-2xl">{money(selectedOrder.shippingCents)}</p>
                </div>
                <div className="bg-[#111] border border-[#222] p-3">
                  <p className="text-[var(--brand-gray)] font-bebas tracking-widest text-xs">TAX</p>
                  <p className="text-white font-bebas text-2xl">{money(selectedOrder.taxCents)}</p>
                </div>
                <div className="bg-[#111] border border-[#222] p-3">
                  <p className="text-[var(--brand-gray)] font-bebas tracking-widest text-xs">TOTAL</p>
                  <p className="text-[var(--brand-yellow)] font-bebas text-2xl">{money(selectedOrder.totalCents)}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </CrudLayout>
  );
}

function UsersPanel() {
  const { data, loading, error, reload } = useAdminData<any[]>("/admin/users", []);
  return (
    <CrudLayout title="USERS" loading={loading} error={error}>
      <AdminTable rows={data} columns={["name", "email", "phone", "role"]} actions={(row) => (
        <select className={inputClass} value={row.role} onChange={async (e) => { await apiPut(`/admin/users/${row.id}/role`, { role: e.target.value }); await reload(); }}>
          <option value="user">user</option>
          <option value="admin">admin</option>
        </select>
      )} />
    </CrudLayout>
  );
}

function BookingsPanel() {
  const { data, loading, error, reload } = useAdminData<any[]>("/admin/bookings", []);
  const statuses = ["New", "Contacted", "Confirmed", "Declined", "Completed"];
  return (
    <CrudLayout title="BOOKINGS" loading={loading} error={error}>
      <AdminTable rows={data} columns={["name", "email", "artist", "eventType", "eventDate", "status"]} actions={(row) => (
        <select className={inputClass} value={row.status} onChange={async (e) => { await apiPut(`/admin/bookings/${row.id}/status`, { status: e.target.value }); await reload(); }}>
          {statuses.map((status) => <option key={status}>{status}</option>)}
        </select>
      )} />
    </CrudLayout>
  );
}

function EventContactsPanel() {
  const { data, loading, error, reload } = useAdminData<any[]>("/admin/event-contacts", []);
  const statuses = ["New", "Contacted", "In Progress", "Resolved", "Closed"];
  return (
    <CrudLayout title="EVENT CONTACT" loading={loading} error={error}>
      <AdminTable rows={data} columns={["name", "email", "phone", "artist", "eventType", "eventDate", "status"]} actions={(row) => (
        <select className={inputClass} value={row.status} onChange={async (e) => { await apiPut(`/admin/event-contacts/${row.id}/status`, { status: e.target.value }); await reload(); }}>
          {statuses.map((status) => <option key={status}>{status}</option>)}
        </select>
      )} />
    </CrudLayout>
  );
}

function CrudLayout({ title, loading, error, children }: { title: string; loading: boolean; error: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-white font-bebas text-4xl mb-6">{title}</h2>
      <StatusText loading={loading} error={error} />
      {children}
    </div>
  );
}

function SimpleForm({ fields, form, setForm, onSave, saveLabel, disabledId }: { fields: string[]; form: any; setForm: (value: any) => void; onSave: () => void; saveLabel: string; disabledId?: string }) {
  return (
    <div className={`${panelClass} p-5 mb-6 grid grid-cols-1 md:grid-cols-2 gap-3`}>
      {fields.map((key) => (
        <LabeledInput key={key} label={toDisplayLabel(key)} caption={`Enter the ${toDisplayLabel(key).toLowerCase()} value.`} value={form[key] ?? ""} disabled={disabledId === key} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
      ))}
      <label className="flex items-center gap-2 text-[var(--brand-gray)] font-sans text-sm">
        <input type="checkbox" checked={form.active ?? true} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
        Active
      </label>
      <button className={actionClass} onClick={onSave}><Save size={16} /> {saveLabel}</button>
    </div>
  );
}

function AdminTable({
  rows,
  columns,
  actions,
  formatCell,
}: {
  rows: any[];
  columns: string[];
  actions?: (row: any) => React.ReactNode;
  formatCell?: (row: any, column: string, value: unknown) => React.ReactNode | undefined;
}) {
  const resolveCell = (row: any, column: string) =>
    formatCell?.(row, column, row[column]) ??
    (Array.isArray(row[column]) ? row[column].join(", ") : column.toLowerCase().includes("cents") ? money(row[column] ?? 0) : String(row[column] ?? ""));

  return (
    <div className={panelClass}>
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full table-fixed">
          <thead>
            <tr className="border-b border-[#222]">
              {columns.map((column) => (
                <th key={column} className="text-left text-[var(--brand-gray)] font-bebas tracking-widest px-3 py-3 text-xs md:text-sm">
                  {column.toLowerCase() === "active" ? "STATUS" : column.toUpperCase()}
                </th>
              ))}
              {actions && <th className="w-[190px] text-left text-[var(--brand-gray)] font-bebas tracking-widest px-3 py-3 text-xs md:text-sm">ACTIONS</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id ?? row.slug} className="border-b border-[#222]">
                {columns.map((column) => (
                  <td key={column} className="px-3 py-3 text-white font-sans text-sm truncate">
                    {resolveCell(row, column)}
                  </td>
                ))}
                {actions && (
                  <td className="px-3 py-3 w-[190px]">
                    <div className="flex gap-2 items-center flex-wrap">{actions(row)}</div>
                  </td>
                )}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td className="px-4 py-8 text-[var(--brand-gray)] font-bebas text-xl" colSpan={columns.length + 1}>No records found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="md:hidden divide-y divide-[#222]">
        {rows.map((row) => (
          <div key={row.id ?? row.slug} className="p-4 space-y-3">
            <div className="grid grid-cols-1 gap-2">
              {columns.map((column) => (
                <div key={column} className="grid grid-cols-[88px_1fr] gap-2 items-start">
                  <p className="text-[var(--brand-gray)] font-bebas tracking-widest text-xs">
                    {column.toLowerCase() === "active" ? "STATUS" : column.toUpperCase()}
                  </p>
                  <p
                    className={`text-white font-sans text-sm ${
                      column.toLowerCase().includes("email") || column.toLowerCase().includes("id")
                        ? "break-all"
                        : "break-words"
                    }`}
                  >
                    {resolveCell(row, column)}
                  </p>
                </div>
              ))}
            </div>
            {actions && (
              <div className="pt-1">
                <p className="text-[var(--brand-gray)] font-bebas tracking-widest text-xs mb-2">ACTIONS</p>
                <div className="grid grid-cols-1 gap-2 [&>select]:w-full [&>button]:w-full">{actions(row)}</div>
              </div>
            )}
          </div>
        ))}
        {rows.length === 0 && (
          <div className="px-4 py-8 text-[var(--brand-gray)] font-bebas text-xl">No records found.</div>
        )}
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { section: sectionParam, orderId } = useParams<{ section?: string; orderId?: string }>();
  const { user, isLoggedIn, isAuthLoading } = useAuth();
  const section = useMemo<AdminSection>(() => {
    if (orderId) return "orders";
    return sections.some((item) => item.id === sectionParam) ? (sectionParam as AdminSection) : "dashboard";
  }, [sectionParam, orderId]);

  useEffect(() => {
    if (!isLoggedIn || user?.role !== "admin") return;
    const prefetchPaths = [
      "/admin/dashboard",
      "/admin/products",
      "/admin/artists",
      "/admin/orders",
      "/admin/users",
      "/admin/bookings",
      "/admin/event-contacts",
      "/admin/cms/pages",
      "/admin/cms/sections?pageKey=home",
    ];

    prefetchPaths.forEach((path) => {
      if (getFreshAdminCache(path)) return;
      fetchAdminData(path).catch(() => {
        // Best-effort prefetch only.
      });
    });
  }, [isLoggedIn, user?.role]);

  if (!user && isAuthLoading) {
    return (
      <main className="w-full min-h-screen bg-[var(--brand-black)] pt-28 pb-20 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <p className="text-[var(--brand-gray)] font-bebas text-3xl">LOADING ADMIN...</p>
        </div>
      </main>
    );
  }

  if (!user && !isLoggedIn) return <Navigate to="/auth" replace state={{ from: "/admin", tab: "login" }} />;
  if (user?.role !== "admin") return <Navigate to="/account" replace />;

  const content = {
    dashboard: <Dashboard />,
    cms: <CmsPanel />,
    products: <ProductsPanel />,
    artists: <ArtistsPanel />,
    orders: <OrdersPanel orderId={orderId} />,
    users: <UsersPanel />,
    bookings: <BookingsPanel />,
    "event-contacts": <EventContactsPanel />,
  }[section];

  return <AdminShell section={section}>{content}</AdminShell>;
}
