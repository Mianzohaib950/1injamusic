export interface Track {
  name: string;
  type: "buy" | "free";
}

export interface Release {
  slug: string;
  title: string;
  artist: string;
  artistSlug: string;
  label: string;
  releaseDate: string;
  genre: string[];
  people: string[];
  description: string;
  tracklist: Track[];
  youtubeId: string;
  streamingLinks: {
    spotify: string;
    youtube: string;
    soundcloud: string;
    tidal: string;
    appleMusic: string;
    beatport: string;
  };
}

export const releases: Release[] = [
  {
    slug: "party-time",
    title: "Party Time",
    artist: "Hintell",
    artistSlug: "hintell",
    label: "1 Jamaica Music",
    releaseDate: "October 29, 2021",
    genre: ["Dancehall", "Hip-Hop"],
    people: ["Ibeyi", "Mosberg"],
    description: "Party Time is a high-energy dancehall anthem that captures the essence of Jamaica's nightlife. Hintell delivers raw energy over a hard-hitting production, cementing his place as one of the island's most electrifying performers.",
    tracklist: [
      { name: "Blue Ghost", type: "buy" },
      { name: "Paranoia Overflow", type: "buy" },
      { name: "Last Smile", type: "free" },
      { name: "Altered Song", type: "buy" },
      { name: "Black Hole Sun", type: "free" }
    ],
    youtubeId: "dQw4w9WgXcQ",
    streamingLinks: { spotify: "#", youtube: "#", soundcloud: "#", tidal: "#", appleMusic: "#", beatport: "#" }
  },
  {
    slug: "die-once",
    title: "Die Once",
    artist: "Hintell",
    artistSlug: "hintell",
    label: "1 Jamaica Music",
    releaseDate: "March 15, 2022",
    genre: ["Hip-Hop", "Dark Trap"],
    people: ["Mosberg"],
    description: "Die Once is a cinematic, emotionally charged track where Hintell explores themes of legacy, resilience, and the relentless drive to succeed against all odds.",
    tracklist: [
      { name: "Die Once", type: "buy" },
      { name: "Shadows", type: "buy" },
      { name: "Last Breath", type: "free" }
    ],
    youtubeId: "dQw4w9WgXcQ",
    streamingLinks: { spotify: "#", youtube: "#", soundcloud: "#", tidal: "#", appleMusic: "#", beatport: "#" }
  },
  {
    slug: "night-business",
    title: "Night Business",
    artist: "Swazz",
    artistSlug: "swazz",
    label: "1 Jamaica Music",
    releaseDate: "June 5, 2022",
    genre: ["Dancehall", "Electronic"],
    people: ["Swazz", "1 Jamaica Music Crew"],
    description: "Night Business is Swazz's club-ready banger — pulsing basslines, late-night energy, and a hook that refuses to leave your head. The official music video has become a fan favorite.",
    tracklist: [
      { name: "Night Business", type: "buy" },
      { name: "Night Business (Instrumental)", type: "buy" },
      { name: "Night Business (Extended Mix)", type: "free" }
    ],
    youtubeId: "dQw4w9WgXcQ",
    streamingLinks: { spotify: "#", youtube: "#", soundcloud: "#", tidal: "#", appleMusic: "#", beatport: "#" }
  },
  {
    slug: "dubai",
    title: "Dubai",
    artist: "Swazz ft. Stylo G",
    artistSlug: "swazz",
    label: "1 Jamaica Music",
    releaseDate: "September 10, 2022",
    genre: ["Dancehall"],
    people: ["Swazz", "Stylo G"],
    description: "Dubai is the Swazz and Stylo G crossover hit that took the internet by storm. Massive, infectious, and globally inspired — this is Jamaican music meeting world stages.",
    tracklist: [
      { name: "Dubai", type: "buy" },
      { name: "Dubai (Acoustic)", type: "free" }
    ],
    youtubeId: "dQw4w9WgXcQ",
    streamingLinks: { spotify: "#", youtube: "#", soundcloud: "#", tidal: "#", appleMusic: "#", beatport: "#" }
  },
  {
    slug: "glocks-and-mimosas",
    title: "Glocks and Mimosas",
    artist: "Dark Koko",
    artistSlug: "dark-koko",
    label: "1 Jamaica Music",
    releaseDate: "January 20, 2023",
    genre: ["Afrobeats", "Dancehall"],
    people: ["Dark Koko"],
    description: "Dark Koko blends Afrobeats swagger with Dancehall fire on Glocks and Mimosas — a confident, effortlessly cool track with infectious grooves and sharp lyricism.",
    tracklist: [
      { name: "Glocks and Mimosas", type: "buy" },
      { name: "Glocks and Mimosas (Remix)", type: "buy" }
    ],
    youtubeId: "dQw4w9WgXcQ",
    streamingLinks: { spotify: "#", youtube: "#", soundcloud: "#", tidal: "#", appleMusic: "#", beatport: "#" }
  },
  {
    slug: "portland-love",
    title: "Portland Love",
    artist: "Hintell ft. Dark Koko",
    artistSlug: "hintell",
    label: "1 Jamaica Music",
    releaseDate: "April 3, 2023",
    genre: ["Dancehall"],
    people: ["Hintell", "Dark Koko"],
    description: "Portland Love is a warm, vibrant Dancehall collab between Hintell and Dark Koko — celebrating Caribbean culture, love, and the spirit of Jamaica's Portland parish.",
    tracklist: [
      { name: "Portland Love", type: "buy" },
      { name: "Portland Love (Dub)", type: "free" }
    ],
    youtubeId: "dQw4w9WgXcQ",
    streamingLinks: { spotify: "#", youtube: "#", soundcloud: "#", tidal: "#", appleMusic: "#", beatport: "#" }
  },
  {
    slug: "club-shake",
    title: "Club Shake",
    artist: "Swazz",
    artistSlug: "swazz",
    label: "1 Jamaica Music",
    releaseDate: "July 14, 2023",
    genre: ["Dancehall"],
    people: ["Swazz"],
    description: "Club Shake is exactly what it sounds like — a floor-shaking, speaker-blowing Dancehall anthem built for peak-hour sets and pure crowd energy.",
    tracklist: [
      { name: "Club Shake", type: "buy" },
      { name: "Club Shake (VIP Mix)", type: "buy" }
    ],
    youtubeId: "dQw4w9WgXcQ",
    streamingLinks: { spotify: "#", youtube: "#", soundcloud: "#", tidal: "#", appleMusic: "#", beatport: "#" }
  },
  {
    slug: "sunday-mix",
    title: "Sunday Mix",
    artist: "Hintell",
    artistSlug: "hintell",
    label: "1 Jamaica Music",
    releaseDate: "August 28, 2022",
    genre: ["Techno", "Peak Time"],
    people: ["Hintell", "Ibeyi"],
    description: "Sunday Mix is Hintell stepping into electronic territory — a driving, hypnotic Techno journey that proves his range goes far beyond Dancehall.",
    tracklist: [
      { name: "Sunday Mix", type: "buy" },
      { name: "Sunday Mix (Extended)", type: "free" }
    ],
    youtubeId: "dQw4w9WgXcQ",
    streamingLinks: { spotify: "#", youtube: "#", soundcloud: "#", tidal: "#", appleMusic: "#", beatport: "#" }
  },
  {
    slug: "hypnotic-society",
    title: "Hypnotic Society",
    artist: "Hintell",
    artistSlug: "hintell",
    label: "1 Jamaica Music",
    releaseDate: "November 12, 2022",
    genre: ["Techno", "Driving"],
    people: ["Hintell"],
    description: "Hypnotic Society is a relentless, peak-time techno cut — raw machine energy filtered through Hintell's Caribbean lens. Built for dark rooms and loud speakers.",
    tracklist: [
      { name: "Hypnotic Society", type: "buy" },
      { name: "Hypnotic Society (Club Edit)", type: "free" }
    ],
    youtubeId: "dQw4w9WgXcQ",
    streamingLinks: { spotify: "#", youtube: "#", soundcloud: "#", tidal: "#", appleMusic: "#", beatport: "#" }
  }
];

export function getReleaseBySlug(slug: string): Release | undefined {
  return releases.find(r => r.slug === slug);
}

export function getReleasesByArtist(artistSlug: string, excludeSlug?: string): Release[] {
  return releases.filter(r => r.artistSlug === artistSlug && r.slug !== excludeSlug);
}

export function titleToSlug(title: string): string {
  const map: Record<string, string> = {
    "Party Time": "party-time",
    "Die Once": "die-once",
    "Sunday Mix": "sunday-mix",
    "Hypnotic Society": "hypnotic-society",
    "Club Shake": "club-shake",
    "Dubai ft. Stylo G": "dubai",
    "Dubai": "dubai",
    "Glocks and Mimosas": "glocks-and-mimosas",
    "Portland Love ft. Dark Koko": "portland-love",
    "Portland Love": "portland-love",
    "Night Business": "night-business",
  };
  return map[title] || title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}
