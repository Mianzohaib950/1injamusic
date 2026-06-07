import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Globe, Mail, FileMusic, ArrowRight } from "lucide-react";
import gsap from "gsap";
import BookingForm from "@/components/BookingForm";
import { ALL_EVENTS } from "@/data/events";
import { apiGet } from "@/lib/api";

const splitText = (text: string) => {
  return text.split("").map((char, index) => (
    <span key={index} className="inline-block opacity-0 translate-y-[60px]">
      {char === " " ? "\u00A0" : char}
    </span>
  ));
};

const normalizeHeroTitle = (value: unknown) => {
  if (typeof value !== "string") return "EVENTS & CONTACT";
  const clean = value.trim().replace(/\s+/g, " ");
  return clean || "EVENTS & CONTACT";
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

type CmsEventCard = {
  id: string;
  slug: string;
  linkUrl: string;
  name: string;
  tag: string;
  date: string;
  image: string;
};

const slugFromEventLink = (value: string) => {
  const match = value.trim().match(/^\/events\/([^/?#]+)/i);
  return match ? match[1] : "";
};

export default function Events() {
  const heroRef = useRef<HTMLHeadingElement>(null);
  const [activeTag, setActiveTag] = useState("all");
  const [heroTitle, setHeroTitle] = useState("EVENTS & CONTACT");
  const [heroImage, setHeroImage] = useState("/events-banner.jpg");
  const [contentTitle, setContentTitle] = useState("UPCOMING & PAST EVENTS");
  const [contentImage, setContentImage] = useState("");
  const [cmsCards, setCmsCards] = useState<CmsEventCard[]>([]);

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

  useEffect(() => {
    let active = true;
    const loadCms = async () => {
      try {
        const data = await apiGet<any>("/cms/events");
        if (!active) return;
        const sections = Array.isArray(data?.sections) ? data.sections : [];
        const hero = sections.find((section: any) => section.sectionKey === "hero");
        const content = sections.find((section: any) => section.sectionKey === "content");
        setHeroTitle(normalizeHeroTitle(hero?.title));
        setHeroImage(String(hero?.imageUrl || "/events-banner.jpg"));
        setContentTitle(String(content?.title || "UPCOMING & PAST EVENTS"));
        setContentImage(String(content?.imageUrl || ""));

        const items = Array.isArray(content?.items) ? content.items : [];
        const nextCards: CmsEventCard[] = items
          .filter((item: any) => item && item.active !== false)
          .map((item: any) => {
            const tags = Array.isArray(item.tags) ? item.tags.map((tag: any) => String(tag).toLowerCase()).filter(Boolean) : [];
            const primaryTag = tags[0] ?? "event";
            const itemTitle = String(item.title ?? "").trim();
            const linkUrl = String(item.linkUrl ?? "").trim();
            const slugFromLink = slugFromEventLink(linkUrl);
            const itemSlug = String(item.itemKey ?? "").trim() || slugFromLink || slugify(itemTitle || "event");
            return {
              id: String(item.id ?? itemSlug),
              slug: itemSlug,
              linkUrl,
              name: itemTitle || "UNTITLED EVENT",
              tag: primaryTag,
              date: String(item.subtitle ?? "").trim() || "TBA",
              image: String(item.imageUrl ?? "").trim() || "/events-banner.jpg",
            };
          });
        setCmsCards(nextCards);
      } catch {
        // Keep static fallback content.
      }
    };
    loadCms();
    return () => {
      active = false;
    };
  }, []);

  const listEvents = useMemo(() => {
    const defaults = ALL_EVENTS.map((event) => ({
      id: String(event.id),
      slug: event.slug,
      linkUrl: `/events/${event.slug}`,
      name: event.name,
      tag: event.tag,
      date: event.date,
      image: event.image,
    }));
    if (cmsCards.length === 0) return defaults;

    const mergedBySlug = new Map(defaults.map((event) => [event.slug, event]));
    const appended: typeof defaults = [];

    for (const cmsCard of cmsCards) {
      if (mergedBySlug.has(cmsCard.slug)) {
        const base = mergedBySlug.get(cmsCard.slug)!;
        mergedBySlug.set(cmsCard.slug, {
          ...base,
          ...cmsCard,
          linkUrl: cmsCard.linkUrl || base.linkUrl,
        });
      } else {
        appended.push(cmsCard);
      }
    }

    return [...Array.from(mergedBySlug.values()), ...appended];
  }, [cmsCards]);

  const tags = useMemo(() => {
    const dynamicTags = Array.from(new Set(listEvents.map((event) => event.tag.toLowerCase())));
    return ["ALL", ...dynamicTags];
  }, [listEvents]);

  const knownDetailSlugs = useMemo(() => new Set(ALL_EVENTS.map((event) => event.slug)), []);

  const filteredEvents = activeTag === "all"
    ? listEvents
    : listEvents.filter((event) => event.tag.toLowerCase() === activeTag);

  return (
    <main className="w-full bg-[var(--brand-black)] min-h-screen">
      
      {/* HERO */}
      <section className="relative min-h-[58vh] md:min-h-[62vh] w-full flex items-center justify-center border-b border-[var(--brand-border)] pt-24 md:pt-28 pb-10">
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center brightness-50 opacity-50"
          style={{ backgroundImage: `url('${heroImage}')` }}
        />
        
        <div className="relative z-10 text-center px-6 md:px-10 max-w-7xl mx-auto">
          <h1
            ref={heroRef}
            className="text-white font-bebas leading-[0.92] drop-shadow-2xl text-[clamp(3rem,10vw,8.5rem)] break-words"
          >
            {splitText(heroTitle.toUpperCase())}
          </h1>
        </div>
      </section>

      {/* CONTACT CATEGORIES */}
      <section className="relative py-24 px-6 md:px-12 max-w-7xl mx-auto border-b border-[var(--brand-border)] overflow-hidden">
        {contentImage && (
          <div
            className="absolute inset-0 z-0 bg-cover bg-center opacity-15 brightness-50"
            style={{ backgroundImage: `url('${contentImage}')` }}
          />
        )}
        <div className="absolute inset-0 z-0 bg-black/55" />
        <div className="relative z-10">
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
        </div>
      </section>

      {/* EVENT LIST */}
      <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
          <span className="inline-block text-[var(--brand-yellow)] font-bebas text-2xl tracking-widest">{contentTitle}</span>
          
          <div className="flex flex-wrap justify-center gap-2">
            {tags.map(tag => (
              <button
                key={tag}
                onClick={() => setActiveTag(tag.toLowerCase())}
                className={`font-bebas px-4 py-1 text-lg tracking-widest rounded-full border-2 transition-colors ${
                  activeTag === tag.toLowerCase()
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
              to={
                event.linkUrl ||
                (knownDetailSlugs.has(event.slug) ? `/events/${event.slug}` : "#")
              }
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
