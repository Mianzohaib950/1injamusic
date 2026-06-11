import { useState } from "react";
import { toast } from "sonner";
import { apiPost } from "@/lib/api";

interface BookingFormProps {
  endpoint?: string;
  successMessage?: string;
  artists?: string[];
}

export default function BookingForm({
  endpoint = "/bookings",
  successMessage = "Message sent! We will be in touch within 48 hours.",
  artists = ["Hintell", "Dark Koko", "Swazz", "Mee$ch"],
}: BookingFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    artist: "All Artists",
    eventType: "Club Night",
    eventDate: "",
    message: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name) newErrors.name = "Name is required";
    if (!formData.email) newErrors.email = "Email is required";
    if (!formData.phone) newErrors.phone = "Phone is required";
    if (!formData.eventDate) newErrors.eventDate = "Date is required";
    if (!formData.message) newErrors.message = "Message is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      setSubmitting(true);
      try {
        const result = await apiPost<{ emailSent?: boolean; warning?: string }>(endpoint, formData);
        toast.success(successMessage, {
          style: { background: "var(--brand-green)", color: "black", border: "none" }
        });
        if (result?.emailSent === false) {
          toast.warning(result.warning || "Request saved, but email was not sent. Check mail settings.");
        }
        setFormData({
          name: "", email: "", phone: "", artist: "All Artists", eventType: "Club Night", eventDate: "", message: ""
        });
      } catch (error: any) {
        toast.error(error?.message ?? "Unable to send booking request.");
      } finally {
        setSubmitting(false);
      }
    }
  };

  const inputClass = "w-full bg-[var(--brand-card)] border border-[var(--brand-border)] text-white font-sans p-3 rounded-md focus:outline-none focus:border-[var(--brand-yellow)] transition-colors";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <input 
            type="text" 
            placeholder="Name *" 
            className={inputClass}
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})}
          />
          {errors.name && <p className="text-[var(--brand-yellow)] text-sm mt-1">{errors.name}</p>}
        </div>
        <div>
          <input 
            type="email" 
            placeholder="Email *" 
            className={inputClass}
            value={formData.email}
            onChange={e => setFormData({...formData, email: e.target.value})}
          />
          {errors.email && <p className="text-[var(--brand-yellow)] text-sm mt-1">{errors.email}</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <input 
            type="text" 
            placeholder="Phone *" 
            className={inputClass}
            value={formData.phone}
            onChange={e => setFormData({...formData, phone: e.target.value})}
          />
          {errors.phone && <p className="text-[var(--brand-yellow)] text-sm mt-1">{errors.phone}</p>}
        </div>
        <div>
          <select 
            className={inputClass}
            value={formData.artist}
            onChange={e => setFormData({...formData, artist: e.target.value})}
          >
            <option>All Artists</option>
            {artists.map((artist) => (
              <option key={artist}>{artist}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <select 
            className={inputClass}
            value={formData.eventType}
            onChange={e => setFormData({...formData, eventType: e.target.value})}
          >
            <option>Festival</option>
            <option>Club Night</option>
            <option>Private Event</option>
            <option>Tour</option>
            <option>Other</option>
          </select>
        </div>
        <div>
          <input 
            type="date" 
            className={inputClass}
            value={formData.eventDate}
            onChange={e => setFormData({...formData, eventDate: e.target.value})}
          />
          {errors.eventDate && <p className="text-[var(--brand-yellow)] text-sm mt-1">{errors.eventDate}</p>}
        </div>
      </div>
      <div>
        <textarea 
          placeholder="Event Details & Message *" 
          rows={4}
          className={inputClass}
          value={formData.message}
          onChange={e => setFormData({...formData, message: e.target.value})}
        />
        {errors.message && <p className="text-[var(--brand-yellow)] text-sm mt-1">{errors.message}</p>}
      </div>
      <button 
        type="submit" 
        disabled={submitting}
        className="self-start px-8 py-3 bg-[var(--brand-yellow)] text-black font-bebas text-xl rounded-full hover:bg-white transition-colors uppercase tracking-widest mt-2 disabled:opacity-50"
      >
        {submitting ? "Sending..." : "Send Now"}
      </button>
    </form>
  );
}
