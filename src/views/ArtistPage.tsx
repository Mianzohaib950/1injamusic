import { useEffect, useRef, useState } from "react";
import { useParams, Navigate, Link } from "react-router-dom";
import { ArrowRight, ShoppingBag } from "lucide-react";
import gsap from "gsap";
import { titleToSlug } from "@/data/releases";
import { getProductsByArtist } from "@/data/merch";
import type { MerchProduct } from "@/data/merch";
import MerchCard from "@/components/MerchCard";
import QuickAddModal from "@/components/QuickAddModal";

const splitText = (text: string) => {
  return text.split("").map((char, index) => (
    <span key={index} className="inline-block opacity-0 translate-y-[60px]">
      {char === " " ? "\u00A0" : char}
    </span>
  ));
};

const ARTIST_DATA = {
  "hintell": {
    name: "HINTELL", 
    genres: ["Dancehall","Hip-Hop","Techno"], 
    bio: "Hintell is a versatile Jamaican artist known for blending Dancehall, Hip-Hop, and electronic sounds. With tracks like Party Time, Die Once, and Bad Bitch, he has established himself as a multi-genre force in the Caribbean music scene. Featured in The Star newspaper as On A Musical Mission.", 
    releases: ["Party Time","Die Once","Sunday Mix","Hypnotic Society","Bad Bitch","Push Start Accelerate"]
  },
  "dark-koko": {
    name: "DARK KOKO", 
    genres: ["Afrobeats","Dancehall"], 
    bio: "Dark Koko brings Afrobeats flair and Dancehall heat to every record. Known for energetic performances and hook-driven tracks like Wangle, Black Barbie, and Portland Love ft. Hintell.", 
    releases: ["Glocks and Mimosas","Portland Love","Wangle","Black Barbie","Dudus","Inevitable"]
  },
  "swazz": {
    name: "SWAZZ", 
    genres: ["Dancehall","Electronic"], 
    bio: "Swazz is the high-energy Dancehall and Electronic crossover artist behind hits like Night Business, Dubai ft. Stylo G, and Club Shake. Known for shutting down venues across Jamaica and international stages.", 
    releases: ["Club Shake","Dubai","Night Business","After Party","Right Thru","Charge"]
  },
  "meesch": {
    name: "MEE$CH", 
    genres: ["Hip-Hop","Trap"], 
    bio: "Mee$ch brings raw Hip-Hop and Trap energy with a Jamaican twist. A rising voice in the 1 Jamaica Music family.", 
    releases: ["Samurai","Yes Please","Bad Bitch"]
  }
};

