import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Package, MapPin, Lock, LogOut, Plus, Trash2,
  CheckCircle, Edit3, Star, ChevronDown, ChevronUp, Eye, EyeOff
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { SavedAddress } from "@/context/AuthContext";

type Tab = "overview" | "orders" | "addresses" | "profile" | "password";

const STATUS_STYLE: Record<string, string> = {
  Processing: "text-[var(--brand-yellow)] bg-[var(--brand-yellow)]/10 border-[var(--brand-yellow)]/30",
  Shipped: "text-blue-400 bg-blue-400/10 border-blue-400/30",
  Delivered: "text-[var(--brand-green)] bg-[var(--brand-green)]/10 border-[var(--brand-green)]/30",
};

const COUNTRIES = ["Jamaica", "United States", "United Kingdom", "Canada", "Trinidad & Tobago", "Barbados", "Other"];

function Field({ label, value, onChange, type = "text", placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-[var(--brand-gray)] font-bebas tracking-widest text-sm mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-[#111] border border-[#333] text-white font-sans px-4 py-3 focus:border-[var(--brand-yellow)] focus:outline-none transition-colors"
      />
    </div>
  );
}

function AddressForm({
  initial, onSave, onCancel
}: {
  initial?: Partial<Omit<SavedAddress, "id">>;
  onSave: (addr: Omit<SavedAddress, "id">) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    label: initial?.label ?? "Home",
    firstName: initial?.firstName ?? "",
    lastName: initial?.lastName ?? "",
    address: initial?.address ?? "",
    city: initial?.city ?? "",
    state: initial?.state ?? "",
    zip: initial?.zip ?? "",
    country: initial?.country ?? "Jamaica",
    isDefault: initial?.isDefault ?? false,
  });

  const set = (k: keyof typeof form) => (v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="bg-[#0f0f0f] border border-[#222] p-5 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[var(--brand-gray)] font-bebas tracking-widest text-sm mb-1">LABEL</label>
          <select
            value={form.label}
            onChange={(e) => set("label")(e.target.value)}
            className="w-full bg-[#111] border border-[#333] text-white font-sans px-4 py-3 focus:border-[var(--brand-yellow)] focus:outline-none"
          >
            {["Home", "Work", "Other"].map((l) => <option key={l}>{l}</option>)}
          </select>
        </div>
        <div className="flex items-end pb-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => set("isDefault")(e.target.checked)}
              className="accent-[var(--brand-yellow)] w-4 h-4"
            />
            <span className="text-[var(--brand-gray)] font-sans text-sm">Set as default</span>
          </label>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="FIRST NAME *" value={form.firstName} onChange={(v) => set("firstName")(v)} />
        <Field label="LAST NAME *" value={form.lastName} onChange={(v) => set("lastName")(v)} />
      </div>
      <Field label="ADDRESS *" value={form.address} onChange={(v) => set("address")(v)} />
      <div className="grid grid-cols-3 gap-3">
        <Field label="CITY *" value={form.city} onChange={(v) => set("city")(v)} />
        <Field label="STATE" value={form.state} onChange={(v) => set("state")(v)} />
        <Field label="ZIP *" value={form.zip} onChange={(v) => set("zip")(v)} />
      </div>
      <div>
        <label className="block text-[var(--brand-gray)] font-bebas tracking-widest text-sm mb-1">COUNTRY *</label>
        <select
          value={form.country}
          onChange={(e) => set("country")(e.target.value)}
          className="w-full bg-[#111] border border-[#333] text-white font-sans px-4 py-3 focus:border-[var(--brand-yellow)] focus:outline-none"
        >
          {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>
      <div className="flex gap-3 pt-1">
        <button
          onClick={() => onSave(form)}
          disabled={!form.firstName || !form.lastName || !form.address || !form.city || !form.zip}
          className="flex-1 bg-[var(--brand-yellow)] text-black font-bebas text-lg tracking-widest py-3 hover:bg-white transition-colors disabled:opacity-40"
        >
          SAVE ADDRESS
        </button>
        <button
          onClick={onCancel}
          className="px-6 border border-[#333] text-[var(--brand-gray)] font-bebas tracking-widest hover:border-[var(--brand-yellow)] hover:text-[var(--brand-yellow)] transition-colors"
        >
          CANCEL
        </button>
      </div>
    </div>
  );
}

export default function AccountPage() {
  const { user, isAuthLoading, logout, updateProfile, changePassword, savedAddresses, addAddress, updateAddress, removeAddress, setDefaultAddress, orders } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("overview");

  // Profile
  const [profileName, setProfileName] = useState(user?.name ?? "");
  const [profilePhone, setProfilePhone] = useState(user?.phone ?? "");
  const [profileSaved, setProfileSaved] = useState(false);

  // Password
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [passError, setPassError] = useState("");
  const [passSaved, setPassSaved] = useState(false);

  // Addresses
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Orders
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthLoading && !user) navigate("/auth");
  }, [isAuthLoading, user, navigate]);

  if (isAuthLoading) {
    return (
      <main className="w-full min-h-screen bg-[var(--brand-black)] pt-28 pb-20 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <p className="text-[var(--brand-gray)] font-bebas text-3xl">LOADING ACCOUNT...</p>
        </div>
      </main>
    );
  }

  if (!user) return null;

  const handleLogout = () => { logout(); navigate("/"); };

  const handleProfileSave = async () => {
    if (!profileName.trim()) return;
    const err = await updateProfile({ name: profileName, phone: profilePhone });
    if (err) {
      return;
    }
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  };

  const handlePasswordChange = async () => {
    setPassError("");
    if (!oldPass || !newPass || !confirmPass) {
      setPassError("Fill in all fields.");
      return;
    }
    if (newPass !== confirmPass) {
      setPassError("New passwords don't match.");
      return;
    }
    if (newPass.length < 6) {
      setPassError("Password must be at least 6 characters.");
      return;
    }
    const err = await changePassword(oldPass, newPass);
    if (err) {
      setPassError(err);
      return;
    }
    setOldPass("");
    setNewPass("");
    setConfirmPass("");
    setPassSaved(true);
    setTimeout(() => setPassSaved(false), 2500);
  };

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "overview", label: "OVERVIEW", icon: User },
    { id: "orders", label: `ORDERS (${orders.length})`, icon: Package },
    { id: "addresses", label: "ADDRESSES", icon: MapPin },
    { id: "profile", label: "PROFILE", icon: Edit3 },
    { id: "password", label: "PASSWORD", icon: Lock },
  ];

  return (
    <main className="w-full min-h-screen bg-[var(--brand-black)] pt-28 pb-24 px-6 md:px-12">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <span className="text-[var(--brand-yellow)] font-bebas tracking-widest text-lg">MY ACCOUNT</span>
            <h1 className="text-white font-bebas text-5xl md:text-7xl leading-none">
              {user.name.toUpperCase()}
            </h1>
            <p className="text-[var(--brand-gray)] font-sans text-sm mt-1">{user.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 border border-[#333] text-[var(--brand-gray)] font-bebas tracking-widest px-5 py-2.5 hover:border-red-500 hover:text-red-400 transition-colors"
          >
            <LogOut size={16} /> LOG OUT
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <nav className="lg:col-span-1 flex flex-row lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex items-center gap-2 px-4 py-3 font-bebas tracking-widest text-base whitespace-nowrap transition-all border-b-2 lg:border-b-0 lg:border-l-2 ${
                  tab === id
                    ? "border-[var(--brand-yellow)] text-[var(--brand-yellow)] bg-[var(--brand-yellow)]/5"
                    : "border-transparent text-[var(--brand-gray)] hover:text-white"
                }`}
              >
                <Icon size={16} /> {label}
              </button>
            ))}
          </nav>

          {/* Content */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">

              {/* OVERVIEW */}
              {tab === "overview" && (
                <motion.div key="overview" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                  <h2 className="text-white font-bebas text-3xl mb-6">DASHBOARD</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    {[
                      { label: "TOTAL ORDERS", value: orders.length, action: () => setTab("orders") },
                      { label: "SAVED ADDRESSES", value: savedAddresses.length, action: () => setTab("addresses") },
                      { label: "MEMBER SINCE", value: new Date(user.createdAt).getFullYear(), action: () => setTab("profile") },
                    ].map((s) => (
                      <button key={s.label} onClick={s.action}
                        className="bg-[#161616] border border-[#222] hover:border-[var(--brand-yellow)] p-6 text-left transition-all group"
                      >
                        <p className="text-[var(--brand-gray)] font-bebas tracking-widest text-sm mb-1">{s.label}</p>
                        <p className="text-[var(--brand-yellow)] font-bebas text-4xl">{s.value}</p>
                      </button>
                    ))}
                  </div>

                  {/* Latest order */}
                  {orders.length > 0 && (
                    <div className="bg-[#161616] border border-[#222] p-5">
                      <p className="text-[var(--brand-yellow)] font-bebas tracking-widest mb-3">LATEST ORDER</p>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-bebas text-2xl">{orders[0].id}</p>
                          <p className="text-[var(--brand-gray)] font-sans text-sm">
                            {new Date(orders[0].createdAt).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-block font-bebas text-sm px-3 py-1 border tracking-widest ${STATUS_STYLE[orders[0].status]}`}>
                            {orders[0].status.toUpperCase()}
                          </span>
                          <p className="text-[var(--brand-yellow)] font-bebas text-2xl mt-1">${orders[0].total.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  {orders.length === 0 && (
                    <div className="bg-[#161616] border border-[#222] p-8 text-center">
                      <Package size={40} className="text-[#333] mx-auto mb-3" />
                      <p className="text-[var(--brand-gray)] font-bebas text-xl">No orders yet</p>
                      <button onClick={() => navigate("/shop")} className="mt-4 px-6 py-2 bg-[var(--brand-yellow)] text-black font-bebas tracking-widest hover:bg-white transition-colors">
                        SHOP NOW
                      </button>
                    </div>
                  )}
                </motion.div>
              )}

              {/* ORDERS */}
              {tab === "orders" && (
                <motion.div key="orders" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                  <h2 className="text-white font-bebas text-3xl mb-6">ORDER HISTORY</h2>
                  {orders.length === 0 ? (
                    <div className="bg-[#161616] border border-[#222] p-12 text-center">
                      <Package size={48} className="text-[#333] mx-auto mb-4" />
                      <p className="text-[var(--brand-gray)] font-bebas text-2xl mb-4">No orders yet</p>
                      <button onClick={() => navigate("/shop")} className="px-8 py-3 bg-[var(--brand-yellow)] text-black font-bebas text-xl tracking-widest hover:bg-white transition-colors">
                        START SHOPPING
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {orders.map((order) => (
                        <div key={order.id} className="bg-[#161616] border border-[#222] overflow-hidden">
                          <button
                            onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                            className="w-full flex items-center justify-between p-5 hover:bg-[#1a1a1a] transition-colors"
                          >
                            <div className="text-left">
                              <p className="text-white font-bebas text-xl">{order.id}</p>
                              <p className="text-[var(--brand-gray)] font-sans text-sm">
                                {new Date(order.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })} · {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                              </p>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className={`font-bebas text-sm px-3 py-1 border tracking-widest ${STATUS_STYLE[order.status]}`}>
                                {order.status.toUpperCase()}
                              </span>
                              <span className="text-[var(--brand-yellow)] font-bebas text-xl">${order.total.toFixed(2)}</span>
                              {expandedOrder === order.id ? <ChevronUp size={16} className="text-[#555]" /> : <ChevronDown size={16} className="text-[#555]" />}
                            </div>
                          </button>
                          {expandedOrder === order.id && (
                            <div className="border-t border-[#222] p-5 space-y-3">
                              {order.items.map((item, i) => (
                                <div key={i} className="flex items-center gap-4">
                                  <img src={item.image} alt={item.name} className="w-14 h-14 object-cover border border-[#222]" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[var(--brand-gray)] font-bebas text-xs tracking-widest">{item.artist.toUpperCase()}</p>
                                    <p className="text-white font-sans text-sm font-medium truncate">{item.name}</p>
                                    <p className="text-[var(--brand-gray)] font-sans text-xs">Size: {item.size} · Qty: {item.quantity}</p>
                                  </div>
                                  <span className="text-[var(--brand-yellow)] font-bebas text-lg">${(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                              ))}
                              <div className="border-t border-[#222] pt-3 space-y-1 text-sm font-sans">
                                <div className="flex justify-between text-[var(--brand-gray)]"><span>Subtotal</span><span>${order.subtotal.toFixed(2)}</span></div>
                                <div className="flex justify-between text-[var(--brand-gray)]"><span>Shipping</span><span>${order.shipping.toFixed(2)}</span></div>
                                <div className="flex justify-between text-[var(--brand-gray)]"><span>Tax</span><span>${order.tax.toFixed(2)}</span></div>
                                <div className="flex justify-between text-white font-bebas text-xl pt-1"><span>TOTAL</span><span className="text-[var(--brand-yellow)]">${order.total.toFixed(2)}</span></div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* ADDRESSES */}
              {tab === "addresses" && (
                <motion.div key="addresses" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-white font-bebas text-3xl">SAVED ADDRESSES</h2>
                    {!showAddForm && !editingId && (
                      <button
                        onClick={() => setShowAddForm(true)}
                        className="flex items-center gap-2 px-4 py-2 border border-[var(--brand-yellow)] text-[var(--brand-yellow)] font-bebas tracking-widest hover:bg-[var(--brand-yellow)] hover:text-black transition-colors"
                      >
                        <Plus size={16} /> ADD ADDRESS
                      </button>
                    )}
                  </div>
                  {showAddForm && (
                    <div className="mb-5">
                      <AddressForm
                        onSave={(a) => { addAddress(a); setShowAddForm(false); }}
                        onCancel={() => setShowAddForm(false)}
                      />
                    </div>
                  )}
                  {savedAddresses.length === 0 && !showAddForm ? (
                    <div className="bg-[#161616] border border-[#222] p-10 text-center">
                      <MapPin size={40} className="text-[#333] mx-auto mb-3" />
                      <p className="text-[var(--brand-gray)] font-bebas text-xl">No saved addresses yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {savedAddresses.map((addr) => (
                        <div key={addr.id}>
                          {editingId === addr.id ? (
                            <AddressForm
                              initial={addr}
                              onSave={(a) => { updateAddress(addr.id, a); setEditingId(null); }}
                              onCancel={() => setEditingId(null)}
                            />
                          ) : (
                            <div className={`bg-[#161616] border p-5 transition-all ${addr.isDefault ? "border-[var(--brand-yellow)]" : "border-[#222]"}`}>
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-white font-bebas tracking-widest">{addr.label.toUpperCase()}</span>
                                    {addr.isDefault && (
                                      <span className="bg-[var(--brand-yellow)] text-black font-bebas text-xs px-2 py-0.5 tracking-widest">DEFAULT</span>
                                    )}
                                  </div>
                                  <p className="text-white font-sans text-sm">{addr.firstName} {addr.lastName}</p>
                                  <p className="text-[var(--brand-gray)] font-sans text-sm">{addr.address}</p>
                                  <p className="text-[var(--brand-gray)] font-sans text-sm">{addr.city}, {addr.state} {addr.zip}</p>
                                  <p className="text-[var(--brand-gray)] font-sans text-sm">{addr.country}</p>
                                </div>
                                <div className="flex flex-col gap-2">
                                  <button onClick={() => setEditingId(addr.id)} className="text-[var(--brand-gray)] hover:text-[var(--brand-yellow)] transition-colors">
                                    <Edit3 size={16} />
                                  </button>
                                  <button onClick={() => removeAddress(addr.id)} className="text-[var(--brand-gray)] hover:text-red-400 transition-colors">
                                    <Trash2 size={16} />
                                  </button>
                                  {!addr.isDefault && (
                                    <button onClick={() => setDefaultAddress(addr.id)} className="text-[var(--brand-gray)] hover:text-[var(--brand-yellow)] transition-colors" title="Set as default">
                                      <Star size={16} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* PROFILE */}
              {tab === "profile" && (
                <motion.div key="profile" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                  <h2 className="text-white font-bebas text-3xl mb-6">EDIT PROFILE</h2>
                  <div className="bg-[#161616] border border-[#222] p-6 space-y-4 max-w-lg">
                    <Field label="FULL NAME *" value={profileName} onChange={setProfileName} />
                    <div>
                      <label className="block text-[var(--brand-gray)] font-bebas tracking-widest text-sm mb-1">EMAIL (cannot change)</label>
                      <input
                        disabled
                        value={user.email}
                        className="w-full bg-[#0a0a0a] border border-[#222] text-[#555] font-sans px-4 py-3 cursor-not-allowed"
                      />
                    </div>
                    <Field label="PHONE NUMBER" value={profilePhone} onChange={setProfilePhone} type="tel" placeholder="+1 000 000 0000" />

                    {profileSaved && (
                      <div className="flex items-center gap-2 text-[var(--brand-green)] font-sans text-sm">
                        <CheckCircle size={16} /> Profile updated successfully.
                      </div>
                    )}
                    <button
                      onClick={handleProfileSave}
                      disabled={!profileName.trim()}
                      className="w-full bg-[var(--brand-yellow)] text-black font-bebas text-xl tracking-widest py-3 hover:bg-white transition-colors disabled:opacity-40"
                    >
                      SAVE CHANGES
                    </button>
                  </div>
                </motion.div>
              )}

              {/* PASSWORD */}
              {tab === "password" && (
                <motion.div key="password" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                  <h2 className="text-white font-bebas text-3xl mb-6">CHANGE PASSWORD</h2>
                  <div className="bg-[#161616] border border-[#222] p-6 max-w-lg space-y-4">
                    {(["CURRENT PASSWORD", "NEW PASSWORD", "CONFIRM NEW PASSWORD"] as const).map((label, i) => {
                      const vals = [oldPass, newPass, confirmPass];
                      const setters = [setOldPass, setNewPass, setConfirmPass];
                      const shows = [showOld, showNew, showNew];
                      const toggles = [() => setShowOld(!showOld), () => setShowNew(!showNew), () => setShowNew(!showNew)];
                      return (
                        <div key={label}>
                          <label className="block text-[var(--brand-gray)] font-bebas tracking-widest text-sm mb-1">{label}</label>
                          <div className="relative">
                            <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#444]" />
                            <input
                              type={shows[i] ? "text" : "password"}
                              value={vals[i]}
                              onChange={(e) => setters[i](e.target.value)}
                              placeholder="••••••••"
                              className="w-full bg-[#111] border border-[#333] text-white font-sans pl-10 pr-10 py-3 focus:border-[var(--brand-yellow)] focus:outline-none transition-colors"
                            />
                            <button type="button" onClick={toggles[i]} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] hover:text-white transition-colors">
                              {shows[i] ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    {passError && (
                      <p className="text-red-400 font-sans text-sm">{passError}</p>
                    )}
                    {passSaved && (
                      <div className="flex items-center gap-2 text-[var(--brand-green)] font-sans text-sm">
                        <CheckCircle size={16} /> Password changed successfully.
                      </div>
                    )}
                    <button
                      onClick={handlePasswordChange}
                      className="w-full bg-[var(--brand-yellow)] text-black font-bebas text-xl tracking-widest py-3 hover:bg-white transition-colors"
                    >
                      UPDATE PASSWORD
                    </button>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      </div>
    </main>
  );
}
