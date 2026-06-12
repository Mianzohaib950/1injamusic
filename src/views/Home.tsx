import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronDown, Play, Instagram, Twitter, Facebook, Youtube, Music } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { titleToSlug } from "@/data/releases";

gsap.registerPlugin(ScrollTrigger);

const splitText = (text: string) => {
  return text.split("").map((char, index) => (
    <span key={index} className="inline-block">
      {char === " " ? "\u00A0" : char}
    </span>
  ));
};

const pickHeroLine = (candidate: unknown, fallback: string, maxWords = 4) => {
  if (typeof candidate !== "string") return fallback;
  const clean = candidate.trim();
  if (!clean) return fallback;
  const words = clean.split(/\s+/).filter(Boolean);
  return words.length <= maxWords ? clean : fallback;
};

type CmsItem = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  videoUrl: string;
  linkLabel: string;
  linkUrl: string;
  itemKey: string;
  sortOrder: number;
  active: boolean;
  tags?: string[];
  meta?: Record<string, any>;
};

type CmsSection = {
  id: string;
  sectionKey: string;
  title: string;
  subtitle: string;
  body: string;
  imageUrl: string;
  videoUrl: string;
  ctaLabel: string;
  ctaUrl: string;
  sortOrder: number;
  active: boolean;
  settings?: Record<string, any>;
  items: CmsItem[];
};