export default function ArtistPage() {
  const { artist } = useParams<{ artist: string }>();
  const heroRef = useRef<HTMLHeadingElement>(null);
  const [quickProduct, setQuickProduct] = useState<MerchProduct | null>(null);

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
  }, [artist]);

  if (!artist || !(artist in ARTIST_DATA)) {
    return <Navigate to="/not-found" />;
  }

  const data = ARTIST_DATA[artist as keyof typeof ARTIST_DATA];

  return (
    <main className="w-full bg-[var(--brand-black)] min-h-screen">
      
      {/* HERO */}
      <section className="relative h-[80vh] w-full flex items-end pb-24 px-6 md:px-12 border-b border-[var(--brand-border)]">
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center brightness-50"
          style={{ backgroundImage: artist === "hintell" ? `url('/hintell.jpg')` : artist === "dark-koko" ? `url('/dark-koko.jpg')` : artist === "meesch" ? `url('/meesch.jpg')` : artist === "swazz" ? `url('/swazz.jpg')` : `url('https://picsum.photos/seed/${artist}-portrait/1920/1080')` }}
        />
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-[var(--brand-black)] to-transparent" />
        
        <div className="relative z-10 max-w-7xl mx-auto w-full">
          <div className="flex gap-2 flex-wrap mb-6">
            {data.genres.map(g => (
              <span key={g} className="bg-[var(--brand-yellow)] text-black font-bebas px-4 py-1 text-lg tracking-widest rounded-full">
                {g}
              </span>
            ))}
          </div>
          <h1 ref={heroRef} className="text-white text-7xl md:text-[10rem] font-bebas leading-none drop-shadow-2xl">
            {splitText(data.name)}
          </h1>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 md:px-12 py-24 grid grid-cols-1 lg:grid-cols-3 gap-16">
        
        {/* BIO */}
        <div className="lg:col-span-1">
          <span className="inline-block text-[var(--brand-yellow)] font-bebas text-xl tracking-widest mb-6">ABOUT</span>
          <p className="text-[var(--brand-white)] font-sans text-lg leading-relaxed mb-8">
            {data.bio}
          </p>
          <Link 
            to="/booking" 
            className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-[var(--brand-yellow)] text-black font-bebas text-xl tracking-widest hover:bg-white transition-colors"
          >
            BOOK {data.name}
          </Link>
        </div>

        {/* DISCOGRAPHY */}
        <div className="lg:col-span-2">
          <span className="inline-block text-[var(--brand-yellow)] font-bebas text-xl tracking-widest mb-6">DISCOGRAPHY</span>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {data.releases.map((release, i) => (
              <Link key={i} to={`/releases/${titleToSlug(release)}`} className="group" data-testid={`discography-card-${i}`}>
                <div className="aspect-square border border-[var(--brand-border)] group-hover:border-[var(--brand-yellow)] group-hover:shadow-[0_0_20px_rgba(232,255,0,0.15)] mb-4 overflow-hidden transition-all duration-300">
                  <img 
                    src={`https://picsum.photos/seed/${release.replace(/\s+/g, '')}/400/400`} 
                    alt={release}
                    className="w-full h-full object-cover brightness-50 group-hover:brightness-75 group-hover:scale-105 transition-all duration-500"
                  />
                </div>
                <h4 className="text-white font-sans font-bold text-lg leading-tight group-hover:text-[var(--brand-yellow)] transition-colors">{release}</h4>
              </Link>
            ))}
          </div>
        </div>

      </div>

      {/* MERCH */}
      {(() => {
        const artistSlug = artist === "meesch" ? "meesch" : artist!;
        const products = getProductsByArtist(artistSlug);
        if (!products.length) return null;
        return (
          <section className="border-t border-[var(--brand-border)] py-24 px-6 md:px-12 bg-[#0D0D0D]">
            <QuickAddModal product={quickProduct} onClose={() => setQuickProduct(null)} />
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <span className="inline-block text-[var(--brand-yellow)] font-bebas text-xl tracking-widest mb-2">OFFICIAL MERCH</span>
                  <h2 className="text-white font-bebas text-5xl md:text-6xl leading-none">
                    {data.name} COLLECTION
                  </h2>
                </div>
                <a
                  href={`/shop`}
                  onClick={(e) => { e.preventDefault(); window.location.href = '/shop'; }}
                  className="hidden sm:inline-flex items-center gap-2 border border-[var(--brand-yellow)] text-[var(--brand-yellow)] font-bebas tracking-widest px-6 py-2 hover:bg-[var(--brand-yellow)] hover:text-black transition-colors"
                >
                  VIEW ALL <ShoppingBag size={16} />
                </a>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {products.map((product) => (
                  <MerchCard key={product.id} product={product} onQuickAdd={setQuickProduct} />
                ))}
              </div>
            </div>
          </section>
        );
      })()}

      {/* CREATE WITH US */}
      <section className="bg-[var(--brand-card)] border-t border-[var(--brand-border)] py-24 text-center px-6">
        <h2 className="text-white text-5xl md:text-7xl font-bebas mb-6">CREATE WITH {data.name}</h2>
        <p className="text-[var(--brand-gray)] font-sans text-lg max-w-2xl mx-auto mb-12">
          Looking for features, production, or collaborations? Get in touch with our management team.
        </p>
        <a 
          href="mailto:booking@1jamaicamusic.com" 
          className="group inline-flex items-center justify-center gap-2 text-[var(--brand-yellow)] font-bebas text-3xl md:text-4xl tracking-widest hover:opacity-80 transition-opacity"
        >
          booking@1jamaicamusic.com <ArrowRight className="group-hover:translate-x-2 transition-transform" />
        </a>
      </section>

    </main>
  );
}
