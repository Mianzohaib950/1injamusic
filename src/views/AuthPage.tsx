import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, User, Mail, Phone, Lock, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

type Tab = "login" | "signup";

function getStoredRole() {
  try {
    const token = localStorage.getItem("1jm_token");
    return token ? JSON.parse(atob(token.split(".")[1] ?? "")).role : null;
  } catch {
    return null;
  }
}

function InputField({
  label, type = "text", value, onChange, icon: Icon, placeholder, right
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  icon: React.ElementType;
  placeholder?: string;
  right?: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[var(--brand-gray)] font-bebas tracking-widest text-sm mb-1">
        {label}
      </label>
      <div className="relative">
        <Icon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#444]" />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-[#161616] border border-[#333] text-white font-sans pl-10 pr-10 py-3 focus:border-[var(--brand-yellow)] focus:outline-none transition-colors placeholder:text-[#444]"
        />
        {right && <div className="absolute right-3 top-1/2 -translate-y-1/2">{right}</div>}
      </div>
    </div>
  );
}

export default function AuthPage() {
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { from?: string; tab?: Tab } | null;
  const from = state?.from ?? "/account";
  const [tab, setTab] = useState<Tab>(state?.tab ?? "login");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass, setLoginPass] = useState("");

  // Signup form
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupPass, setSignupPass] = useState("");
  const [signupConfirm, setSignupConfirm] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!loginEmail || !loginPass) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    const err = await login(loginEmail, loginPass);
    setLoading(false);
    if (err) {
      setError(err);
      return;
    }
    const role = getStoredRole();
    navigate(role === "admin" ? "/admin" : from, { replace: true });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!signupName || !signupEmail || !signupPass || !signupConfirm) {
      setError("Please fill in all required fields.");
      return;
    }
    if (signupPass !== signupConfirm) {
      setError("Passwords do not match.");
      return;
    }
    if (signupPass.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    const err = await signup(signupName, signupEmail, signupPhone, signupPass);
    setLoading(false);
    if (err) {
      setError(err);
      return;
    }
    navigate(from, { replace: true });
  };

  return (
    <main className="w-full min-h-screen bg-[var(--brand-black)] flex items-center justify-center pt-24 pb-16 px-6">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full blur-[160px] opacity-8 pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(232,255,0,0.12) 0%, transparent 70%)" }} />

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="text-[var(--brand-yellow)] font-bebas tracking-widest text-lg">1 JAMAICA MUSIC</span>
          <h1 className="text-white font-bebas text-6xl mt-1">
            {tab === "login" ? "WELCOME BACK" : "JOIN US"}
          </h1>
          <p className="text-[var(--brand-gray)] font-sans text-sm mt-2">
            {tab === "login"
              ? "Sign in to access your orders, addresses, and profile."
              : "Create an account for the full shopping experience."}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex mb-8 border border-[#222]">
          {(["login", "signup"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(""); }}
              className={`flex-1 font-bebas text-xl tracking-widest py-3 transition-all ${
                tab === t
                  ? "bg-[var(--brand-yellow)] text-black"
                  : "text-[var(--brand-gray)] hover:text-white"
              }`}
            >
              {t === "login" ? "LOG IN" : "SIGN UP"}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 p-3 border border-red-500/40 bg-red-500/10 text-red-400 font-sans text-sm">
            {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* LOGIN */}
          {tab === "login" && (
            <motion.form
              key="login"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleLogin}
              className="flex flex-col gap-4"
            >
              <InputField
                label="EMAIL *"
                type="email"
                value={loginEmail}
                onChange={setLoginEmail}
                icon={Mail}
                placeholder="you@example.com"
              />
              <InputField
                label="PASSWORD *"
                type={showPass ? "text" : "password"}
                value={loginPass}
                onChange={setLoginPass}
                icon={Lock}
                placeholder="••••••••"
                right={
                  <button type="button" onClick={() => setShowPass(!showPass)} className="text-[#555] hover:text-white transition-colors">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
              />
              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full bg-[var(--brand-yellow)] text-black font-bebas text-xl tracking-widest py-4 hover:bg-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? "SIGNING IN…" : <><ArrowRight size={18} /> SIGN IN</>}
              </button>
              <p className="text-center text-[var(--brand-gray)] font-sans text-sm">
                No account?{" "}
                <button type="button" onClick={() => setTab("signup")} className="text-[var(--brand-yellow)] hover:underline">
                  Create one free
                </button>
              </p>
            </motion.form>
          )}

          {/* SIGNUP */}
          {tab === "signup" && (
            <motion.form
              key="signup"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleSignup}
              className="flex flex-col gap-4"
            >
              <InputField label="FULL NAME *" value={signupName} onChange={setSignupName} icon={User} placeholder="Your name" />
              <InputField label="EMAIL *" type="email" value={signupEmail} onChange={setSignupEmail} icon={Mail} placeholder="you@example.com" />
              <InputField label="PHONE (optional)" value={signupPhone} onChange={setSignupPhone} icon={Phone} placeholder="+1 000 000 0000" />
              <InputField
                label="PASSWORD *"
                type={showPass ? "text" : "password"}
                value={signupPass}
                onChange={setSignupPass}
                icon={Lock}
                placeholder="Min. 6 characters"
                right={
                  <button type="button" onClick={() => setShowPass(!showPass)} className="text-[#555] hover:text-white transition-colors">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
              />
              <InputField
                label="CONFIRM PASSWORD *"
                type={showConfirm ? "text" : "password"}
                value={signupConfirm}
                onChange={setSignupConfirm}
                icon={Lock}
                placeholder="Repeat password"
                right={
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="text-[#555] hover:text-white transition-colors">
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
              />
              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full bg-[var(--brand-yellow)] text-black font-bebas text-xl tracking-widest py-4 hover:bg-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? "CREATING ACCOUNT…" : <><ArrowRight size={18} /> CREATE ACCOUNT</>}
              </button>
              <p className="text-center text-[var(--brand-gray)] font-sans text-sm">
                Already have an account?{" "}
                <button type="button" onClick={() => setTab("login")} className="text-[var(--brand-yellow)] hover:underline">
                  Sign in
                </button>
              </p>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