export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null);
  const heroTextRef1 = useRef<HTMLHeadingElement>(null);
  const heroTextRef2 = useRef<HTMLHeadingElement>(null);
  const heroTextRef3 = useRef<HTMLHeadingElement>(null);
  
  const statsRef = useRef<HTMLDivElement>(null);
  const stat1Ref = useRef<HTMLSpanElement>(null);
  const stat2Ref = useRef<HTMLSpanElement>(null);
  const [cmsSections, setCmsSections] = useState<CmsSection[]>([]);

  useEffect(() => {
    let active = true;
    const loadCms = async () => {
      try {
        const response = await fetch(`/api/cms/home?ts=${Date.now()}`, {
          method: "GET",
          cache: "no-store",
        });
        if (!response.ok) return;
        const data = await response.json();
        if (!active) return;
        const sections = Array.isArray(data?.sections) ? data.sections : [];
        setCmsSections(sections.filter((section: CmsSection) => section.active !== false));
      } catch {
        // Keep static fallback content if CMS fetch fails.
      }
    };
    loadCms();
    return () => {
      active = false;
    };
  }, []);

  const cmsMap = useMemo(() => {
    const map = new Map<string, CmsSection>();
    cmsSections.forEach((section) => map.set(section.sectionKey, section));
    return map;
  }, [cmsSections]);

  const getSection = (key: string) => cmsMap.get(key);
  const getActiveItems = (section?: CmsSection) =>
    [...(section?.items ?? [])]
      .filter((item) => item.active !== false)
      .sort((a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0));

  const heroSection = getSection("hero");
  const heroSettings = (heroSection?.settings ?? {}) as Record<string, any>;
  const heroLine1Candidate = heroSection?.title || heroSettings.line1;
  const heroLine2Candidate = heroSection?.subtitle || heroSettings.line2;
  const heroLine3Candidate = heroSettings.line3;
  const heroLine1 = pickHeroLine(heroLine1Candidate, "WE COLLABORATE");
  const heroLine2 = pickHeroLine(heroLine2Candidate, "WITH AMBITIOUS");
  const heroLine3 = String(heroLine3Candidate ?? "AND");
  const heroHighlight2 = String(heroSettings.highlight2 ?? "DJS");
  const heroHighlight3 = String(heroSettings.highlight3 ?? "PRODUCERS.");

  useEffect(() => {
    // Hero Text Animation
    const chars1 = heroTextRef1.current?.querySelectorAll("span");
    const chars2 = heroTextRef2.current?.querySelectorAll("span");
    const chars3 = heroTextRef3.current?.querySelectorAll("span");
    
    if (chars1 && chars2 && chars3) {
      const allChars = [...chars1, ...chars2, ...chars3];
      gsap.set(allChars, { y: 60, opacity: 0 });
      const tl = gsap.timeline();
      tl.to([...chars1], {
        y: 0, opacity: 1, stagger: 0.012, ease: "power3.out", duration: 0.5,
      })
      .to([...chars2], {
        y: 0, opacity: 1, stagger: 0.012, ease: "power3.out", duration: 0.5,
      }, "-=0.3")
      .to([...chars3], {
        y: 0, opacity: 1, stagger: 0.012, ease: "power3.out", duration: 0.5,
      }, "-=0.3");
    }
  }, [heroLine1, heroLine2, heroLine3, heroHighlight2, heroHighlight3]);

  useEffect(() => {
    // Scroll animations for sections. Do not animate opacity here; if
    // ScrollTrigger misses timing during client-only routing, content must stay visible.
    const sections = document.querySelectorAll(".scroll-section");
    sections.forEach((section) => {
      gsap.from(section, {
        y: 30,
        duration: 0.6,
        ease: "power2.out",
        scrollTrigger: {
          trigger: section,
          start: "top 85%",
          once: true,
        }
      });
    });

    // Stats counter
    if (statsRef.current) {
      ScrollTrigger.create({
        trigger: statsRef.current,
        start: "top 80%",
        once: true,
        onEnter: () => {
          gsap.to(stat1Ref.current, {
            innerHTML: artistsCount,
            duration: 2,
            snap: { innerHTML: 1 },
            ease: "power1.out"
          });
          gsap.to(stat2Ref.current, {
            innerHTML: releasesCount,
            duration: 2,
            snap: { innerHTML: 1 },
            ease: "power1.out"
          });
        }
      });
    }

    // Artists stagger
    gsap.from(".artist-card", {
      y: 60,
      stagger: 0.15,
      duration: 0.8,
      ease: "power3.out",
      scrollTrigger: {
        trigger: ".artists-preview-section",
        start: "top 75%",
        once: true
      }
    });

    ScrollTrigger.refresh();

  }, []);

  const defaultNewDrops = [
    { title: "Party Time", artist: "Hintell", genre: "Dancehall", image: "/album-push-start.jpg" },
    { title: "Die Once", artist: "Hintell", genre: "Hip-Hop", image: "/album-new-wave.jpg" },
    { title: "Sunday Mix", artist: "Hintell", genre: "Techno/Peak Time", image: "/album-hot-hintell.jpg" },
    { title: "Hypnotic Society", artist: "Hintell", genre: "Techno/Driving", image: "/album-inevitable.jpg" },
    { title: "Club Shake", artist: "Swazz", genre: "Dancehall", image: "/album-night-business.jpg" },
    { title: "Dubai ft. Stylo G", artist: "Swazz", genre: "Dancehall", image: "/album-dudus.jpg" },
    { title: "Glocks and Mimosas", artist: "Dark Koko", genre: "Afrobeats", image: "/album-hangle.jpg" },
    { title: "Portland Love ft. Dark Koko", artist: "Hintell", genre: "Dancehall", image: "/album-black-barbie.jpg" }
  ];

  const defaultAlbumsRow1 = [
    { name: "Push Start Accelerate", image: "/album-push-start.jpg" },
    { name: "New Wave", image: "/album-new-wave.jpg" },
    { name: "Inevitable", image: "/album-inevitable.jpg" },
    { name: "Daily Money", image: "/album-daily-money.jpg" },
    { name: "HOT — Hintell", image: "/album-hot-hintell.jpg" },
    { name: "No Love", image: "/album-no-love.jpg" },
    { name: "Revivalist", image: "/album-revivalist.jpg" },
  ];
  const defaultAlbumsRow2 = [
    { name: "Price Gone Up", image: "/album-price-gone-up.jpg" },
    { name: "Dudus", image: "/album-dudus.jpg" },
    { name: "Night Business", image: "/album-night-business.jpg" },
    { name: "HOT — Dark Koko", image: "/album-hot-darkkoko.jpg" },
    { name: "Hangle", image: "/album-hangle.jpg" },
    { name: "Black Barbie", image: "/album-black-barbie.jpg" },
  ];

  const marqueeSection = getSection("marquee");
  const whatWeDoSection = getSection("what_we_do");
  const artistsPreviewSection = getSection("artists_preview");
  const newDropsSection = getSection("new_drops");
  const featuredVideoSection = getSection("featured_video");
  const albumGallerySection = getSection("album_gallery");
  const communitySection = getSection("community");
  const collaborateSection = getSection("collaborate");
  const footerSection = getSection("footer");
  const fixedSectionKeys = new Set([
    "hero",
    "marquee",
    "what_we_do",
    "artists_preview",
    "new_drops",
    "featured_video",
    "album_gallery",
    "community",
    "collaborate",
    "footer",
  ]);
  const extraSections = useMemo(
    () =>
      cmsSections
        .filter((section) => section.active !== false && !fixedSectionKeys.has(section.sectionKey))
        .sort((a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0)),
    [cmsSections],
  );

  const heroDescription = heroSection?.body || "Booking world-renowned and rising music artists, DJs, and producers out of Jamaica.";
  const heroCtaLabel = heroSection?.ctaLabel || "EXPLORE ARTISTS";
  const heroCtaUrl = heroSection?.ctaUrl || "/artists";
  const heroImage = heroSection?.imageUrl || "/hero-banner.jpg";

  const marqueeText = marqueeSection?.body || "1 JAMAICA MUSIC · LET'S CREATE SOMETHING GREAT TOGETHER · HINTELL · DARK KOKO · SWAZZ · MEE$CH ·";
  const whatWeDoTitle = whatWeDoSection?.title || "WHAT WE DO";
  const whatWeDoBody = whatWeDoSection?.body || "WE COLLABORATE WITH AMBITIOUS DJS AND PRODUCERS. LET'S MAKE SOMETHING GREAT TOGETHER.";
  const whatWeDoSettings = (whatWeDoSection?.settings ?? {}) as Record<string, any>;
  const artistsCount = Number(whatWeDoSettings.artistsCount ?? 4);
  const releasesCount = Number(whatWeDoSettings.releasesCount ?? 50);

  const artistsPreviewItems = getActiveItems(artistsPreviewSection);
  const artistsPreview = artistsPreviewItems.length > 0
    ? artistsPreviewItems.map((item) => ({
        slug: item.itemKey || titleToSlug(item.title || ""),
        name: item.title || item.itemKey || "ARTIST",
        image: item.imageUrl || "/hintell.jpg",
        badge: item.subtitle || "ROSTER",
        linkUrl: item.linkUrl || `/artists/${item.itemKey || titleToSlug(item.title || "")}`,
      }))
    : ['hintell', 'dark-koko', 'swazz', 'meesch'].map((slug) => ({
        slug,
        name: slug.replace('-', ' '),
        image: slug === 'hintell' ? '/hintell.jpg' : slug === 'dark-koko' ? '/dark-koko.jpg' : slug === 'meesch' ? '/meesch-home.jpg' : '/swazz.jpg',
        badge: "ROSTER",
        linkUrl: `/artists/${slug}`,
      }));

  const newDropItems = getActiveItems(newDropsSection);
  const cmsNewDrops = newDropItems.map((item) => ({
        title: item.title,
        artist: item.subtitle || String((item.meta ?? {}).artist ?? ""),
        genre: String((item.meta ?? {}).genre ?? item.description ?? ""),
        image: item.imageUrl,
        linkUrl: item.linkUrl || `/releases/${titleToSlug(item.title)}`,
      }));
  const newDrops = cmsNewDrops.length > 0
    ? cmsNewDrops
    : defaultNewDrops.map((drop) => ({ ...drop, linkUrl: `/releases/${titleToSlug(drop.title)}` }));

  const albumItems = getActiveItems(albumGallerySection);
  const albumsRow1 = albumItems.length > 0
    ? albumItems.filter((item) => Number((item.meta ?? {}).row ?? 1) === 1).map((item) => ({ name: item.title, image: item.imageUrl }))
    : defaultAlbumsRow1;
  const albumsRow2 = albumItems.length > 0
    ? albumItems.filter((item) => Number((item.meta ?? {}).row ?? 2) === 2).map((item) => ({ name: item.title, image: item.imageUrl }))
    : defaultAlbumsRow2;

  const featuredVideoTitle = featuredVideoSection?.title || "LATEST VIDEO";
  const featuredVideoHeadline = featuredVideoSection?.body || "Swazz - Night Business (Official Video)";
  const featuredVideoUrl = featuredVideoSection?.videoUrl || "/latest-video.mp4";

  const communityItems = getActiveItems(communitySection);
  const communityImages = communityItems.length > 0
    ? communityItems.map((item) => item.imageUrl)
    : ['/comm-1.jpg','/comm-2.jpg','/comm-3.jpg','/comm-4.jpg','/comm-5.jpg','/comm-6.jpg','/comm-7.jpg','/comm-8.jpg','/comm-9.jpg'];
  const communityCtaLabel = communitySection?.ctaLabel || "FOLLOW ON INSTAGRAM";
  const communityCtaUrl = communitySection?.ctaUrl || "#";
  const communityBody = communitySection?.body || "Follow us @swazz_music | @hintell_music | @darkkoko | @meesch";

  const collaborateTitle = collaborateSection?.title || "WE COLLABORATE WITH NEW RISING DJs";
  const collaborateBody = collaborateSection?.body || "Our team is always on the lookout for new rising producers and fresh artists to join the 1 Jamaica Music family.";
  const collaborateImage = collaborateSection?.imageUrl || "/collab-section.jpg";
  const collaborateCtaUrl = collaborateSection?.ctaUrl || "/artists";
  const collaborateCtaLabel = collaborateSection?.ctaLabel || "READ MORE";
  const collaborateSettings = (collaborateSection?.settings ?? {}) as Record<string, any>;
  const collaborateEmail = String(collaborateSettings.email ?? "booking@1jamaicamusic.com");

  const footerTitle = footerSection?.title || "1 JAMAICA MUSIC";
  const footerItems = getActiveItems(footerSection);
  const footerContactItems = footerItems.filter((item) => item.itemKey.startsWith("contact-"));
  const footerSocialItems = footerItems.filter((item) => item.itemKey.startsWith("social-"));
  const defaultFooterContacts = [
    { title: "Booking World Wide", email: "booking@1jamaicamusic.com" },
    { title: "Demo Publishing", email: "demos@1jamaicamusic.com" },
    { title: "Music Licencing", email: "licensing@1jamaicamusic.com" },
  ];
  const resolvedFooterContacts = footerContactItems.length > 0
    ? footerContactItems.map((item) => {
        const email = item.linkUrl?.startsWith("mailto:")
          ? item.linkUrl.replace(/^mailto:/, "")
          : item.linkUrl || item.description || "";
        return {
          title: item.title || item.linkLabel || "Contact",
          email,
        };
      }).filter((item) => item.email)
    : defaultFooterContacts;
  const socialIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    instagram: Instagram,
    twitter: Twitter,
    facebook: Facebook,
    youtube: Youtube,
    music: Music,
  };
  const defaultSocialLinks = [
    { key: "instagram", url: "#" },
    { key: "twitter", url: "#" },
    { key: "facebook", url: "#" },
    { key: "youtube", url: "#" },
    { key: "music", url: "#" },
  ];
  const resolvedSocialLinks = footerSocialItems.length > 0
    ? footerSocialItems.map((item) => ({
        key: item.itemKey.replace(/^social-/, "").toLowerCase(),
        url: item.linkUrl || "#",
      })).filter((item) => socialIconMap[item.key])
    : defaultSocialLinks;

  return (
    <main className="w-full bg-[var(--brand-black)] overflow-hidden">
      
      {/* HERO SECTION */}
      <section 
        ref={heroRef}
        className="relative h-screen w-full flex flex-col items-center justify-center pt-28 md:pt-32 overflow-hidden"
      >
        {/* Photo background */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${heroImage}')`, backgroundPosition: "center 70%", opacity: 0.55, filter: "brightness(0.5) saturate(0.75)" }}
        />
        {/* Dark gradient on top of photo */}
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/45 via-transparent to-[var(--brand-black)]" />

        {/* Animated grid lines */}
        <div className="absolute inset-0 z-[1] hero-grid opacity-15 pointer-events-none" />

        {/* Orb 1 — yellow, top-right, slow drift */}
        <div className="absolute z-[1] pointer-events-none orb-1 w-[700px] h-[700px] rounded-full blur-[160px]"
          style={{ background: "radial-gradient(circle, rgba(232,255,0,0.22) 0%, transparent 70%)", top: "-10%", right: "-10%" }} />

        {/* Orb 2 — green, bottom-left, slow drift opposite */}
        <div className="absolute z-[1] pointer-events-none orb-2 w-[500px] h-[500px] rounded-full blur-[140px]"
          style={{ background: "radial-gradient(circle, rgba(57,255,20,0.14) 0%, transparent 70%)", bottom: "-5%", left: "-8%" }} />

        {/* Orb 3 — yellow, center, pulse */}
        <div className="absolute z-[1] pointer-events-none orb-pulse w-[400px] h-[400px] rounded-full blur-[120px]"
          style={{ background: "radial-gradient(circle, rgba(232,255,0,0.08) 0%, transparent 70%)", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }} />

        {/* Bottom fade */}
        <div className="absolute inset-x-0 bottom-0 h-48 z-0 bg-gradient-to-t from-[var(--brand-black)] to-transparent" />

        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto flex flex-col items-center pb-20 md:pb-16">
          <h1 ref={heroTextRef1} className="text-white text-4xl md:text-6xl lg:text-[6.2rem] leading-[1.12] font-bebas">
            {splitText(heroLine1)}
          </h1>
          <h1 ref={heroTextRef2} className="text-white text-4xl md:text-6xl lg:text-[6.2rem] leading-[1.12] font-bebas">
            {splitText(`${heroLine2} `)}<span className="border-b-4 border-[#e5fe0b]" style={{color:"#e5fe0b"}}>{splitText(heroHighlight2)}</span>
          </h1>
          <h1 ref={heroTextRef3} className="text-white text-4xl md:text-6xl lg:text-[6.2rem] leading-[1.12] font-bebas">
            {splitText(`${heroLine3} `)}<span className="border-b-4 border-[#e5fe0b]" style={{color:"#e5fe0b"}}>{splitText(heroHighlight3)}</span>
          </h1>
          
          <p className="mt-8 text-[var(--brand-gray)] text-lg md:text-xl font-sans max-w-2xl">
            {heroDescription}
          </p>

          <div className="mt-12  flex flex-col items-center text-[var(--brand-yellow)] gap-2">
            <span className="font-bebas tracking-widest text-sm opacity-60">SCROLL</span>
            <ChevronDown className="animate-bounce" />
          </div>

          <Link 
            to={heroCtaUrl}
            className="mt-6 md:mt-8 inline-flex items-center gap-2 px-8 py-3 rounded-full border-2 border-[var(--brand-yellow)] text-[var(--brand-yellow)] font-bebas text-2xl tracking-widest hover:bg-[var(--brand-yellow)] hover:text-black transition-colors group hero-cta-glow"
          >
            {heroCtaLabel} <ArrowRight className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="absolute bottom-6 left-0 right-0 h-14 pointer-events-none bg-gradient-to-t from-[var(--brand-black)] to-transparent" />
      </section>

            {/* MARQUEE */}
      <section className="py-8 bg-[var(--brand-dark)] border-y border-[var(--brand-border)] overflow-hidden flex whitespace-nowrap">
        <div className="animate-ticker flex items-center">
          <span className="text-[var(--brand-yellow)] font-bebas text-2xl tracking-[0.2em] px-4">{marqueeText}</span>
          <span className="text-[var(--brand-yellow)] font-bebas text-2xl tracking-[0.2em] px-4">{marqueeText}</span>
        </div>
      </section>

      {/* WHAT WE DO */}
      <section className="scroll-section py-24 px-6 md:px-12 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div>
          <span className="inline-block text-[var(--brand-yellow)] font-bebas text-xl tracking-widest mb-6">{whatWeDoTitle}</span>
          <h2 className="text-white text-5xl md:text-6xl font-bebas leading-none">
            {whatWeDoBody}
          </h2>
        </div>
        <div ref={statsRef} className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div className="stat-glow flex flex-col border border-[var(--brand-border)] bg-[var(--brand-card)] p-8 text-center" style={{ animationDelay: "0s" }}>
            <span ref={stat1Ref} className="text-[var(--brand-yellow)] text-7xl font-bebas">0</span>
            <span className="text-white font-bebas tracking-widest mt-2">ARTISTS</span>
          </div>
          <div className="stat-glow flex flex-col border border-[var(--brand-border)] bg-[var(--brand-card)] p-8 text-center" style={{ animationDelay: "1s" }}>
            <span ref={stat2Ref} className="text-[var(--brand-yellow)] text-7xl font-bebas">0</span>
            <span className="text-white font-bebas tracking-widest mt-2">RELEASES</span>
          </div>
          <div className="flex flex-col border border-[var(--brand-border)] bg-[var(--brand-card)] p-8 text-center hover:shadow-[0_0_20px_rgba(232,255,0,0.15)] transition-shadow justify-center">
            <span className="text-[var(--brand-yellow)] text-4xl font-bebas leading-none">WORLD<br/>WIDE</span>
            <span className="text-white font-bebas tracking-widest mt-4">BOOKINGS</span>
          </div>
        </div>
      </section>

      {/* OUR ARTISTS PREVIEW */}
      <section className="artists-preview-section py-24 pl-6 md:pl-12 bg-[var(--brand-dark)]">
        <div className="max-w-7xl mx-auto mb-12 pr-6 md:pr-12 flex justify-between items-end">
          <div>
            <span className="inline-block text-[var(--brand-yellow)] font-bebas text-xl tracking-widest">{artistsPreviewSection?.title || "OUR ARTISTS"}</span>
          </div>
          <Link to="/artists" className="text-[var(--brand-white)] font-bebas text-xl tracking-widest border-b border-[var(--brand-yellow)] pb-1 hover:text-[var(--brand-yellow)] transition-colors">
            SEE ALL ARTISTS
          </Link>
        </div>
        
        <div className="flex gap-6 overflow-x-auto pb-8 pr-6 md:pr-12 snap-x scrollbar-hide">
          {artistsPreview.map((artist) => (
            <Link 
              key={artist.slug}
              to={artist.linkUrl}
              className="artist-card flex-none w-[300px] md:w-[400px] relative group overflow-hidden snap-center cursor-none"
            >
              <div className="aspect-[2/3] overflow-hidden">
                <img 
                  src={artist.image}
                  alt={artist.name}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 brightness-75 group-hover:brightness-100"
                />
              </div>
              <div className="absolute inset-0 bg-black/20 group-hover:bg-[var(--brand-yellow)]/90 transition-colors duration-500 flex items-center justify-center">
                <span className="text-black font-bebas text-4xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 translate-y-4 group-hover:translate-y-0">
                  VIEW ARTIST
                </span>
              </div>
              <div className="absolute bottom-6 left-6 right-6">
                <h3 className="text-white text-4xl font-bebas drop-shadow-lg">{artist.name}</h3>
                <span className="inline-block bg-[var(--brand-yellow)] text-black font-bebas px-3 py-1 text-sm tracking-widest mt-2 rounded-full">
                  {artist.badge}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* NEW DROPS */}
      <section className="scroll-section py-24 px-6 md:px-12 max-w-7xl mx-auto">
        <span className="inline-block text-[var(--brand-yellow)] font-bebas text-xl tracking-widest mb-12">{newDropsSection?.title || "NEW DROPS"}</span>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {newDrops.map((drop, i) => (
            <Link key={i} to={drop.linkUrl} className="group" data-testid={`release-card-${i}`}>
              <div className="aspect-square overflow-hidden mb-4 border border-[var(--brand-border)] group-hover:border-[var(--brand-yellow)] group-hover:shadow-[0_0_20px_rgba(232,255,0,0.2)] transition-all duration-300">
                <img 
                  src={drop.image}
                  alt={drop.title}
                  loading="lazy"
                  className="w-full h-full object-cover brightness-75 group-hover:brightness-100 group-hover:scale-105 transition-all duration-500"
                />
              </div>
              <h4 className="text-white font-sans font-bold text-lg leading-tight group-hover:text-[var(--brand-yellow)] transition-colors">{drop.title}</h4>
              <p className="text-[var(--brand-yellow)] font-bebas tracking-widest text-lg mt-1">{drop.artist}</p>
              <p className="text-[var(--brand-gray)] font-sans text-sm">{drop.genre}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURED VIDEO */}
      <section className="scroll-section py-12">
        <div className="max-w-7xl mx-auto px-6 md:px-12 mb-6">
          <span className="inline-block text-[var(--brand-yellow)] font-bebas text-xl tracking-widest">{featuredVideoTitle}</span>
        </div>
        <div className="w-full aspect-[21/9] max-h-[80vh] relative group">
          <video
            src={featuredVideoUrl}
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover brightness-50 group-hover:brightness-75 transition-all duration-500"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="w-24 h-24 rounded-full bg-[var(--brand-yellow)]/20 border-2 border-[var(--brand-yellow)] flex items-center justify-center mb-6">
              <Play className="text-[var(--brand-yellow)] w-10 h-10 ml-2" />
            </div>
            <h2 className="text-white font-bebas text-4xl md:text-6xl text-center px-4 drop-shadow-xl">
              {featuredVideoHeadline}
            </h2>
          </div>
        </div>
      </section>

      {/* ALBUM ART GALLERY */}
      <section className="py-24 bg-[var(--brand-dark)] overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 md:px-12 mb-12">
          <span className="inline-block text-[var(--brand-yellow)] font-bebas text-xl tracking-widest">{albumGallerySection?.title || "ALBUM ART"}</span>
        </div>
        
        <div className="flex flex-col gap-4 group/container">
          {/* Row 1 — scrolling left */}
          <div className="flex whitespace-nowrap animate-ticker group-hover/container:[animation-play-state:paused]">
            {[...albumsRow1, ...albumsRow1].map((album, i) => (
              <div key={`row1-${i}`} className="relative w-[180px] h-[180px] flex-none group/item mx-2 border border-[var(--brand-border)]">
                <img
                  src={album.image}
                  alt={album.name}
                  loading="lazy"
                  width={180}
                  height={180}
                  className="w-full h-full object-cover brightness-75 group-hover/item:brightness-100 transition-all duration-300"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/item:opacity-100 transition-opacity flex items-center justify-center p-4 text-center">
                  <span className="text-[var(--brand-yellow)] font-bebas text-lg break-words whitespace-normal">{album.name}</span>
                </div>
              </div>
            ))}
          </div>
          {/* Row 2 — scrolling right */}
          <div className="flex whitespace-nowrap animate-ticker-reverse group-hover/container:[animation-play-state:paused]">
            {[...albumsRow2, ...albumsRow2].map((album, i) => (
              <div key={`row2-${i}`} className="relative w-[180px] h-[180px] flex-none group/item mx-2 border border-[var(--brand-border)]">
                <img
                  src={album.image}
                  alt={album.name}
                  loading="lazy"
                  width={180}
                  height={180}
                  className="w-full h-full object-cover brightness-75 group-hover/item:brightness-100 transition-all duration-300"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/item:opacity-100 transition-opacity flex items-center justify-center p-4 text-center">
                  <span className="text-[var(--brand-yellow)] font-bebas text-lg break-words whitespace-normal">{album.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMMUNITY & COLLAB */}
      <section className="scroll-section py-24 px-6 md:px-12 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16">
        
        {/* COMMUNITY */}
        <div>
          <span className="inline-block text-[var(--brand-yellow)] font-bebas text-xl tracking-widest mb-8">{communitySection?.title || "COMMUNITY"}</span>
          <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-8">
            {communityImages.map((src, i) => (
              <div key={i} className="aspect-square relative group cursor-pointer border border-[var(--brand-border)]">
                <img 
                  src={src}
                  loading="lazy"
                  width={300}
                  height={300}
                  className="w-full h-full object-cover brightness-75 group-hover:brightness-100 transition-all duration-300"
                  alt={`Community ${i + 1}`}
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Instagram className="text-white w-8 h-8 drop-shadow-lg" />
                </div>
              </div>
            ))}
          </div>
          <p className="text-[var(--brand-gray)] font-sans mb-8 text-center sm:text-left">
            {communityBody}
          </p>
          <a 
            href={communityCtaUrl}
            className="inline-block px-8 py-3 rounded-full border-2 border-[var(--brand-yellow)] text-[var(--brand-yellow)] font-bebas text-xl tracking-widest hover:bg-[var(--brand-yellow)] hover:text-black transition-colors w-full sm:w-auto text-center"
          >
            {communityCtaLabel}
          </a>
        </div>

        {/* COLLABORATE */}
        <div className="flex flex-col justify-center">
          <div className="w-full aspect-[4/3] mb-8 border border-[var(--brand-border)]">
            <img 
              src={collaborateImage} 
              loading="lazy"
              width={800}
              height={600}
              className="w-full h-full object-cover brightness-75"
              alt="Collaborate"
            />
          </div>
          <h2 className="text-white text-5xl font-bebas mb-6 leading-none">{collaborateTitle}</h2>
          <p className="text-[var(--brand-gray)] font-sans text-lg mb-8">
            {collaborateBody}
          </p>
          <a 
            href={`mailto:${collaborateEmail}`} 
            className="group flex items-center gap-2 text-[var(--brand-yellow)] font-bebas text-3xl tracking-widest mb-12 hover:opacity-80 transition-opacity w-fit"
          >
            {collaborateEmail} <ArrowRight className="group-hover:translate-x-2 transition-transform" />
          </a>
          <Link 
            to={collaborateCtaUrl}
            className="inline-block px-8 py-3 rounded-full border-2 border-white text-white font-bebas text-xl tracking-widest hover:bg-white hover:text-black transition-colors w-fit"
          >
            {collaborateCtaLabel}
          </Link>
        </div>

      </section>

      {extraSections.length > 0 && (
        <section className="scroll-section py-20 px-6 md:px-12 max-w-7xl mx-auto space-y-10">
          {extraSections.map((section) => {
            const items = getActiveItems(section);
            return (
              <article key={section.id} className="border border-[var(--brand-border)] bg-[var(--brand-card)] p-6 md:p-8">
                <p className="text-[var(--brand-yellow)] font-bebas tracking-widest text-sm mb-2">
                  {section.sectionKey.replace(/_/g, " ").toUpperCase()}
                </p>
                {section.title && <h3 className="text-white text-3xl md:text-4xl font-bebas">{section.title}</h3>}
                {section.subtitle && <p className="text-[var(--brand-yellow)] font-bebas tracking-widest mt-2">{section.subtitle}</p>}
                {section.body && <p className="text-[var(--brand-gray)] font-sans mt-4 leading-relaxed">{section.body}</p>}
                {section.imageUrl && (
                  <img
                    src={section.imageUrl}
                    alt={section.title || section.sectionKey}
                    loading="lazy"
                    className="w-full max-h-[420px] object-cover border border-[var(--brand-border)] mt-6"
                  />
                )}
                {items.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    {items.map((item) => (
                      <div key={item.id} className="border border-[var(--brand-border)] p-4 bg-[#111]">
                        <h4 className="text-white font-bebas text-2xl">{item.title || item.itemKey}</h4>
                        {item.subtitle && <p className="text-[var(--brand-yellow)] font-bebas tracking-widest mt-1">{item.subtitle}</p>}
                        {item.description && <p className="text-[var(--brand-gray)] font-sans text-sm mt-3">{item.description}</p>}
                        {item.imageUrl && (
                          <img
                            src={item.imageUrl}
                            alt={item.title || item.itemKey}
                            loading="lazy"
                            className="w-full h-52 object-cover border border-[var(--brand-border)] mt-4"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {section.ctaLabel && (
                  <Link
                    to={section.ctaUrl || "#"}
                    className="inline-flex items-center gap-2 mt-6 px-6 py-2 border border-[var(--brand-yellow)] text-[var(--brand-yellow)] font-bebas tracking-widest hover:bg-[var(--brand-yellow)] hover:text-black transition-colors"
                  >
                    {section.ctaLabel}
                  </Link>
                )}
              </article>
            );
          })}
        </section>
      )}

      {/* FOOTER */}
      <footer className="bg-[var(--brand-dark)] border-t border-[var(--brand-border)] pt-24 pb-8 px-6 md:px-12 border-b-4 border-b-[var(--brand-yellow)]">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-white text-7xl md:text-[12rem] font-bebas leading-none text-center md:text-left mb-16 opacity-90">
            {footerTitle}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
            {resolvedFooterContacts.map((contact) => (
              <div key={`${contact.title}-${contact.email}`} className="flex flex-col gap-2">
                <span className="text-[var(--brand-gray)] font-bebas tracking-widest text-xl">{contact.title}</span>
                <a href={`mailto:${contact.email}`} className="text-white font-sans hover:text-[var(--brand-yellow)] transition-colors">{contact.email}</a>
              </div>
            ))}
          </div>

          <div className="flex justify-center md:justify-start gap-6 mb-16">
            {resolvedSocialLinks.map((social) => {
              const Icon = socialIconMap[social.key];
              if (!Icon) return null;
              return (
                <a key={`${social.key}-${social.url}`} href={social.url} target="_blank" rel="noreferrer" className="text-white hover:text-[var(--brand-yellow)] transition-colors">
                  <Icon />
                </a>
              );
            })}
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-[var(--brand-border)] gap-4">
            <p className="text-[var(--brand-gray)] font-sans text-sm">© 2026 - 1JamaicaMusic. All Rights Reserved. (Designed & Developed By Novatore Solutions)</p>
          </div>
        </div>
      </footer>

    </main>
  );
}

