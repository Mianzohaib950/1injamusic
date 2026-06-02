import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";

const splitText = (text: string) => {
  return text.split("").map((char, index) => (
    <span key={index} className="inline-block opacity-0 translate-y-[60px]">
      {char === " " ? "\u00A0" : char}
    </span>
  ));
};

export default function Artists() {
  const heroRef = useRef<HTMLHeadingElement>(null);

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

  const artistImages: Record<string, string> = {
    "hintell": "/hintell.jpg",
    "dark-koko": "/dark-koko.jpg",
    "meesch": "/meesch.jpg",
    "swazz": "/swazz.jpg",
  };

  const artists = [
    { slug: "hintell", name: "HINTELL", genres: ["Dancehall", "Hip-Hop", "Techno"] },
    { slug: "dark-koko", name: "DARK KOKO", genres: ["Afrobeats", "Dancehall"] },
    { slug: "swazz", name: "SWAZZ", genres: ["Dancehall", "Electronic"] },
    { slug: "meesch", name: "MEE$CH", genres: ["Hip-Hop", "Trap"] },
  ];

  return (
    <main className="w-full bg-[var(--brand-black)] min-h-screen pt-32 pb-24 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        
        <div className="text-center mb-24">
          <h1 ref={heroRef} className="text-white text-7xl md:text-[9rem] font-bebas leading-none mb-6">
            {splitText("OUR ARTISTS")}
          </h1>
          <p className="text-[var(--brand-gray)] font-sans text-xl max-w-2xl mx-auto">
            Representing the sound of Jamaica to the world.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {artists.map((artist) => (
            <Link 
              to={`/artists/${artist.slug}`} 
              key={artist.slug}
              className="group relative block aspect-[16/10] overflow-hidden border border-[var(--brand-border)]"
            >
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105 brightness-50"
                style={{ backgroundImage: `url('${artistImages[artist.slug] ?? `https://picsum.photos/seed/${artist.slug}-landscape/800/500`}')` }}
              />
              
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/70 transition-colors duration-500" />

              <div className="absolute inset-0 p-8 flex flex-col justify-between z-10">
                <div className="flex gap-2 flex-wrap">
                  {artist.genres.map(g => (
                    <span key={g} className="bg-[var(--brand-yellow)] text-black font-bebas px-4 py-1 text-sm tracking-widest rounded-full">
                      {g}
                    </span>
                  ))}
                </div>
                
                <div>
                  <h2 className="text-white text-6xl md:text-8xl font-bebas leading-none mb-2 drop-shadow-xl group-hover:text-[var(--brand-yellow)] transition-colors duration-300">
                    {artist.name}
                  </h2>
                </div>
              </div>

              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                <span className="px-8 py-3 rounded-full border-2 border-[var(--brand-yellow)] text-[var(--brand-yellow)] font-bebas text-2xl tracking-widest bg-black/50 backdrop-blur-sm">
                  VIEW ARTIST
                </span>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </main>
  );
}
