import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, ExternalLink } from "lucide-react";

type SpotifyRelease = {
  id: string;
  title: string;
  artist: string;
  artistSlug: string;
  type: string;
  releaseDate: string;
  totalTracks: number;
  image: string;
  spotifyUrl: string;
};

export default function SpotifyReleasePage() {
  const { id } = useParams<{ id: string }>();
  const [release, setRelease] = useState<SpotifyRelease | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch("/api/spotify/releases", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        if (!active) return;
        const releases = Array.isArray(data?.releases) ? data.releases : [];
        setRelease(releases.find((item: SpotifyRelease) => item.id === id) ?? null);
      })
      .catch(() => active && setRelease(null))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [id]);

  if (!id) return <Navigate to="/" />;
  if (loading) return <main className="min-h-screen bg-[var(--brand-black)]" />;
  if (!release) return <Navigate to="/not-found" />;

  return (
    <main className="min-h-screen bg-[var(--brand-black)] px-6 pb-24 pt-36 md:px-12">
      <div className="mx-auto max-w-7xl">
        <Link to="/" className="mb-10 inline-flex items-center gap-2 font-bebas tracking-widest text-[var(--brand-gray)] hover:text-[var(--brand-yellow)]">
          <ArrowLeft size={16} /> BACK TO RELEASES
        </Link>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(320px,520px)_1fr] lg:gap-20">
          <div>
            <img src={release.image} alt={release.title} className="aspect-square w-full border border-[var(--brand-border)] object-cover shadow-[0_0_60px_rgba(232,255,0,0.12)]" />
          </div>

          <div className="flex flex-col justify-center">
            <p className="mb-3 font-bebas text-xl tracking-widest text-[var(--brand-yellow)]">{release.type.toUpperCase()}</p>
            <h1 className="font-bebas text-6xl leading-none text-white md:text-8xl">{release.title}</h1>
            <Link to={`/artists/${release.artistSlug}`} className="mt-5 font-bebas text-3xl tracking-widest text-[var(--brand-yellow)] hover:text-white">{release.artist}</Link>
            <div className="my-8 flex flex-wrap gap-5 border-y border-[var(--brand-border)] py-5 font-sans text-sm text-[var(--brand-gray)]">
              <span>{release.releaseDate}</span>
              <span>{release.totalTracks} TRACK{release.totalTracks === 1 ? "" : "S"}</span>
            </div>
            <a href={release.spotifyUrl} target="_blank" rel="noreferrer" className="mb-5 inline-flex items-center gap-2 self-start font-bebas tracking-widest text-[#1DB954] hover:text-white">
              OPEN ON SPOTIFY <ExternalLink size={15} />
            </a>
          </div>
        </div>

        <section className="mt-16">
          <h2 className="mb-6 font-bebas text-3xl tracking-widest text-white">LISTEN TO {release.title}</h2>
          <div className="overflow-hidden rounded-xl border border-[var(--brand-border)] bg-[#121212]">
            <iframe
              title={`${release.title} by ${release.artist}`}
              src={`https://open.spotify.com/embed/album/${release.id}?utm_source=generator&theme=0`}
              width="100%"
              height="480"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              className="block border-0"
            />
          </div>
        </section>
      </div>
    </main>
  );
}
