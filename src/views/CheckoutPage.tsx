import { useState, useEffect, type Dispatch, type SetStateAction } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, CreditCard, Lock, Truck, ShoppingBag } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { apiPost } from "@/lib/api";

type Step = 1 | 2 | 3;

interface ShippingForm {
  firstName: string;
  lastName: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

function CheckoutForm({
  cartItems,
  totalPrice,
  shipping,
  setShipping,
  clearCart,
  onOrderComplete,
}: {
  cartItems: any[];
  totalPrice: number;
  shipping: ShippingForm;
  setShipping: Dispatch<SetStateAction<ShippingForm>>;
  clearCart: () => void;
  onOrderComplete: (orderId: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [cardName, setCardName] = useState("");
  const [processing, setProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  const SHIPPING_COST = 12;
  const TAX_RATE = 0.08;
  const subtotal = totalPrice;
  const tax = subtotal * TAX_RATE;
  const total = subtotal + SHIPPING_COST + tax;

  const canPay = !!cardName && !!shipping.firstName && !!shipping.lastName && !!shipping.email && !!shipping.address && !!shipping.city && !!shipping.zip && !!shipping.country;

  const handleSubmit = async () => {
    setPaymentError("");
    if (!stripe || !elements) {
      setPaymentError("Stripe is still loading. Please try again in a moment.");
      return;
    }
    if (!canPay) {
      setPaymentError("Complete shipping details and cardholder name to continue.");
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setPaymentError("Card input is unavailable.");
      return;
    }

    setProcessing(true);
    try {
      const { clientSecret, orderId } = await apiPost<{ clientSecret: string; orderId: string }>("/payment/create-payment-intent", {
        items: cartItems.map((item) => ({ productId: item.productId, size: item.size, quantity: item.quantity })),
        shippingAddress: shipping,
      });

      const confirmResult = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: cardName,
            email: shipping.email,
          },
        },
      });

      if (confirmResult.error) {
        setPaymentError(confirmResult.error.message ?? "Payment failed. Please try another card.");
        setProcessing(false);
        return;
      }

      if (confirmResult.paymentIntent?.status !== "succeeded") {
        setPaymentError("Payment did not complete. Please try again.");
        setProcessing(false);
        return;
      }

      await apiPost("/payment/confirm", {
        paymentIntentId: confirmResult.paymentIntent.id,
        orderId,
      });

      clearCart();
      onOrderComplete(orderId);
    } catch (error: any) {
      setPaymentError(error?.message ?? "Payment could not be completed.");
      setProcessing(false);
    }
  };

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 mb-6">
        <div>
          <label className="block text-[var(--brand-gray)] font-bebas tracking-widest text-sm mb-1">NAME ON CARD *</label>
          <input
            type="text"
            value={cardName}
            onChange={(e) => setCardName(e.target.value)}
            placeholder="Cardholder name"
            className="w-full bg-[#161616] border border-[#333] text-white font-sans px-4 py-3 focus:border-[var(--brand-yellow)] focus:outline-none transition-colors"
          />
        </div>
        <div className="bg-[#111] border border-[#333] rounded p-4">
          <label className="block text-[var(--brand-gray)] font-bebas tracking-widest text-sm mb-3">CARD DETAILS *</label>
          <div className="bg-[#161616] border border-[#222] rounded p-3">
            <CardElement options={{
              style: {
                base: {
                  color: "#ffffff",
                  fontSize: "16px",
                  fontFamily: "inherit",
                  "::placeholder": { color: "#888" },
                },
                invalid: { color: "#ff6b6b" },
              },
            }} />
          </div>
        </div>
      </div>

      {paymentError && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/40 text-red-300 text-sm rounded">
          {paymentError}
        </div>
      )}

      <button
        disabled={!stripe || processing || !canPay}
        onClick={handleSubmit}
        className="w-full bg-[var(--brand-yellow)] text-black font-bebas text-2xl tracking-widest py-4 hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {processing ? "PROCESSING PAYMENT…" : `PLACE ORDER — $${total.toFixed(2)}`}
      </button>
    </div>
  );
}

