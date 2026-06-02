export interface EventItem {
  id: number;
  slug: string;
  name: string;
  tag: string;
  date: string;
  location: string;
  venue: string;
  description: string;
  longDescription: string;
  artists: string[];
  youtubeId?: string;
  image: string;
}

const IMG = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=800&h=533&fit=crop&q=80`;

export const ALL_EVENTS: EventItem[] = [
  {
    id: 1,
    slug: "biggest-diynamic-festival-2022",
    name: "Biggest Diynamic Festival 2022",
    tag: "festival",
    date: "Aug 12–24 2022",
    location: "Kingston, Jamaica",
    venue: "National Stadium Grounds",
    description: "Official Afterhour",
    longDescription:
      "The Biggest Diynamic Festival returned to Kingston for an extended 12-day run in August 2022. 1 Jamaica Music brought Hintell and Swazz to the main stage, delivering electrifying sets that fused Dancehall, Electronic, and Hip-Hop before packed crowds each night. The official afterhour sessions ran until dawn, cementing the festival as the summer's must-attend event.",
    artists: ["Hintell", "Swazz"],
    image: IMG("1514525253661-33852e893fb4"),
  },
  {
    id: 2,
    slug: "electric-beach-flora-gray-2022",
    name: "Electric Beach at Flora Gray",
    tag: "livestream",
    date: "Sep 27 2022",
    location: "Montego Bay, Jamaica",
    venue: "Flora Gray Beach Club",
    description: "Meth Lee BBCRadio 1",
    longDescription:
      "Electric Beach at Flora Gray was a landmark livestream event broadcast live on BBC Radio 1. Dark Koko headlined an Afrobeats-heavy set to a global online audience while the beachside crowd went wild. The event was streamed to over 40 countries and marked 1 Jamaica Music's first major international broadcast moment.",
    artists: ["Dark Koko"],
    image: IMG("1493225457124-a3eb161ffa5f"),
  },
  {
    id: 3,
    slug: "arena-ten-years-2022",
    name: "Arena — Ten Years and Counting",
    tag: "event",
    date: "Mar 9 2022",
    location: "Kingston, Jamaica",
    venue: "The Arena Kingston",
    description: "Anniversary Showcase",
    longDescription:
      "The Arena celebrated its tenth anniversary with an unforgettable night curated by 1 Jamaica Music. All four label artists — Hintell, Dark Koko, Swazz, and Mee$ch — performed back-to-back sets, giving audiences a rare full-roster showcase. The night closed with a surprise joint performance of 'Portland Love'.",
    artists: ["Hintell", "Dark Koko", "Swazz", "Mee$ch"],
    image: IMG("1540039155733-5bb30b53aa14"),
  },
  {
    id: 4,
    slug: "electric-beach-goa-2022",
    name: "Electric Beach at Goa Beach",
    tag: "djset",
    date: "Nov 18 2022",
    location: "Negril, Jamaica",
    venue: "Goa Beach Club",
    description: "Pete Tong BBCRadio 3",
    longDescription:
      "Swazz delivered a masterclass DJ set at Goa Beach Club, Negril, broadcast live on BBC Radio 3 alongside Pete Tong. Blending his signature Dancehall-Electronic sound with progressive house, the set drew rave reviews from both the beach crowd and international radio listeners.",
    artists: ["Swazz"],
    image: IMG("1571266028743-9ddfab0ca46a"),
  },
  {
    id: 5,
    slug: "intro-festival-2022",
    name: "Intro Festival 2022",
    tag: "studio",
    date: "Dec 30 2022",
    location: "Kingston, Jamaica",
    venue: "Rawtracks Studio, Kingston",
    description: "Official Aftermovie",
    longDescription:
      "The Intro Festival closed out 2022 with an intimate label showcase filmed at the 1 Jamaica Music studio in Kingston. The aftermovie captured behind-the-scenes recording sessions, candid artist moments, and live acoustic performances — offering fans the most personal look yet at the label's creative process.",
    artists: ["Hintell", "Mee$ch"],
    image: IMG("1598488035139-bdbb2231ce04"),
  },
  {
    id: 6,
    slug: "raw-festival-2022",
    name: "Raw Festival 2022",
    tag: "studio",
    date: "Dec 30 2022",
    location: "Kingston, Jamaica",
    venue: "Tuff Gong Studios",
    description: "Official Aftermovie",
    longDescription:
      "Raw Festival 2022 was a celebration of authentic Jamaican sound, recorded live at the iconic Tuff Gong Studios. Dark Koko and Hintell led the session with raw, unfiltered performances that stripped back production to spotlight pure musicality. The official aftermovie became one of the most-shared music videos from the label that year.",
    artists: ["Dark Koko", "Hintell"],
    image: IMG("1520523839897-8116b40ee4db"),
  },
  {
    id: 7,
    slug: "spike-island-reunion-2022",
    name: "Spike Island Reunion",
    tag: "festival",
    date: "Aug 12–16 2022",
    location: "Manchester, UK",
    venue: "Spike Island",
    description: "International Festival",
    longDescription:
      "1 Jamaica Music made its UK festival debut at the legendary Spike Island Reunion. Swazz closed the main stage on the final night to a crowd of 20,000, receiving a standing ovation for his high-energy Dancehall-Electronic set. The performance opened doors for the label's European touring ambitions.",
    artists: ["Swazz"],
    image: IMG("1470229722913-7c0e2dbbafd3"),
  },
  {
    id: 8,
    slug: "electric-eclectic-2022",
    name: "Electric Eclectic Event 2022",
    tag: "livestream",
    date: "Sep 30 2022",
    location: "Online / Kingston, Jamaica",
    venue: "Digital Stage",
    description: "Global Livestream",
    longDescription:
      "Electric Eclectic 2022 was a fully digital event that streamed live to audiences across the world. Mee$ch delivered a 45-minute Hip-Hop and Trap set that drew record-breaking viewer numbers for a Caribbean livestream event. The chat exploded with fans from the US, UK, and West Africa.",
    artists: ["Mee$ch"],
    image: IMG("1501281668745-7bba8ddd27b4"),
  },
  {
    id: 9,
    slug: "fifth-world-live-2022",
    name: "Fifth World Live — Reggie House",
    tag: "event",
    date: "May 10 2022",
    location: "Kingston, Jamaica",
    venue: "Reggie House",
    description: "Intimate Showcase",
    longDescription:
      "Fifth World Live at Reggie House was an intimate 300-capacity showcase that became the talk of Kingston. All four 1 Jamaica Music artists performed stripped-down sets in one of the city's most storied venues. Hintell debuted 'Bad Bitch' live for the first time, and the crowd reaction was electric.",
    artists: ["Hintell", "Dark Koko", "Swazz", "Mee$ch"],
    image: IMG("1429962824592-700b1e6db02d"),
  },
];
