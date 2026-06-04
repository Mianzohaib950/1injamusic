export interface ArtistProfile {
  slug: string;
  name: string;
  genres: string[];
  bio: string;
  image: string;
  bookingEmail: string;
  active: boolean;
  sortOrder: number;
}

export const artistProfiles: ArtistProfile[] = [
  {
    slug: "hintell",
    name: "HINTELL",
    genres: ["Dancehall", "Hip-Hop", "Techno"],
    bio: "Hintell is a versatile Jamaican artist known for blending Dancehall, Hip-Hop, and electronic sounds.",
    image: "/hintell.jpg",
    bookingEmail: "booking@1jamaicamusic.com",
    active: true,
    sortOrder: 1,
  },
  {
    slug: "dark-koko",
    name: "DARK KOKO",
    genres: ["Afrobeats", "Dancehall"],
    bio: "Dark Koko brings Afrobeats flair and Dancehall heat to every record.",
    image: "/dark-koko.jpg",
    bookingEmail: "booking@1jamaicamusic.com",
    active: true,
    sortOrder: 2,
  },
  {
    slug: "swazz",
    name: "SWAZZ",
    genres: ["Dancehall", "Electronic"],
    bio: "Swazz is the high-energy Dancehall and Electronic crossover artist behind club-ready releases.",
    image: "/swazz.jpg",
    bookingEmail: "booking@1jamaicamusic.com",
    active: true,
    sortOrder: 3,
  },
  {
    slug: "meesch",
    name: "MEE$CH",
    genres: ["Hip-Hop", "Trap"],
    bio: "Mee$ch brings raw Hip-Hop and Trap energy with a Jamaican twist.",
    image: "/meesch.jpg",
    bookingEmail: "booking@1jamaicamusic.com",
    active: true,
    sortOrder: 4,
  },
];