function DemoCheckoutForm({
  cartItems,
  totalPrice,
  shipping,
  clearCart,
  onOrderComplete,
}: {
  cartItems: any[];
  totalPrice: number;
  shipping: ShippingForm;
  clearCart: () => void;
  onOrderComplete: (orderId: string) => void;
}) {
  const [processing, setProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  const SHIPPING_COST = 12;
  const TAX_RATE = 0.08;
  const total = totalPrice + SHIPPING_COST + totalPrice * TAX_RATE;
  const canPay = !!shipping.firstName && !!shipping.lastName && !!shipping.email && !!shipping.address && !!shipping.city && !!shipping.zip && !!shipping.country;

  const handleDemoPayment = async () => {
    setPaymentError("");
    if (!canPay) {
      setPaymentError("Complete shipping details to continue.");
      return;
    }

    setProcessing(true);
    try {
      const { orderId } = await apiPost<{ clientSecret: string | null; orderId: string; demo?: boolean }>("/payment/create-payment-intent", {
        items: cartItems.map((item) => ({ productId: item.productId, size: item.size, quantity: item.quantity })),
        shippingAddress: shipping,
      });

      await apiPost("/payment/confirm", {
        orderId,
        demoPayment: true,
      });

      clearCart();
      onOrderComplete(orderId);
    } catch (error: any) {
      setPaymentError(error?.message ?? "Demo payment could not be completed.");
      setProcessing(false);
    }
  };

  return (
    <div className="p-6 bg-[#161616] border border-[#222] text-[var(--brand-gray)] rounded">
      <p className="font-bebas text-lg text-white mb-3">DEMO PAYMENT MODE</p>
      <p className="text-sm mb-5">
        Stripe keys are not configured, so this will create a test order without charging a card.
      </p>

      {paymentError && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/40 text-red-300 text-sm rounded">
          {paymentError}
        </div>
      )}

      <button
        disabled={processing || !canPay}
        onClick={handleDemoPayment}
        className="w-full bg-[var(--brand-yellow)] text-black font-bebas text-2xl tracking-widest py-4 hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {processing ? "CREATING ORDER..." : `PLACE DEMO ORDER - $${total.toFixed(2)}`}
      </button>
    </div>
  );
}

const SHIPPING_COST = 12;
const TAX_RATE = 0.08;

