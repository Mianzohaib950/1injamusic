import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import {
  BarChart3,
  CalendarCheck,
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
  "inline-flex items-center justify-center gap-2 border border-[#333] text-[var(--brand-gray)] font-bebas tracking-widest px-4 py-2 hover:border-[var(--brand-yellow)] hover:text-[var(--brand-yellow)] transition-colors";

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
  const [data, setData] = useState<T>(fallback);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setData(await apiGet<T>(path));
    } catch (error: any) {
      setError(error?.message ?? "Unable to load data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [path]);

  return { data, loading, error, reload: load };
}

function StatusText({ loading, error }: { loading: boolean; error: string }) {
  if (loading) return <p className="text-[var(--brand-gray)] font-bebas text-xl">Loading...</p>;
  if (error) return <p className="text-red-400 font-sans text-sm">{error}</p>;
  return null;
}

function Dashboard() {
  const { data, loading, error } = useAdminData<any>("/admin/dashboard", null);
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(data.ordersByStatus).map(([status, count]) => (
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
  const [form, setForm] = useState<any>(blank);
  const [editingId, setEditingId] = useState("");

  const pickImage = (field: "image" | "imageHover", file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setForm((current: any) => ({ ...current, [field]: result }));
    };
    reader.readAsDataURL(file);
  };

  const save = async () => {
    const payload = {
      ...form,
      price: Number(form.price),
      originalPrice: form.originalPrice === "" ? null : Number(form.originalPrice),
      sizes: String(form.sizes).split(",").map((size) => size.trim()).filter(Boolean),
    };
    if (editingId) await apiPut(`/admin/products/${editingId}`, payload);
    else await apiPost("/admin/products", payload);
    setForm(blank);
    setEditingId("");
    await reload();
  };

  return (
    <CrudLayout title="PRODUCTS" loading={loading} error={error}>
      <div className={`${panelClass} p-5 mb-6 grid grid-cols-1 md:grid-cols-2 gap-3`}>
        {["id", "name", "artist", "artistSlug", "category", "image", "imageHover", "badge", "sizes"].map((key) => (
          <input key={key} className={inputClass} placeholder={key} value={form[key] ?? ""} onChange={(e) => setForm({ ...form, [key]: e.target.value })} disabled={key === "id" && !!editingId} />
        ))}
        <label className="text-[var(--brand-gray)] font-sans text-sm">
          Image file
          <input className={`${inputClass} mt-2`} type="file" accept="image/*" onChange={(e) => pickImage("image", e.target.files?.[0])} />
        </label>
        <label className="text-[var(--brand-gray)] font-sans text-sm">
          Hover image file
          <input className={`${inputClass} mt-2`} type="file" accept="image/*" onChange={(e) => pickImage("imageHover", e.target.files?.[0])} />
        </label>
        <input className={inputClass} placeholder="price" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
        <input className={inputClass} placeholder="originalPrice" type="number" value={form.originalPrice} onChange={(e) => setForm({ ...form, originalPrice: e.target.value })} />
        <textarea className={`${inputClass} md:col-span-2`} placeholder="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <label className="flex items-center gap-2 text-[var(--brand-gray)] font-sans text-sm">
          <input type="checkbox" checked={form.inStock} onChange={(e) => setForm({ ...form, inStock: e.target.checked })} />
          In stock
        </label>
        <button className={actionClass} onClick={save}><Save size={16} /> {editingId ? "UPDATE" : "ADD"} PRODUCT</button>
      </div>
      <AdminTable
        rows={data}
        columns={["name", "artist", "category", "price", "inStock"]}
        actions={(row) => (
          <>
            <button className={ghostClass} onClick={() => { setEditingId(row.id); setForm({ ...row, sizes: (row.sizes ?? []).join(","), originalPrice: row.originalPrice ?? "" }); }}>EDIT</button>
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
  const save = async () => {
    const payload = { ...form, genres: String(form.genres).split(",").map((item) => item.trim()).filter(Boolean), sortOrder: Number(form.sortOrder) };
    if (editingSlug) await apiPut(`/admin/artists/${editingSlug}`, payload);
    else await apiPost("/admin/artists", payload);
    setForm(blank);
    setEditingSlug("");
    await reload();
  };
  return (
    <CrudLayout title="ARTISTS" loading={loading} error={error}>
      <SimpleForm fields={["slug", "name", "genres", "bio", "image", "bookingEmail", "sortOrder"]} form={form} setForm={setForm} onSave={save} saveLabel={editingSlug ? "UPDATE ARTIST" : "ADD ARTIST"} disabledId={!!editingSlug ? "slug" : ""} />
      <AdminTable rows={data} columns={["name", "slug", "genres", "active"]} actions={(row) => (
        <>
          <button className={ghostClass} onClick={() => { setEditingSlug(row.slug); setForm({ ...row, genres: (row.genres ?? []).join(",") }); }}>EDIT</button>
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
  const compactActionClass = "inline-flex items-center justify-center gap-1 border border-[#333] text-[var(--brand-gray)] font-bebas tracking-widest px-2 py-1 text-xs hover:border-[var(--brand-yellow)] hover:text-[var(--brand-yellow)] transition-colors";
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
    settingsJson: "{}",
    sortOrder: 0,
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
    sortOrder: 0,
    active: true,
  });

  useEffect(() => {
    if (!selectedPageKey && pages.length > 0) {
      setSelectedPageKey(pages[0].pageKey);
    }
  }, [pages, selectedPageKey]);

  useEffect(() => {
    if (data.length === 0) return;
    const hasSelected = data.some((section) => section.id === selectedSectionId);
    if (hasSelected) return;
    const preferred = data.find((section) => section.sectionKey === "content") ?? data[0];
    setSelectedSectionId(preferred.id);
  }, [data, selectedSectionId]);

  const currentSection = data.find((section) => section.id === selectedSectionId) ?? null;
  const currentPage = pages.find((page) => page.pageKey === selectedPageKey) ?? null;

  const addPage = async () => {
    const pageKey = newPageKey.trim().toLowerCase();
    const title = newPageTitle.trim();
    if (!pageKey) return;
    await apiPost("/admin/cms/pages", { pageKey, title: title || pageKey, active: true });
    setNewPageKey("");
    setNewPageTitle("");
    await reloadPages();
    setSelectedPageKey(pageKey);
  };

  const startEditPage = (page: CmsPage) => {
    setEditingPageId(page.id);
    setPageEditTitle(page.title);
    setPageEditActive(page.active);
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

  const saveSection = async () => {
    let settings: Record<string, unknown> = {};
    try {
      settings = sectionForm.settingsJson.trim() ? JSON.parse(sectionForm.settingsJson) : {};
    } catch {
      settings = {};
    }

    const payload = {
      ...sectionForm,
      settings,
      sortOrder: Number(sectionForm.sortOrder),
      pageId: currentPage?.id,
      pageKey: selectedPageKey,
    };
    if (editingSectionId) await apiPut(`/admin/cms/sections/${editingSectionId}`, payload);
    else await apiPost("/admin/cms/sections", payload);
    setEditingSectionId("");
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
      settingsJson: "{}",
      sortOrder: 0,
      active: true,
    });
    await reload();
  };

  const saveItem = async () => {
    if (!selectedSectionId) return;
    const payload = {
      ...itemForm,
      tags: String(itemForm.tags).split(",").map((tag) => tag.trim()).filter(Boolean),
      sortOrder: Number(itemForm.sortOrder),
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
      sortOrder: 0,
      active: true,
    });
    await reload();
  };

  return (
    <CrudLayout title="CMS" loading={loading || pagesLoading} error={error || pagesError}>
      <div className={`${panelClass} p-5 mb-6`}>
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_220px_220px_auto] gap-3 items-end">
          <label className="text-[var(--brand-gray)] font-sans text-sm">
            Page
            <select className={`${inputClass} mt-2`} value={selectedPageKey} onChange={(e) => { setSelectedPageKey(e.target.value); setEditingSectionId(""); setSelectedSectionId(""); }}>
              {pages.map((page) => (
                <option key={page.id} value={page.pageKey}>{page.title} ({capitalizeFirst(page.pageKey)})</option>
              ))}
            </select>
          </label>
          <input className={inputClass} placeholder="new page key (e.g. home2)" value={newPageKey} onChange={(e) => setNewPageKey(e.target.value)} />
          <input className={inputClass} placeholder="new page title" value={newPageTitle} onChange={(e) => setNewPageTitle(e.target.value)} />
          <button className={actionClass} onClick={addPage}><Save size={16} /> ADD PAGE</button>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[620px]">
            <thead>
              <tr className="border-b border-[#222]">
                <th className="text-left text-[var(--brand-gray)] font-bebas tracking-widest px-3 py-2 text-xs md:text-sm">PAGE KEY</th>
                <th className="text-left text-[var(--brand-gray)] font-bebas tracking-widest px-3 py-2 text-xs md:text-sm">TITLE</th>
                <th className="text-left text-[var(--brand-gray)] font-bebas tracking-widest px-3 py-2 text-xs md:text-sm">ACTIVE</th>
                <th className="text-left text-[var(--brand-gray)] font-bebas tracking-widest px-3 py-2 text-xs md:text-sm">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((page) => (
                <tr key={page.id} className="border-b border-[#222]">
                  <td className="px-3 py-2 text-white font-mono text-xs">{capitalizeFirst(page.pageKey)}</td>
                  <td className="px-3 py-2 text-white font-sans text-xs md:text-sm">{page.title}</td>
                  <td className="px-3 py-2 text-white font-sans text-xs md:text-sm">{page.active ? "Yes" : "No"}</td>
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
        {editingPageId && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3 items-center">
            <input className={inputClass} placeholder="page title" value={pageEditTitle} onChange={(e) => setPageEditTitle(e.target.value)} />
            <label className="flex items-center gap-2 text-[var(--brand-gray)] font-sans text-sm">
              <input type="checkbox" checked={pageEditActive} onChange={(e) => setPageEditActive(e.target.checked)} />
              Active
            </label>
            <button className={actionClass} onClick={savePage}><Save size={16} /> SAVE PAGE</button>
          </div>
        )}
      </div>

      <div className={`${panelClass} p-5 mb-6 grid grid-cols-1 md:grid-cols-2 gap-3`}>
        <input className={inputClass} placeholder="sectionKey (hero, marquee...)" value={sectionForm.sectionKey} onChange={(e) => setSectionForm({ ...sectionForm, sectionKey: e.target.value })} disabled={!!editingSectionId} />
        <input className={inputClass} placeholder="sectionType (content, list, gallery...)" value={sectionForm.sectionType} onChange={(e) => setSectionForm({ ...sectionForm, sectionType: e.target.value })} />
        <input className={inputClass} placeholder="title" value={sectionForm.title} onChange={(e) => setSectionForm({ ...sectionForm, title: e.target.value })} />
        <input className={inputClass} placeholder="subtitle" value={sectionForm.subtitle} onChange={(e) => setSectionForm({ ...sectionForm, subtitle: e.target.value })} />
        <input className={inputClass} placeholder="imageUrl" value={sectionForm.imageUrl} onChange={(e) => setSectionForm({ ...sectionForm, imageUrl: e.target.value })} />
        <input className={inputClass} placeholder="videoUrl" value={sectionForm.videoUrl} onChange={(e) => setSectionForm({ ...sectionForm, videoUrl: e.target.value })} />
        <input className={inputClass} placeholder="ctaLabel" value={sectionForm.ctaLabel} onChange={(e) => setSectionForm({ ...sectionForm, ctaLabel: e.target.value })} />
        <input className={inputClass} placeholder="ctaUrl" value={sectionForm.ctaUrl} onChange={(e) => setSectionForm({ ...sectionForm, ctaUrl: e.target.value })} />
        <input className={inputClass} type="number" placeholder="sortOrder" value={sectionForm.sortOrder} onChange={(e) => setSectionForm({ ...sectionForm, sortOrder: Number(e.target.value) })} />
        <label className="flex items-center gap-2 text-[var(--brand-gray)] font-sans text-sm">
          <input type="checkbox" checked={sectionForm.active} onChange={(e) => setSectionForm({ ...sectionForm, active: e.target.checked })} />
          Active
        </label>
        <textarea className={`${inputClass} md:col-span-2`} placeholder="body" value={sectionForm.body} onChange={(e) => setSectionForm({ ...sectionForm, body: e.target.value })} />
        <textarea className={`${inputClass} md:col-span-2`} placeholder='settings JSON (example: {"line1":"WE COLLABORATE","email":"booking@..."} )' value={sectionForm.settingsJson} onChange={(e) => setSectionForm({ ...sectionForm, settingsJson: e.target.value })} />
        <button className={actionClass} onClick={saveSection}><Save size={16} /> {editingSectionId ? "UPDATE" : "ADD"} SECTION</button>
      </div>

      <AdminTable
        rows={data}
        columns={["sectionKey", "sectionType", "title", "sortOrder", "active"]}
        formatCell={(row, column, value) => {
          if (column === "sectionKey" || column === "sectionType") {
            return capitalizeFirst(String(value ?? ""));
          }
          return undefined;
        }}
        actions={(row) => (
          <>
            <button className={compactActionClass} onClick={() => {
              setEditingSectionId(row.id);
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
                settingsJson: JSON.stringify(row.settings ?? {}, null, 2),
                sortOrder: row.sortOrder ?? 0,
                active: row.active ?? true,
              });
              setSelectedSectionId(row.id);
            }}>EDIT</button>
            <button className={compactActionClass} onClick={() => setSelectedSectionId(row.id)}>ITEMS</button>
            <button className={compactActionClass} onClick={async () => { await apiDelete(`/admin/cms/sections/${row.id}`); await reload(); }}><Trash2 size={12} /></button>
          </>
        )}
      />

      <div className={`${panelClass} p-5 mt-6`}>
        <h3 className="text-white font-bebas text-3xl mb-4">SECTION ITEMS {currentSection ? `(${capitalizeFirst(currentSection.sectionKey)})` : ""}</h3>
        {!currentSection && <p className="text-[var(--brand-gray)] font-sans">Select a section to manage its items.</p>}
        {currentSection && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
              <input className={inputClass} placeholder="itemKey" value={itemForm.itemKey} onChange={(e) => setItemForm({ ...itemForm, itemKey: e.target.value })} />
              <input className={inputClass} placeholder="title" value={itemForm.title} onChange={(e) => setItemForm({ ...itemForm, title: e.target.value })} />
              <input className={inputClass} placeholder="subtitle" value={itemForm.subtitle} onChange={(e) => setItemForm({ ...itemForm, subtitle: e.target.value })} />
              <input className={inputClass} placeholder="imageUrl" value={itemForm.imageUrl} onChange={(e) => setItemForm({ ...itemForm, imageUrl: e.target.value })} />
              <input className={inputClass} placeholder="videoUrl" value={itemForm.videoUrl} onChange={(e) => setItemForm({ ...itemForm, videoUrl: e.target.value })} />
              <input className={inputClass} placeholder="linkLabel" value={itemForm.linkLabel} onChange={(e) => setItemForm({ ...itemForm, linkLabel: e.target.value })} />
              <input className={inputClass} placeholder="linkUrl" value={itemForm.linkUrl} onChange={(e) => setItemForm({ ...itemForm, linkUrl: e.target.value })} />
              <input className={inputClass} placeholder="tags (comma separated)" value={itemForm.tags} onChange={(e) => setItemForm({ ...itemForm, tags: e.target.value })} />
              <input className={inputClass} type="number" placeholder="sortOrder" value={itemForm.sortOrder} onChange={(e) => setItemForm({ ...itemForm, sortOrder: Number(e.target.value) })} />
              <label className="flex items-center gap-2 text-[var(--brand-gray)] font-sans text-sm">
                <input type="checkbox" checked={itemForm.active} onChange={(e) => setItemForm({ ...itemForm, active: e.target.checked })} />
                Active
              </label>
              <textarea className={`${inputClass} md:col-span-2`} placeholder="description" value={itemForm.description} onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })} />
              <button className={actionClass} onClick={saveItem}><Save size={16} /> {editingItemId ? "UPDATE" : "ADD"} ITEM</button>
            </div>

            <AdminTable
              rows={currentSection.items ?? []}
              columns={["itemKey", "title", "sortOrder", "active"]}
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
                      sortOrder: row.sortOrder ?? 0,
                      active: row.active ?? true,
                    });
                  }}>EDIT</button>
                  <button className={compactActionClass} onClick={async () => { await apiDelete(`/admin/cms/items/${row.id}`); await reload(); }}><Trash2 size={12} /></button>
                </>
              )}
            />
          </>
        )}
      </div>
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
        <div className={`${panelClass} overflow-x-auto`}>
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
        <input key={key} className={inputClass} placeholder={key} value={form[key] ?? ""} disabled={disabledId === key} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
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
  return (
    <div className={`${panelClass} overflow-x-auto`}>
      <table className="w-full table-fixed">
        <thead>
          <tr className="border-b border-[#222]">
            {columns.map((column) => (
              <th key={column} className="text-left text-[var(--brand-gray)] font-bebas tracking-widest px-3 py-3 text-xs md:text-sm">
                {column.toUpperCase()}
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
                  {formatCell?.(row, column, row[column]) ??
                    (Array.isArray(row[column]) ? row[column].join(", ") : column.toLowerCase().includes("cents") ? money(row[column] ?? 0) : String(row[column] ?? ""))}
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
  );
}

export default function AdminPage() {
  const { section: sectionParam, orderId } = useParams<{ section?: string; orderId?: string }>();
  const { user, isLoggedIn } = useAuth();
  const section = useMemo<AdminSection>(() => {
    if (orderId) return "orders";
    return sections.some((item) => item.id === sectionParam) ? (sectionParam as AdminSection) : "dashboard";
  }, [sectionParam, orderId]);

  if (!isLoggedIn) return <Navigate to="/auth" replace state={{ from: "/admin", tab: "login" }} />;
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
