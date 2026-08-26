import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowRight, ChevronRight, Play } from "lucide-react";
import { motion } from "framer-motion";
import { cacheSpotifyReleases, getCachedSpotifyReleases, type SpotifyRelease, type SpotifyReleaseDetail } from "@/lib/spotifyReleaseCache";

function formatDate(value: string) {
  if (!value) return "—";
  const full = value.length === 4 ? `${value}-01-01` : value.length === 7 ? `${value}-01` : value;
  const date = new Date(`${full}T00:00:00`);
  return Number.isNaN(date.valueOf()) ? value : new Intl.DateTimeFormat("en", { year: "numeric", month: "long", day: value.length > 7 ? "numeric" : undefined }).format(date);
}
function formatDuration(ms: number) { const seconds = Math.floor(ms / 1000); return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`; }
function getYouTubeVideoId(value?: string) {
  if (!value) return "";
  try {
    const url = new URL(value);
    if (url.hostname === "youtu.be") return url.pathname.split("/").filter(Boolean)[0] ?? "";
    if (url.hostname.endsWith("youtube.com")) {
      if (url.pathname === "/watch") return url.searchParams.get("v") ?? "";
      const parts = url.pathname.split("/").filter(Boolean);
      if (["embed", "shorts", "live"].includes(parts[0] ?? "")) return parts[1] ?? "";
    }
  } catch { return ""; }
  return "";
}

export default function SpotifyReleasePage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const cached = getCachedSpotifyReleases().find((item) => item.id === id);
  const [release, setRelease] = useState<SpotifyReleaseDetail | null>(null);
  const [summary, setSummary] = useState<SpotifyRelease | null>(cached ?? null);
  const [moreReleases, setMoreReleases] = useState<SpotifyRelease[]>([]);
  const [activeTrackId, setActiveTrackId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true; setLoading(true); setFailed(false); setActiveTrackId(null);
    if (cached?.spotifyEmbedType && cached.spotifyEmbedType !== "album") {
      setFailed(true);
      setLoading(false);
      return () => { active = false; };
    }
    fetch(`/api/spotify/releases/${id}`, { cache: "no-store" })
      .then(async (response) => { if (!response.ok) throw new Error(String(response.status)); return response.json(); })
      .then((data) => { if (!active) return; if (!data?.release) throw new Error(data?.error || "Spotify release unavailable"); setRelease(data.release); setSummary((current) => ({ ...current, ...data.release, videoUrl: current?.videoUrl || data.release.videoUrl, description: current?.description || data.release.description })); setMoreReleases(Array.isArray(data.moreReleases) ? data.moreReleases : []); cacheSpotifyReleases([data.release, ...(data.moreReleases ?? [])]); })
      .catch(() => active && setFailed(true)).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [id]);

  if (!id) return <Navigate to="/" />;
  if (loading && !summary) return <main className="min-h-screen bg-[var(--brand-black)] pt-36 px-6"><div className="mx-auto max-w-7xl animate-pulse"><div className="h-8 w-48 bg-[var(--brand-card)] mb-12" /><div className="aspect-square max-w-xl bg-[var(--brand-card)]" /></div></main>;
  if ((!summary && failed) || (!summary && !loading)) { const fallbackType = searchParams.get("type") === "track" ? "track" : searchParams.get("type") === "playlist" ? "playlist" : "album"; return <main className="min-h-screen bg-[var(--brand-black)] pt-36 px-6 pb-24"><div role="alert" className="mx-auto max-w-3xl border border-[var(--brand-border)] bg-[var(--brand-card)] p-8"><h1 className="font-bebas text-3xl text-white">OFFICIAL SPOTIFY PLAYER</h1><p className="mt-2 mb-6 text-[var(--brand-gray)]">Saved release information is unavailable, but playback remains available here.</p><iframe title="Official Spotify player" src={`https://open.spotify.com/embed/${fallbackType}/${id}?utm_source=generator&theme=0`} width="100%" height={fallbackType === "track" ? 352 : 480} allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" className="block border-0" /><Link to="/" className="mt-6 inline-block font-bebas tracking-widest text-[var(--brand-yellow)]">BACK HOME</Link></div></main>; }
  if (!summary) return null;
  const playerId = activeTrackId || summary.spotifyEmbedId || summary.id;
  const playerType = activeTrackId ? "track" : summary.spotifyEmbedType || "album";
  const youtubeVideoId = getYouTubeVideoId(summary.videoUrl);

  return <motion.main initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full min-h-screen bg-[var(--brand-black)] pt-28 pb-24">
    <div className="max-w-7xl mx-auto px-6 md:px-12">
      <div className="flex items-center gap-2 mb-12 font-bebas tracking-widest text-sm"><Link to="/" className="text-[var(--brand-gray)] hover:text-white">HOME</Link><ChevronRight className="w-3 h-3 text-[var(--brand-gray)]" /><Link to={`/artists/${summary.artistSlug}`} className="text-[var(--brand-gray)] hover:text-white">{summary.artist}</Link><ChevronRight className="w-3 h-3 text-[var(--brand-gray)]" /><span className="text-[var(--brand-yellow)] uppercase">{summary.title}</span></div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 mb-24">
        <div className="flex flex-col gap-6"><div className="aspect-square overflow-hidden border border-[var(--brand-border)]" style={{ boxShadow: "0 0 60px rgba(232,255,0,0.2)" }}><img src={summary.image} alt={`${summary.title} official Spotify artwork`} className="w-full h-full object-cover" /></div><p className="font-sans text-xs text-[var(--brand-gray)]">Metadata and artwork provided by Spotify.</p></div>
        <div><h1 className="font-bebas text-white text-6xl md:text-7xl lg:text-8xl leading-none mb-6">{summary.title}</h1><div className="flex flex-wrap gap-2 mb-8"><span className="bg-[var(--brand-yellow)] text-black font-bebas px-3 py-1 text-sm tracking-widest rounded">{summary.type.toUpperCase()}</span></div><p className="text-[var(--brand-gray)] font-sans text-base leading-[1.7] mb-10">{summary.description || `Official Spotify release by ${summary.artist}. Select any song below to play it here without leaving the website.`}</p>
          <div className="border-t border-[var(--brand-border)] divide-y divide-[var(--brand-border)]">{[["Label", release?.label || "—"], ["Artist", (release?.artists || [summary.artist]).join(", ")], ["Release Date", formatDate(summary.releaseDate)], ["Tracks", String(summary.totalTracks)]].map(([label, value]) => <div key={label} className="flex items-start justify-between py-4"><span className="font-sans text-sm text-[#555] uppercase tracking-widest">{label}</span><span className={`font-sans text-sm text-right ${label === "Label" ? "text-[var(--brand-yellow)]" : "text-white"}`}>{value}</span></div>)}</div>
        </div>
      </div>

      <section className="mb-24"><h2 className="font-bebas text-white text-3xl tracking-widest mb-8 pl-4 border-l-4 border-[var(--brand-yellow)]">TRACKLIST</h2><div className="overflow-hidden rounded-lg border border-[var(--brand-border)] bg-[#121212] mb-6"><iframe key={`${playerType}-${playerId}`} title={`Play ${summary.title}`} src={`https://open.spotify.com/embed/${playerType}/${playerId}?utm_source=generator&theme=0`} width="100%" height={playerType === "track" ? 352 : 480} allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" className="block border-0" /></div><div className="divide-y divide-[var(--brand-border)] border border-[var(--brand-border)]">
        {release?.tracks.map((track, index) => <div key={track.id} className="group flex items-center justify-between gap-4 px-4 md:px-6 py-5 hover:bg-[#1a1a1a] transition-colors"><div className="flex min-w-0 items-center gap-4 md:gap-5"><span className="font-mono text-[var(--brand-yellow)] text-sm">{String(index + 1).padStart(2, "0")}</span><div className="min-w-0"><p className="truncate font-sans text-white font-medium group-hover:text-[var(--brand-yellow)]">{track.name}</p><p className="text-xs text-[var(--brand-gray)]">{track.artists.join(", ")} · {formatDuration(track.durationMs)}</p></div></div><button onClick={() => setActiveTrackId(track.id)} className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[var(--brand-yellow)] px-4 py-1.5 font-bebas text-sm tracking-widest text-[var(--brand-yellow)] hover:bg-[var(--brand-yellow)] hover:text-black"><Play className="w-3.5 h-3.5" /> PLAY TRACK</button></div>)}
        {!release && !failed && <div className="px-6 py-8 text-[var(--brand-gray)]">Loading official Spotify tracklist…</div>}
      </div></section>

      <section className="mb-24"><h3 className="font-bebas text-[var(--brand-gray)] text-xl tracking-widest mb-8">AVAILABLE ON</h3><div className="flex flex-wrap gap-4"><a href={summary.spotifyUrl} target="_blank" rel="noreferrer" className="group flex items-center gap-3 bg-[var(--brand-card)] border border-[var(--brand-border)] hover:border-[var(--brand-yellow)] px-5 py-3 rounded-full transition-all text-[#1DB954]"><svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden="true"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" /></svg><span className="font-bebas tracking-widest text-sm text-white group-hover:text-[var(--brand-yellow)]">SPOTIFY</span></a></div></section>

      {summary.videoUrl && <section className="mb-24"><h2 className="font-bebas text-white text-3xl tracking-widest mb-8 pl-4 border-l-4 border-[var(--brand-yellow)]">OFFICIAL VIDEO</h2><div className="relative mx-auto max-w-[900px] aspect-video overflow-hidden border border-[var(--brand-border)] bg-black">{youtubeVideoId ? <iframe title={`${summary.title} official video`} src={`https://www.youtube.com/embed/${youtubeVideoId}?rel=0&modestbranding=1`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen loading="lazy" className="absolute inset-0 h-full w-full border-0" /> : <video src={summary.videoUrl} controls playsInline preload="metadata" className="absolute inset-0 h-full w-full object-contain" />}</div></section>}

      {moreReleases.length > 0 && <section className="mb-24"><div className="flex items-end justify-between mb-8"><h2 className="font-bebas text-white text-3xl tracking-widest">MORE FROM {summary.artist.toUpperCase()}</h2><Link to={`/artists/${summary.artistSlug}`} className="font-bebas text-[var(--brand-yellow)] text-lg tracking-widest border-b border-[var(--brand-yellow)] pb-1">VIEW ALL RELEASES</Link></div><div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">{moreReleases.slice(0, 3).map((item) => <Link key={item.id} to={`/spotify-releases/${item.id}`} className="group"><div className="aspect-square overflow-hidden border border-[var(--brand-border)] group-hover:border-[var(--brand-yellow)] mb-4"><img src={item.image} alt={`${item.title} official Spotify artwork`} className="w-full h-full object-cover" /></div><h4 className="font-sans text-white font-bold text-lg group-hover:text-[var(--brand-yellow)]">{item.title}</h4><p className="font-bebas text-[var(--brand-yellow)] tracking-widest mt-1">{item.artist}</p><p className="font-sans text-[var(--brand-gray)] text-sm mt-1">{formatDate(item.releaseDate)}</p></Link>)}</div></section>}
    </div>
    <div className="bg-[#111] border-t border-[var(--brand-border)] px-6 md:px-12 py-16"><div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8"><h2 className="font-bebas text-white text-4xl md:text-5xl leading-none">WANT TO BOOK {summary.artist.toUpperCase()}?</h2><button onClick={() => navigate("/booking")} className="inline-flex items-center gap-2 px-10 py-4 rounded-full bg-[var(--brand-yellow)] text-black font-bebas text-2xl tracking-widest hover:bg-white">BOOK NOW <ArrowRight className="w-5 h-5" /></button></div></div>
  </motion.main>;
}
