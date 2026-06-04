import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import {
  BarChart3,
  CalendarCheck,
  ContactRound,
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
  | "products"
  | "artists"
  | "orders"
  | "users"
  | "bookings"
  | "event-contacts";

const sections: { id: AdminSection; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3 },
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

function AdminTable({ rows, columns, actions }: { rows: any[]; columns: string[]; actions?: (row: any) => React.ReactNode }) {
  return (
    <div className={`${panelClass} overflow-x-auto`}>
      <table className="w-full min-w-[720px]">
        <thead>
          <tr className="border-b border-[#222]">
            {columns.map((column) => <th key={column} className="text-left text-[var(--brand-gray)] font-bebas tracking-widest px-4 py-3">{column.toUpperCase()}</th>)}
            {actions && <th className="text-left text-[var(--brand-gray)] font-bebas tracking-widest px-4 py-3">ACTIONS</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id ?? row.slug} className="border-b border-[#222]">
              {columns.map((column) => (
                <td key={column} className="px-4 py-3 text-white font-sans text-sm max-w-[240px] truncate">
                  {Array.isArray(row[column]) ? row[column].join(", ") : column.toLowerCase().includes("cents") ? money(row[column] ?? 0) : String(row[column] ?? "")}
                </td>
              ))}
              {actions && <td className="px-4 py-3"><div className="flex gap-2 items-center">{actions(row)}</div></td>}
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
    products: <ProductsPanel />,
    artists: <ArtistsPanel />,
    orders: <OrdersPanel orderId={orderId} />,
    users: <UsersPanel />,
    bookings: <BookingsPanel />,
    "event-contacts": <EventContactsPanel />,
  }[section];

  return <AdminShell section={section}>{content}</AdminShell>;
}
