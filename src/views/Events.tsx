import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Globe, Mail, FileMusic, ArrowRight } from "lucide-react";
import gsap from "gsap";
import BookingForm from "@/components/BookingForm";
import { ALL_EVENTS } from "@/data/events";

const splitText = (text: string) => {
  return text.split("").map((char, index) => (
    <span key={index} className="inline-block opacity-0 translate-y-[60px]">
      {char === " " ? "\u00A0" : char}
    </span>
  ));
};

const TAGS = ["ALL", "festival", "livestream", "djset", "studio", "event"];

export default function Events() {
  const heroRef = useRef<HTMLHeadingElement>(null);
  const [activeTag, setActiveTag] = useState("ALL");

  useEffect(() => {
    const chars = heroRef.current?.querySelectorAll("span");
    if (chars) {
      gsap.to(chars, {
        y: 0,
        opacity: 1,
        stagger: 0.03,
        ease: "power4.out",
        duration: 1,
        delay: 0.2
      });
    }
  }, []);

  const filteredEvents = activeTag === "ALL" 
    ? ALL_EVENTS 
    : ALL_EVENTS.filter(e => e.tag === activeTag);

  return (
    <main className="w-full bg-[var(--brand-black)] min-h-screen">
      
      {/* HERO */}
      <section className="relative h-[60vh] w-full flex items-center justify-center border-b border-[var(--brand-border)]">
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center brightness-50 opacity-50"
          style={{ backgroundImage: `url('/events-banner.jpg')` }}
        />
        
        <div className="relative z-10 text-center px-6 mt-16">
          <h1 ref={heroRef} className="text-white text-6xl md:text-8xl lg:text-[10rem] font-bebas leading-none drop-shadow-2xl">
            {splitText("EVENTS & CONTACT")}
          </h1>
        </div>
      </section>

      {/* CONTACT CATEGORIES */}
      <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto border-b border-[var(--brand-border)]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          
          <div className="flex flex-col items-center text-center p-8 bg-[var(--brand-card)] border border-[var(--brand-border)] hover:border-[var(--brand-yellow)] transition-colors group">
            <Globe className="w-16 h-16 text-[var(--brand-yellow)] mb-6 group-hover:scale-110 transition-transform" />
            <h3 className="text-white font-bebas text-3xl mb-2">Booking World Wide</h3>
            <a href="mailto:booking@1jamaicamusic.com" className="text-[var(--brand-yellow)] font-sans mb-4 hover:underline">booking@1jamaicamusic.com</a>
            <p className="text-[var(--brand-gray)] font-sans">Book our artists for festivals, clubs, and international tours</p>
          </div>

          <div className="flex flex-col items-center text-center p-8 bg-[var(--brand-card)] border border-[var(--brand-border)] hover:border-[var(--brand-yellow)] transition-colors group">
            <Mail className="w-16 h-16 text-[var(--brand-yellow)] mb-6 group-hover:scale-110 transition-transform" />
            <h3 className="text-white font-bebas text-3xl mb-2">Demo Publishing</h3>
            <a href="mailto:demos@1jamaicamusic.com" className="text-[var(--brand-yellow)] font-sans mb-4 hover:underline">demos@1jamaicamusic.com</a>
            <p className="text-[var(--brand-gray)] font-sans">Submit your music for consideration. Thanks and best of luck!</p>
          </div>

          <div className="flex flex-col items-center text-center p-8 bg-[var(--brand-card)] border border-[var(--brand-border)] hover:border-[var(--brand-yellow)] transition-colors group">
            <FileMusic className="w-16 h-16 text-[var(--brand-yellow)] mb-6 group-hover:scale-110 transition-transform" />
            <h3 className="text-white font-bebas text-3xl mb-2">Music Licencing</h3>
            <a href="mailto:licensing@1jamaicamusic.com" className="text-[var(--brand-yellow)] font-sans mb-4 hover:underline">licensing@1jamaicamusic.com</a>
            <p className="text-[var(--brand-gray)] font-sans">License our catalog for film, TV, advertising, and sync deals</p>
          </div>

        </div>
      </section>

      {/* EVENT LIST */}
      <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
          <span className="inline-block text-[var(--brand-yellow)] font-bebas text-2xl tracking-widest">UPCOMING & PAST EVENTS</span>
          
          <div className="flex flex-wrap justify-center gap-2">
            {TAGS.map(tag => (
              <button
                key={tag}
                onClick={() => setActiveTag(tag)}
                className={`font-bebas px-4 py-1 text-lg tracking-widest rounded-full border-2 transition-colors ${
                  activeTag === tag 
                    ? "bg-[var(--brand-yellow)] text-black border-[var(--brand-yellow)]" 
                    : "text-white border-[var(--brand-border)] hover:border-[var(--brand-yellow)]"
                }`}
              >
                {tag === "ALL" ? "ALL" : `#${tag}`}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <Link
              key={event.id}
              to={`/events/${event.slug}`}
              className="bg-[var(--brand-card)] border border-[var(--brand-border)] overflow-hidden group hover:border-[var(--brand-yellow)] transition-colors"
            >
              <div className="aspect-video relative overflow-hidden">
                <img
                  src={event.image}
                  alt={event.name}
                  className="w-full h-full object-cover brightness-50 group-hover:brightness-75 group-hover:scale-105 transition-all duration-500"
                />
                <div className="absolute top-4 right-4 bg-[var(--brand-yellow)] text-black font-bebas px-3 py-1 text-sm tracking-widest rounded-full">
                  #{event.tag}
                </div>
              </div>
              <div className="p-6">
                <span className="text-[var(--brand-gray)] font-sans text-sm mb-2 block">{event.date}</span>
                <h4 className="text-white font-sans font-bold text-xl leading-tight group-hover:text-[var(--brand-yellow)] transition-colors mb-3">
                  {event.name}
                </h4>
                <span className="inline-flex items-center gap-1 text-[var(--brand-yellow)] font-bebas text-sm tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                  VIEW EVENT <ArrowRight size={13} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* BOOKING FORM SECTION */}
      <section className="bg-[var(--brand-dark)] py-24 px-6 md:px-12 border-t border-[var(--brand-border)]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-white text-5xl font-bebas mb-4">DIRECT INQUIRY</h2>
            <p className="text-[var(--brand-gray)] font-sans text-lg">Use the form below for fast response direct to our management team.</p>
          </div>
          <div className="bg-[var(--brand-card)] p-8 md:p-12 border border-[var(--brand-border)] rounded-xl">
            <BookingForm endpoint="/event-contacts" successMessage="Event contact request sent. Our team will contact you shortly." />
          </div>
        </div>
      </section>

    </main>
  );
}
