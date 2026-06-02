import { useEffect, useRef, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowRight, Play, SkipBack, SkipForward, ChevronRight } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion } from "framer-motion";
import { getReleaseBySlug, getReleasesByArtist } from "@/data/releases";
import { toast } from "sonner";

gsap.registerPlugin(ScrollTrigger);

const platformIcons: Record<string, { label: string; color: string; bg: string }> = {
  spotify: { label: "Spotify", color: "#1DB954", bg: "#1DB954" },
  youtube: { label: "YouTube", color: "#FF0000", bg: "#FF0000" },
  soundcloud: { label: "SoundCloud", color: "#FF5500", bg: "#FF5500" },
  tidal: { label: "Tidal", color: "#00FFFF", bg: "#00FFFF" },
  appleMusic: { label: "Apple Music", color: "#FC3C44", bg: "#FC3C44" },
  beatport: { label: "Beatport", color: "#02FF6C", bg: "#02FF6C" },
};

const PlatformSVG = ({ platform }: { platform: string }) => {
  const icons: Record<string, React.ReactNode> = {
    spotify: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
      </svg>
    ),
    youtube: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
    soundcloud: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M1.175 12.225c-.017 0-.034.002-.052.003v-.003H1.1c-.6 0-1.1.5-1.1 1.1 0 .6.5 1.1 1.1 1.1h.023v.002c.616 0 1.1-.5 1.1-1.1-.001-.606-.492-1.1-1.048-1.102zm3.564-1.422c-.017 0-.034.002-.052.003v-.003c-.6 0-1.1.5-1.1 1.1 0 .6.5 1.1 1.1 1.1v.002c.616 0 1.1-.5 1.1-1.1-.001-.606-.492-1.1-1.048-1.102zM24 11.302c0-2.4-1.95-4.35-4.35-4.35-1.152 0-2.198.449-2.979 1.181A7.83 7.83 0 0 0 12 5.578a7.83 7.83 0 0 0-7.83 7.83v.002H4.2c.017 0 .034-.002.052-.003v.003c.59 0 1.066.476 1.066 1.066 0 .59-.476 1.066-1.066 1.066v-.002c-.6 0-1.1.5-1.1 1.1 0 .6.5 1.1 1.1 1.1h15.448C21.9 16.74 24 14.19 24 11.302z" />
      </svg>
    ),
    tidal: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M12.012 3.992L8.008 7.996 4.004 3.992 0 7.996l4.004 4.004 4.004-4.004 4.004 4.004 4.004-4.004zM8.008 12l-4.004 4.004L8.008 20l4.004-4.004L8.008 12zm7.98-4.004l-4.004 4.004L16.012 16l4.004-4.004z" />
      </svg>
    ),
    appleMusic: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M23.994 6.124a9.23 9.23 0 0 0-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043a6.303 6.303 0 0 0-1.86-.86c-.603-.127-1.223-.19-1.84-.21-.114-.006-.692-.02-.925-.02H6.982c-.458.01-.916.025-1.37.065C4.55.205 3.507.61 2.62 1.285c-.73.563-1.22 1.323-1.55 2.165A7.613 7.613 0 0 0 .724 5.17C.62 5.854.61 6.547.604 7.237c-.01.42-.01 3.993-.01 3.993s0 3.54.01 3.966c.01.71.026 1.42.15 2.12.2 1.1.699 2.052 1.49 2.85.78.79 1.73 1.3 2.84 1.51.64.12 1.29.17 1.95.18.3.01 3.8.01 3.8.01h3.98s3.54 0 3.97-.01c.67-.01 1.33-.06 1.97-.19 1.11-.22 2.07-.74 2.84-1.55.77-.81 1.28-1.77 1.47-2.85.12-.7.135-1.4.145-2.11.01-.42.01-3.97.01-3.97s0-3.55-.01-3.97zM12.002 17.25A5.25 5.25 0 1 1 17.25 12a5.25 5.25 0 0 1-5.248 5.25zm5.467-9.479a1.226 1.226 0 1 1 1.226-1.226 1.226 1.226 0 0 1-1.226 1.226z" />
      </svg>
    ),
    beatport: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm.75 17.5h-1.5v-6.25H9.5V9.75h3.25V17.5zm2.25-10.5a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5zm0 10.5h-1.5V9.75H15V17.5z" />
      </svg>
    ),
  };
  return <>{icons[platform] || null}</>;
};

