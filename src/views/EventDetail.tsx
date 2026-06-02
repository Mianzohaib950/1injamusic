import { useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, MapPin, Users, Tag, ArrowRight } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ALL_EVENTS } from "@/data/events";

gsap.registerPlugin(ScrollTrigger);

export default function EventDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const event = ALL_EVENTS.find((e) => e.slug === slug);
  const related = ALL_EVENTS.filter((e) => e.slug !== slug && e.tag === event?.tag).slice(0, 3);
  const otherRelated = related.length < 3
    ? [...related, ...ALL_EVENTS.filter((e) => e.slug !== slug && e.tag !== event?.tag).slice(0, 3 - related.length)]
    : related;

  useEffect(() => {
    window.scrollTo(0, 0);

    if (!event) return;

    const ctx = gsap.context(() => {
      // Hero parallax
      gsap.to(heroRef.current, {
        yPercent: 25,
        ease: "none",
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });

      // Title chars animate in
      const chars = titleRef.current?.querySelectorAll("span");
      if (chars) {
        gsap.to(chars, {
          y: 0,
          opacity: 1,
          stagger: 0.025,
          ease: "power4.out",
          duration: 0.9,
          delay: 0.2,
        });
      }

      // Content reveal
      gsap.fromTo(
        contentRef.current,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power3.out",
          delay: 0.5,
        }
      );
    });

    return () => ctx.revert();
  }, [slug, event]);

  if (!event) {
    return (
      <main className="w-full min-h-screen bg-[var(--brand-black)] flex flex-col items-center justify-center px-6 text-center pt-32">
        <p className="text-[var(--brand-yellow)] font-bebas text-2xl tracking-widest mb-4">EVENT NOT FOUND</p>
        <h1 className="text-white font-bebas text-6xl mb-8">404</h1>
        <button
          onClick={() => navigate("/events")}
          className="px-8 py-3 border border-[var(--brand-yellow)] text-[var(--brand-yellow)] font-bebas text-xl tracking-widest hover:bg-[var(--brand-yellow)] hover:text-black transition-colors"
        >
          BACK TO EVENTS
        </button>
      </main>
    );
  }

  const splitTitle = (text: string) =>
    text.split("").map((char, i) => (
      <span key={i} className="inline-block opacity-0 translate-y-[50px]">
        {char === " " ? "\u00A0" : char}
      </span>
    ));

  return (
    <motion.main
      className="w-full bg-[var(--brand-black)] min-h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* HERO */}
      <section className="relative h-[75vh] w-full overflow-hidden">
        <div
          ref={heroRef}
          className="absolute inset-0 scale-110 bg-cover bg-center"
          style={{
            backgroundImage: `url('${event.image}')`,
            filter: "brightness(0.35)",
          }}
        />
        {/* Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--brand-black)] via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--brand-black)]/60 to-transparent" />

        {/* Back button */}
        <div className="absolute top-28 left-6 md:left-12 z-20">
          <button
            onClick={() => navigate("/events")}
            className="flex items-center gap-2 text-[var(--brand-gray)] hover:text-[var(--brand-yellow)] font-bebas tracking-widest text-lg transition-colors group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            ALL EVENTS
          </button>
        </div>

        {/* Tag badge */}
        <div className="absolute top-28 right-6 md:right-12 z-20">
          <span className="bg-[var(--brand-yellow)] text-black font-bebas px-4 py-1.5 text-sm tracking-widest rounded-full">
            #{event.tag}
          </span>
        </div>

        {/* Hero text */}
        <div className="absolute bottom-12 left-0 right-0 px-6 md:px-12 z-10">
          <div className="max-w-5xl">
            <p className="text-[var(--brand-yellow)] font-bebas tracking-widest text-xl mb-3">
              {event.date}
            </p>
            <h1
              ref={titleRef}
              className="text-white font-bebas text-5xl md:text-7xl lg:text-[6rem] leading-[1.05] uppercase"
            >
              {splitTitle(event.name)}
            </h1>
          </div>
        </div>
      </section>

      {/* CONTENT */}
      <div ref={contentRef} className="max-w-7xl mx-auto px-6 md:px-12 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">

          {/* LEFT — Main content */}
          <div className="lg:col-span-2 space-y-12">

            {/* Description */}
            <div>
              <span className="inline-block text-[var(--brand-yellow)] font-bebas tracking-widest text-sm mb-4 border-b border-[var(--brand-yellow)] pb-1">
                ABOUT THIS EVENT
              </span>
              <p className="text-[var(--brand-white)] font-sans text-lg leading-relaxed">
                {event.longDescription}
              </p>
            </div>

            {/* Image gallery strip */}
            <div>
              <span className="inline-block text-[var(--brand-yellow)] font-bebas tracking-widest text-sm mb-4 border-b border-[var(--brand-yellow)] pb-1">
                EVENT GALLERY
              </span>
              <div className="grid grid-cols-3 gap-3">
                {[
                  "1540039155733-5bb30b53aa14",
                  "1470229722913-7c0e2dbbafd3",
                  "1493225457124-a3eb161ffa5f",
                ].map((photoId, i) => (
                  <div key={i} className="aspect-video overflow-hidden border border-[var(--brand-border)] group">
                    <img
                      src={`https://images.unsplash.com/photo-${photoId}?w=600&h=400&fit=crop&q=80`}
                      alt={`${event.name} photo ${i + 1}`}
                      className="w-full h-full object-cover brightness-75 group-hover:brightness-100 group-hover:scale-105 transition-all duration-500"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Performing artists */}
            <div>
              <span className="inline-block text-[var(--brand-yellow)] font-bebas tracking-widest text-sm mb-4 border-b border-[var(--brand-yellow)] pb-1">
                PERFORMING ARTISTS
              </span>
              <div className="flex flex-wrap gap-4">
                {event.artists.map((artist) => {
                  const slugMap: Record<string, string> = {
                    Hintell: "hintell",
                    "Dark Koko": "dark-koko",
                    Swazz: "swazz",
                    "Mee$ch": "meesch",
                  };
                  return (
                    <Link
                      key={artist}
                      to={`/artists/${slugMap[artist] ?? artist.toLowerCase()}`}
                      className="flex items-center gap-3 bg-[var(--brand-card)] border border-[var(--brand-border)] px-5 py-3 hover:border-[var(--brand-yellow)] transition-colors group"
                    >
                      <img
                        src={`/${slugMap[artist] ?? artist.toLowerCase().replace(/\s|\$/g, "")}.jpg`}
                        alt={artist}
                        className="w-10 h-10 rounded-full object-cover border border-[var(--brand-border)]"
                      />
                      <span className="text-white font-bebas text-xl tracking-widest group-hover:text-[var(--brand-yellow)] transition-colors">
                        {artist}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT — Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Event info card */}
            <div className="bg-[var(--brand-card)] border border-[var(--brand-border)] p-7 space-y-5">
              <h3 className="text-white font-bebas text-2xl tracking-widest border-b border-[var(--brand-border)] pb-4">
                EVENT DETAILS
              </h3>

              <div className="flex items-start gap-3">
                <Calendar size={18} className="text-[var(--brand-yellow)] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[var(--brand-gray)] font-sans text-xs tracking-widest uppercase mb-0.5">Date</p>
                  <p className="text-white font-sans font-medium">{event.date}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-[var(--brand-yellow)] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[var(--brand-gray)] font-sans text-xs tracking-widest uppercase mb-0.5">Location</p>
                  <p className="text-white font-sans font-medium">{event.venue}</p>
                  <p className="text-[var(--brand-gray)] font-sans text-sm">{event.location}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Users size={18} className="text-[var(--brand-yellow)] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[var(--brand-gray)] font-sans text-xs tracking-widest uppercase mb-0.5">Artists</p>
                  <p className="text-white font-sans font-medium">{event.artists.join(", ")}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Tag size={18} className="text-[var(--brand-yellow)] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[var(--brand-gray)] font-sans text-xs tracking-widest uppercase mb-0.5">Category</p>
                  <span className="bg-[var(--brand-yellow)] text-black font-bebas px-3 py-0.5 text-sm tracking-widest rounded-full inline-block">
                    #{event.tag}
                  </span>
                </div>
              </div>
            </div>

            {/* Book CTA */}
            <div className="bg-[var(--brand-dark)] border border-[var(--brand-border)] p-7">
              <h3 className="text-white font-bebas text-2xl tracking-widest mb-2">BOOK AN ARTIST</h3>
              <p className="text-[var(--brand-gray)] font-sans text-sm mb-5">
                Want to book one of our artists for your next event?
              </p>
              <Link
                to="/booking"
                className="flex items-center justify-center gap-2 w-full bg-[var(--brand-yellow)] text-black font-bebas text-xl tracking-widest py-4 hover:bg-white transition-colors"
              >
                BOOK NOW <ArrowRight size={18} />
              </Link>
            </div>

            {/* Share / contact */}
            <div className="bg-[var(--brand-card)] border border-[var(--brand-border)] p-7">
              <h3 className="text-white font-bebas text-xl tracking-widest mb-3">ENQUIRIES</h3>
              <a
                href="mailto:booking@1jamaicamusic.com"
                className="text-[var(--brand-yellow)] font-sans text-sm hover:underline"
              >
                booking@1jamaicamusic.com
              </a>
            </div>
          </div>
        </div>

        {/* RELATED EVENTS */}
        {otherRelated.length > 0 && (
          <div className="mt-24 border-t border-[var(--brand-border)] pt-16">
            <div className="flex items-center justify-between mb-10">
              <span className="text-[var(--brand-yellow)] font-bebas text-2xl tracking-widest">MORE EVENTS</span>
              <Link
                to="/events"
                className="text-[var(--brand-gray)] font-bebas tracking-widest hover:text-[var(--brand-yellow)] transition-colors flex items-center gap-1"
              >
                SEE ALL <ArrowRight size={16} />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {otherRelated.map((rel) => (
                <Link
                  key={rel.id}
                  to={`/events/${rel.slug}`}
                  className="bg-[var(--brand-card)] border border-[var(--brand-border)] overflow-hidden group hover:border-[var(--brand-yellow)] transition-colors"
                >
                  <div className="aspect-video relative overflow-hidden">
                    <img
                      src={rel.image}
                      alt={rel.name}
                      className="w-full h-full object-cover brightness-50 group-hover:brightness-75 group-hover:scale-105 transition-all duration-500"
                    />
                    <div className="absolute top-3 right-3 bg-[var(--brand-yellow)] text-black font-bebas px-3 py-0.5 text-xs tracking-widest rounded-full">
                      #{rel.tag}
                    </div>
                  </div>
                  <div className="p-5">
                    <span className="text-[var(--brand-gray)] font-sans text-xs mb-2 block">{rel.date}</span>
                    <h4 className="text-white font-sans font-bold text-base leading-tight group-hover:text-[var(--brand-yellow)] transition-colors">
                      {rel.name}
                    </h4>
                    <span className="inline-flex items-center gap-1 text-[var(--brand-yellow)] font-bebas text-sm tracking-widest mt-3">
                      VIEW EVENT <ArrowRight size={13} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.main>
  );
}