export default function CheckoutPage() {
  const { cartItems, totalPrice, clearCart } = useCart();
  const { isLoggedIn, user, savedAddresses, refreshOrders } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);

  const defaultAddr = savedAddresses.find((a) => a.isDefault) ?? savedAddresses[0];

  const [shipping, setShipping] = useState<ShippingForm>({
    firstName: defaultAddr?.firstName ?? "",
    lastName: defaultAddr?.lastName ?? "",
    email: user?.email ?? "",
    address: defaultAddr?.address ?? "",
    city: defaultAddr?.city ?? "",
    state: defaultAddr?.state ?? "",
    zip: defaultAddr?.zip ?? "",
    country: defaultAddr?.country ?? "Jamaica",
  });

  useEffect(() => {
    if (isLoggedIn) {
      const addr = savedAddresses.find((a) => a.isDefault) ?? savedAddresses[0];
      if (addr) {
        setShipping((prev) => ({
          ...prev,
          firstName: prev.firstName || addr.firstName,
          lastName: prev.lastName || addr.lastName,
          address: prev.address || addr.address,
          city: prev.city || addr.city,
          state: prev.state || addr.state,
          zip: prev.zip || addr.zip,
          country: prev.country || addr.country,
        }));
      }
      if (user?.email && !shipping.email) {
        setShipping((prev) => ({ ...prev, email: user.email }));
      }
    }
  }, [isLoggedIn, savedAddresses, user]);

  const tax = totalPrice * TAX_RATE;
  const total = totalPrice + SHIPPING_COST + tax;

  const canProceedStep2 =
    shipping.firstName && shipping.lastName && shipping.email &&
    shipping.address && shipping.city && shipping.zip && shipping.country;

  const completeOrder = async (createdOrderId: string) => {
    await refreshOrders();
    clearCart();
    navigate("/order-confirmation", { state: { orderId: createdOrderId } });
  };

  if (!isLoggedIn) {
    return (
      <main className="w-full min-h-screen bg-[var(--brand-black)] flex flex-col items-center justify-center px-6 text-center">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[140px] pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(232,255,0,0.10) 0%, transparent 70%)" }} />
        <div className="relative z-10 max-w-md w-full">
          <Lock size={44} className="text-[var(--brand-yellow)] mx-auto mb-6" />
          <p className="text-[var(--brand-yellow)] font-bebas tracking-widest text-lg mb-2">MEMBERS ONLY</p>
          <h2 className="text-white font-bebas text-5xl md:text-6xl mb-4 leading-none">
            SIGN IN TO CHECKOUT
          </h2>
          <p className="text-[var(--brand-gray)] font-sans text-sm mb-10">
            You need an account to complete your purchase. It only takes a moment — your cart will be waiting.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => navigate("/auth", { state: { from: "/checkout", tab: "login" } })}
              className="flex-1 bg-[var(--brand-yellow)] text-black font-bebas text-xl tracking-widest py-4 hover:bg-white transition-colors"
            >
              LOG IN
            </button>
            <button
              onClick={() => navigate("/auth", { state: { from: "/checkout", tab: "signup" } })}
              className="flex-1 border border-[var(--brand-yellow)] text-[var(--brand-yellow)] font-bebas text-xl tracking-widest py-4 hover:bg-[var(--brand-yellow)] hover:text-black transition-colors"
            >
              CREATE ACCOUNT
            </button>
          </div>
          <button
            onClick={() => navigate("/shop")}
            className="mt-6 text-[var(--brand-gray)] font-sans text-sm hover:text-white transition-colors underline underline-offset-4"
          >
            ← Back to Shop
          </button>
        </div>
      </main>
    );
  }

  if (cartItems.length === 0 && step === 1) {
    return (
      <main className="w-full min-h-screen bg-[var(--brand-black)] flex flex-col items-center justify-center pt-32 px-6">
        <ShoppingBag size={60} className="text-[#333] mb-6" />
        <h2 className="text-white font-bebas text-5xl mb-4">YOUR CART IS EMPTY</h2>
        <button
          onClick={() => navigate("/shop")}
          className="px-8 py-3 bg-[var(--brand-yellow)] text-black font-bebas text-xl tracking-widest hover:bg-white transition-colors"
        >
          GO TO SHOP
        </button>
      </main>
    );
  }

  const steps = [
    { num: 1, label: "Review", icon: ShoppingBag },
    { num: 2, label: "Shipping", icon: Truck },
    { num: 3, label: "Payment", icon: CreditCard },
  ];

  return (
    <main className="w-full min-h-screen bg-[var(--brand-black)] pt-28 pb-24 px-6 md:px-12">
      <div className="max-w-6xl mx-auto">
        {/* Heading */}
        <h1 className="text-white font-bebas text-6xl md:text-8xl mb-12">CHECKOUT</h1>

        {/* Step Indicator */}
        <div className="flex items-center gap-0 mb-12">
          {steps.map((s, idx) => (
            <div key={s.num} className="flex items-center">
              <button
                onClick={() => { if (s.num < step) setStep(s.num as Step); }}
                className={`flex items-center gap-2 px-4 py-2 border font-bebas tracking-widest text-lg transition-all ${
                  step === s.num
                    ? "border-[var(--brand-yellow)] bg-[var(--brand-yellow)] text-black"
                    : s.num < step
                    ? "border-[#444] text-[var(--brand-gray)] hover:border-[var(--brand-yellow)] cursor-pointer"
                    : "border-[#222] text-[#444] cursor-default"
                }`}
              >
                <span>{s.num}</span>
                <span className="hidden sm:block">{s.label.toUpperCase()}</span>
              </button>
              {idx < steps.length - 1 && (
                <ChevronRight size={16} className="text-[#333] mx-1" />
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left — Steps */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {/* STEP 1 — Cart Review */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.25 }}
                >
                  <h2 className="text-white font-bebas text-3xl mb-6 tracking-widest">ORDER REVIEW</h2>
                  <div className="space-y-4 mb-8">
                    {cartItems.map((item) => (
                      <div key={item.cartKey} className="flex gap-4 p-4 bg-[#161616] border border-[#222]">
                        <img src={item.image} alt={item.name} className="w-20 h-20 object-cover border border-[#222]" />
                        <div className="flex-1">
                          <p className="text-[var(--brand-gray)] font-bebas text-xs tracking-widest">{item.artist.toUpperCase()}</p>
                          <p className="text-white font-sans font-semibold">{item.name}</p>
                          <p className="text-[var(--brand-gray)] font-sans text-sm">Size: {item.size} · Qty: {item.quantity}</p>
                        </div>
                        <span className="text-[var(--brand-yellow)] font-bebas text-xl self-center">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setStep(2)}
                    className="w-full bg-[var(--brand-yellow)] text-black font-bebas text-2xl tracking-widest py-4 hover:bg-white transition-colors"
                  >
                    CONTINUE TO SHIPPING
                  </button>
                </motion.div>
              )}

              {/* STEP 2 — Shipping */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.25 }}
                >
                  <h2 className="text-white font-bebas text-3xl mb-6 tracking-widest">SHIPPING DETAILS</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    {(["firstName", "lastName"] as const).map((field) => (
                      <div key={field}>
                        <label className="block text-[var(--brand-gray)] font-bebas tracking-widest text-sm mb-1">
                          {field === "firstName" ? "FIRST NAME" : "LAST NAME"} *
                        </label>
                        <input
                          type="text"
                          value={shipping[field]}
                          onChange={(e) => setShipping({ ...shipping, [field]: e.target.value })}
                          className="w-full bg-[#161616] border border-[#333] text-white font-sans px-4 py-3 focus:border-[var(--brand-yellow)] focus:outline-none transition-colors"
                        />
                      </div>
                    ))}
                    <div className="sm:col-span-2">
                      <label className="block text-[var(--brand-gray)] font-bebas tracking-widest text-sm mb-1">EMAIL *</label>
                      <input
                        type="email"
                        value={shipping.email}
                        onChange={(e) => setShipping({ ...shipping, email: e.target.value })}
                        className="w-full bg-[#161616] border border-[#333] text-white font-sans px-4 py-3 focus:border-[var(--brand-yellow)] focus:outline-none transition-colors"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[var(--brand-gray)] font-bebas tracking-widest text-sm mb-1">ADDRESS *</label>
                      <input
                        type="text"
                        value={shipping.address}
                        onChange={(e) => setShipping({ ...shipping, address: e.target.value })}
                        className="w-full bg-[#161616] border border-[#333] text-white font-sans px-4 py-3 focus:border-[var(--brand-yellow)] focus:outline-none transition-colors"
                      />
                    </div>
                    {(["city", "state", "zip"] as const).map((field) => (
                      <div key={field}>
                        <label className="block text-[var(--brand-gray)] font-bebas tracking-widest text-sm mb-1">
                          {field.toUpperCase()} *
                        </label>
                        <input
                          type="text"
                          value={shipping[field]}
                          onChange={(e) => setShipping({ ...shipping, [field]: e.target.value })}
                          className="w-full bg-[#161616] border border-[#333] text-white font-sans px-4 py-3 focus:border-[var(--brand-yellow)] focus:outline-none transition-colors"
                        />
                      </div>
                    ))}
                    <div>
                      <label className="block text-[var(--brand-gray)] font-bebas tracking-widest text-sm mb-1">COUNTRY *</label>
                      <select
                        value={shipping.country}
                        onChange={(e) => setShipping({ ...shipping, country: e.target.value })}
                        className="w-full bg-[#161616] border border-[#333] text-white font-sans px-4 py-3 focus:border-[var(--brand-yellow)] focus:outline-none transition-colors"
                      >
                        {["Jamaica", "United States", "United Kingdom", "Canada", "Trinidad & Tobago", "Barbados", "Other"].map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button
                    disabled={!canProceedStep2}
                    onClick={() => setStep(3)}
                    className="w-full bg-[var(--brand-yellow)] text-black font-bebas text-2xl tracking-widest py-4 hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    CONTINUE TO PAYMENT
                  </button>
                </motion.div>
              )}

              {/* STEP 3 — Payment */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="flex items-center gap-2 mb-6">
                    <h2 className="text-white font-bebas text-3xl tracking-widest">PAYMENT</h2>
                    <Lock size={16} className="text-[var(--brand-green)]" />
                    <span className="text-[var(--brand-green)] font-sans text-xs">Secure</span>
                  </div>
                  {stripePublishableKey ? (
                    <Elements stripe={stripePromise}>
                      <CheckoutForm
                        cartItems={cartItems}
                        totalPrice={totalPrice}
                        shipping={shipping}
                        setShipping={setShipping}
                        clearCart={clearCart}
                        onOrderComplete={completeOrder}
                      />
                    </Elements>
                  ) : (
                    <DemoCheckoutForm
                      cartItems={cartItems}
                      totalPrice={totalPrice}
                      shipping={shipping}
                      clearCart={clearCart}
                      onOrderComplete={completeOrder}
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right — Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-[#161616] border border-[#222] p-6 sticky top-28">
              <h3 className="text-white font-bebas text-2xl tracking-widest mb-5 border-b border-[#222] pb-4">
                ORDER SUMMARY
              </h3>
              <div className="space-y-3 mb-5">
                {cartItems.map((item) => (
                  <div key={item.cartKey} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative flex-shrink-0">
                        <img src={item.image} alt={item.name} className="w-12 h-12 object-cover border border-[#222]" />
                        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[var(--brand-yellow)] text-black font-bebas text-[10px] rounded-full flex items-center justify-center">
                          {item.quantity}
                        </span>
                      </div>
                      <p className="text-white font-sans text-sm truncate">{item.name}</p>
                    </div>
                    <span className="text-white font-bebas text-base flex-shrink-0">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t border-[#222] pt-4 space-y-2">
                <div className="flex justify-between text-[var(--brand-gray)] font-sans text-sm">
                  <span>Subtotal</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[var(--brand-gray)] font-sans text-sm">
                  <span>Shipping</span>
                  <span>${SHIPPING_COST.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[var(--brand-gray)] font-sans text-sm">
                  <span>Tax (8%)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-white font-bebas text-2xl pt-2 border-t border-[#222]">
                  <span>TOTAL</span>
                  <span className="text-[var(--brand-yellow)]">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