export default function ReleaseDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const release = slug ? getReleaseBySlug(slug) : undefined;

  const artRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const metaRef = useRef<HTMLDivElement>(null);
  const breadcrumbRef = useRef<HTMLDivElement>(null);
  const tracklistRef = useRef<HTMLDivElement>(null);
  const platformsRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);
  const ctaTextRef = useRef<HTMLDivElement>(null);
  const ctaBtnRef = useRef<HTMLDivElement>(null);

  const [openTrack] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    if (!release) return;

    const ctx = gsap.context(() => {
      // Breadcrumb
      if (breadcrumbRef.current) {
        gsap.from(breadcrumbRef.current, { opacity: 0, y: -10, duration: 0.6, delay: 0.1, ease: "power3.out" });
      }
      // Album art from left
      if (artRef.current) {
        gsap.from(artRef.current, { x: -80, opacity: 0, duration: 0.9, delay: 0.2, ease: "power3.out" });
      }
      // Title from right
      if (titleRef.current) {
        gsap.from(titleRef.current, { x: 80, opacity: 0, duration: 0.9, delay: 0.3, ease: "power3.out" });
      }
      // Metadata rows stagger
      if (metaRef.current) {
        const rows = metaRef.current.querySelectorAll(".meta-row");
        gsap.from(rows, { opacity: 0, y: 10, stagger: 0.1, duration: 0.5, delay: 0.6, ease: "power3.out" });
      }
      // Tracklist scroll reveal
      if (tracklistRef.current) {
        const rows = tracklistRef.current.querySelectorAll(".track-row");
        gsap.from(rows, {
          y: 30, opacity: 0, stagger: 0.08, duration: 0.5, ease: "power3.out",
          scrollTrigger: { trigger: tracklistRef.current, start: "top 80%", once: true }
        });
      }
      // Platforms bounce in
      if (platformsRef.current) {
        const icons = platformsRef.current.querySelectorAll(".platform-icon");
        gsap.from(icons, {
          y: 20, opacity: 0, stagger: 0.06, duration: 0.5, ease: "back.out(1.7)",
          scrollTrigger: { trigger: platformsRef.current, start: "top 85%", once: true }
        });
      }
      // Video fade + scale
      if (videoRef.current) {
        gsap.from(videoRef.current, {
          opacity: 0, scale: 0.97, duration: 0.7, ease: "power3.out",
          scrollTrigger: { trigger: videoRef.current, start: "top 80%", once: true }
        });
      }
      // More releases
      if (moreRef.current) {
        const cards = moreRef.current.querySelectorAll(".more-card");
        gsap.from(cards, {
          y: 40, opacity: 0, stagger: 0.1, duration: 0.6, ease: "power3.out",
          scrollTrigger: { trigger: moreRef.current, start: "top 80%", once: true }
        });
      }
      // CTA strip
      if (ctaTextRef.current) {
        gsap.from(ctaTextRef.current, {
          x: -60, opacity: 0, duration: 0.7, ease: "power3.out",
          scrollTrigger: { trigger: ctaTextRef.current, start: "top 85%", once: true }
        });
      }
      if (ctaBtnRef.current) {
        gsap.from(ctaBtnRef.current, {
          x: 60, opacity: 0, duration: 0.7, ease: "power3.out",
          scrollTrigger: { trigger: ctaBtnRef.current, start: "top 85%", once: true }
        });
      }
    });

    return () => ctx.revert();
  }, [release, slug]);

  if (!release) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="min-h-screen bg-[var(--brand-black)] flex flex-col items-center justify-center text-center px-6"
      >
        <h1 className="font-bebas text-[var(--brand-yellow)] text-8xl md:text-[10rem] leading-none">DROP NOT FOUND</h1>
        <p className="text-[var(--brand-gray)] font-sans text-xl mt-6 mb-12">This release doesn't exist or hasn't dropped yet.</p>
        <Link
          to="/"
          className="px-10 py-3 rounded-full border-2 border-[var(--brand-yellow)] text-[var(--brand-yellow)] font-bebas text-2xl tracking-widest hover:bg-[var(--brand-yellow)] hover:text-black transition-colors"
        >
          BACK TO HOME
        </Link>
      </motion.div>
    );
  }

  const moreReleases = getReleasesByArtist(release.artistSlug, release.slug).slice(0, 3);

  return (
    <motion.main
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="w-full bg-[var(--brand-black)] min-h-screen pt-28 pb-24"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12">

        {/* BREADCRUMB */}
        <div ref={breadcrumbRef} className="flex items-center gap-2 mb-12 font-bebas tracking-widest text-sm">
          <Link to="/" className="text-[var(--brand-gray)] hover:text-white transition-colors">HOME</Link>
          <ChevronRight className="w-3 h-3 text-[var(--brand-gray)]" />
          <Link to={`/artists/${release.artistSlug}`} className="text-[var(--brand-gray)] hover:text-white transition-colors uppercase">{release.artist}</Link>
          <ChevronRight className="w-3 h-3 text-[var(--brand-gray)]" />
          <span className="text-[var(--brand-yellow)] uppercase">{release.title}</span>
        </div>

        {/* HERO — TWO COLUMN */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 mb-24">

          {/* LEFT — Album Art + Player */}
          <div ref={artRef} className="flex flex-col gap-6">
            <div
              className="relative aspect-square overflow-hidden border border-[var(--brand-border)] cursor-zoom-in group/art"
              style={{ boxShadow: "0 0 60px rgba(232,255,0,0.2)" }}
              onClick={() => setLightboxOpen(true)}
              data-testid="album-art"
            >
              <img
                src={`https://picsum.photos/seed/${release.slug}/600/600`}
                alt={release.title}
                className="w-full h-full object-cover brightness-50 group-hover/art:brightness-75 group-hover/art:scale-105 transition-all duration-500"
              />
              <div className="absolute inset-0 flex flex-col items-end justify-start p-4 opacity-0 group-hover/art:opacity-100 transition-opacity duration-300">
                <span className="bg-black/70 border border-[var(--brand-yellow)] text-[var(--brand-yellow)] font-bebas text-sm tracking-widest px-3 py-1 rounded">
                  VIEW FULL SIZE ↗
                </span>
              </div>
              <div className="absolute inset-0 flex items-end p-6">
                <h2 className="font-bebas text-white text-5xl leading-none drop-shadow-2xl">{release.title}</h2>
              </div>
            </div>

            {/* Mini Audio Player (visual only) */}
            <div className="bg-[var(--brand-card)] border border-[var(--brand-border)] rounded-lg p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[var(--brand-white)] font-sans text-sm font-medium truncate max-w-[60%]">
                  {release.tracklist[openTrack]?.name}
                </span>
                <span className="text-[var(--brand-gray)] font-sans text-xs">00:00 / 03:29</span>
              </div>
              {/* Progress bar */}
              <div className="relative h-1 bg-[var(--brand-border)] rounded-full mb-5">
                <div className="absolute left-0 top-0 h-full w-[30%] bg-[var(--brand-yellow)] rounded-full" />
                <div className="absolute top-1/2 left-[30%] -translate-y-1/2 w-3 h-3 bg-[var(--brand-yellow)] rounded-full -translate-x-1/2 shadow-[0_0_6px_rgba(232,255,0,0.8)]" />
              </div>
              <div className="flex items-center justify-center gap-8">
                <button className="text-[var(--brand-yellow)] hover:opacity-70 transition-opacity" data-testid="player-prev">
                  <SkipBack className="w-5 h-5" />
                </button>
                <button
                  className="w-12 h-12 rounded-full border-2 border-[var(--brand-yellow)] flex items-center justify-center text-[var(--brand-yellow)] hover:bg-[var(--brand-yellow)] hover:text-black transition-colors"
                  data-testid="player-play"
                >
                  <Play className="w-5 h-5 ml-0.5" />
                </button>
                <button className="text-[var(--brand-yellow)] hover:opacity-70 transition-opacity" data-testid="player-next">
                  <SkipForward className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT — Release Info */}
          <div>
            <h1 ref={titleRef} className="font-bebas text-white text-6xl md:text-7xl lg:text-8xl leading-none mb-6">
              {release.title}
            </h1>
            <div className="flex flex-wrap gap-2 mb-8">
              {release.genre.map(g => (
                <span key={g} className="bg-[var(--brand-yellow)] text-black font-bebas px-3 py-1 text-sm tracking-widest rounded">
                  {g}
                </span>
              ))}
            </div>
            <p className="text-[var(--brand-gray)] font-sans text-base leading-[1.7] mb-10">
              {release.description}
            </p>

            {/* Metadata */}
            <div ref={metaRef} className="border-t border-[var(--brand-border)] divide-y divide-[var(--brand-border)]">
              {[
                { label: "Label", value: release.label, yellow: true },
                { label: "Artist", value: release.artist, link: `/artists/${release.artistSlug}` },
                { label: "Release Date", value: release.releaseDate },
                { label: "People", value: release.people.join(", ") },
              ].map(({ label, value, yellow, link }) => (
                <div key={label} className="meta-row flex items-start justify-between py-4">
                  <span className="font-sans text-sm text-[#555] uppercase tracking-widest">{label}</span>
                  {link ? (
                    <Link to={link} className="font-sans text-sm text-white hover:text-[var(--brand-yellow)] transition-colors text-right">
                      {value}
                    </Link>
                  ) : (
                    <span className={`font-sans text-sm text-right ${yellow ? "text-[var(--brand-yellow)]" : "text-white"}`}>
                      {value}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* TRACKLIST */}
        <div className="mb-24">
          <h2 className="font-bebas text-white text-3xl tracking-widest mb-8 pl-4 border-l-4 border-[var(--brand-yellow)]">
            TRACKLIST
          </h2>
          <div ref={tracklistRef} className="divide-y divide-[var(--brand-border)] border border-[var(--brand-border)]">
            {release.tracklist.map((track, i) => (
              <div
                key={i}
                className="track-row group flex items-center justify-between px-6 py-5 hover:bg-[#1a1a1a] transition-colors"
                data-testid={`track-row-${i}`}
              >
                <div className="flex items-center gap-5">
                  <span className="font-mono text-[var(--brand-yellow)] text-sm">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="font-sans text-white group-hover:text-[var(--brand-yellow)] transition-colors font-medium">
                    {track.name}
                  </span>
                </div>
                {track.type === "buy" ? (
                  <a
                    href="#"
                    onClick={e => e.preventDefault()}
                    className="font-bebas text-[var(--brand-yellow)] text-sm tracking-widest border border-[var(--brand-yellow)] px-4 py-1.5 rounded-full hover:bg-[var(--brand-yellow)] hover:text-black transition-colors whitespace-nowrap"
                    data-testid={`track-buy-${i}`}
                  >
                    BUY TRACK ↗
                  </a>
                ) : (
                  <button
                    onClick={() => toast("Redirecting to download...", { style: { background: "#161616", color: "#E8FF00", border: "1px solid #222" } })}
                    className="font-bebas text-[#39FF14] text-sm tracking-widest border border-[#39FF14] px-4 py-1.5 rounded-full hover:bg-[#39FF14] hover:text-black transition-colors whitespace-nowrap"
                    data-testid={`track-free-${i}`}
                  >
                    FREE DOWNLOAD ↓
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* AVAILABLE ON */}
        <div className="mb-24">
          <h3 className="font-bebas text-[var(--brand-gray)] text-xl tracking-widest mb-8">AVAILABLE ON</h3>
          <div ref={platformsRef} className="flex flex-wrap gap-4">
            {(Object.entries(release.streamingLinks) as [string, string][]).map(([platform, url]) => {
              const meta = platformIcons[platform];
              if (!meta) return null;
              return (
                <a
                  key={platform}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="platform-icon group flex items-center gap-3 bg-[var(--brand-card)] border border-[var(--brand-border)] hover:border-[var(--brand-yellow)] px-5 py-3 rounded-full transition-all duration-300"
                  style={{ color: meta.color }}
                  data-testid={`platform-${platform}`}
                >
                  <PlatformSVG platform={platform} />
                  <span className="font-bebas tracking-widest text-sm text-white group-hover:text-[var(--brand-yellow)] transition-colors">
                    {meta.label}
                  </span>
                </a>
              );
            })}
          </div>
        </div>

        {/* OFFICIAL VIDEO */}
        <div className="mb-24">
          <h2 className="font-bebas text-white text-3xl tracking-widest mb-8 pl-4 border-l-4 border-[var(--brand-yellow)]">
            OFFICIAL VIDEO
          </h2>
          <div
            ref={videoRef}
            className="relative aspect-video max-w-[900px] mx-auto overflow-hidden border border-[var(--brand-border)] cursor-pointer group"
            onClick={() => window.open(`https://www.youtube.com/watch?v=${release.youtubeId}`, "_blank")}
            data-testid="video-thumbnail"
          >
            <img
              src={`https://picsum.photos/seed/${release.slug}-video/1280/720`}
              alt={release.title}
              className="w-full h-full object-cover brightness-50 group-hover:brightness-75 transition-all duration-500"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-[var(--brand-yellow)]/20 border-2 border-[var(--brand-yellow)] flex items-center justify-center group-hover:scale-110 group-hover:bg-[var(--brand-yellow)] transition-all duration-300">
                <Play className="text-[var(--brand-yellow)] group-hover:text-black w-7 h-7 ml-1" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 to-transparent">
              <p className="font-bebas text-white text-2xl">{release.title}</p>
              <p className="font-bebas text-[var(--brand-yellow)] text-lg">{release.artist}</p>
            </div>
          </div>
          <p className="text-center mt-4">
            <a
              href={`https://www.youtube.com/watch?v=${release.youtubeId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bebas text-[var(--brand-yellow)] text-sm tracking-widest hover:opacity-70 transition-opacity"
            >
              WATCH ON YOUTUBE ↗
            </a>
          </p>
        </div>

        {/* MORE FROM THIS ARTIST */}
        {moreReleases.length > 0 && (
          <div className="mb-24">
            <div className="flex items-end justify-between mb-8">
              <h2 className="font-bebas text-white text-3xl tracking-widest">
                MORE FROM {release.artist.toUpperCase()}
              </h2>
              <Link
                to={`/artists/${release.artistSlug}`}
                className="font-bebas text-[var(--brand-yellow)] text-lg tracking-widest border-b border-[var(--brand-yellow)] pb-1 hover:opacity-70 transition-opacity"
              >
                VIEW ALL RELEASES
              </Link>
            </div>
            <div ref={moreRef} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {moreReleases.map(r => (
                <Link
                  key={r.slug}
                  to={`/releases/${r.slug}`}
                  className="more-card group"
                  data-testid={`more-release-${r.slug}`}
                >
                  <div className="aspect-square overflow-hidden border border-[var(--brand-border)] group-hover:border-[var(--brand-yellow)] group-hover:shadow-[0_0_20px_rgba(232,255,0,0.15)] transition-all duration-300 mb-4">
                    <img
                      src={`https://picsum.photos/seed/${r.slug}/400/400`}
                      alt={r.title}
                      className="w-full h-full object-cover brightness-50 group-hover:brightness-75 group-hover:scale-105 transition-all duration-500"
                    />
                  </div>
                  <h4 className="font-sans text-white font-bold text-lg group-hover:text-[var(--brand-yellow)] transition-colors">{r.title}</h4>
                  <p className="font-sans text-[var(--brand-gray)] text-sm mt-1">{r.releaseDate}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CTA STRIP */}
      <div className="bg-[#111111] border-t border-[var(--brand-border)] px-6 md:px-12 py-16">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div ref={ctaTextRef}>
            <h2 className="font-bebas text-white text-4xl md:text-5xl leading-none">
              WANT TO BOOK {release.artist.toUpperCase()}?
            </h2>
          </div>
          <div ref={ctaBtnRef}>
            <button
              onClick={() => navigate("/booking")}
              className="inline-flex items-center gap-2 px-10 py-4 rounded-full bg-[var(--brand-yellow)] text-black font-bebas text-2xl tracking-widest hover:bg-white transition-colors"
              data-testid="cta-book-now"
            >
              BOOK NOW <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* LIGHTBOX */}
      {lightboxOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/95 backdrop-blur-sm"
          onClick={() => setLightboxOpen(false)}
          data-testid="lightbox-overlay"
        >
          <button
            className="absolute top-6 right-6 w-12 h-12 flex items-center justify-center border border-[var(--brand-yellow)] text-[var(--brand-yellow)] font-bebas text-2xl rounded-full hover:bg-[var(--brand-yellow)] hover:text-black transition-colors z-10"
            onClick={() => setLightboxOpen(false)}
            data-testid="lightbox-close"
          >
            ✕
          </button>
          <motion.img
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            src={`https://picsum.photos/seed/${release.slug}/1200/1200`}
            alt={release.title}
            className="max-w-[90vw] max-h-[90vh] object-contain"
            onClick={e => e.stopPropagation()}
          />
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center pointer-events-none">
            <p className="font-bebas text-white text-2xl tracking-widest">{release.title}</p>
            <p className="font-bebas text-[var(--brand-yellow)] text-lg tracking-widest">{release.artist}</p>
          </div>
        </motion.div>
      )}
    </motion.main>
  );
}
