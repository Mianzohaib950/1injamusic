export interface MerchProduct {
  id: string;
  name: string;
  artist: string;
  artistSlug: string;
  category: string;
  price: number;
  originalPrice: number | null;
  sizes: string[];
  image: string;
  imageHover: string;
  description: string;
  badge: "NEW" | "LIMITED" | "SALE" | null;
  inStock: boolean;
  stockBySize?: Record<string, number>;
}

const IMG = (id: string, w = 600, h = 600) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&q=80`;

export const merchProducts: MerchProduct[] = [
  // ─── HINTELL ───────────────────────────────────────────
  {
    id: "hintell-logo-tee",
    name: "Hintell Classic Logo Tee",
    artist: "Hintell",
    artistSlug: "hintell",
    category: "tee",
    price: 35,
    originalPrice: null,
    sizes: ["S", "M", "L", "XL", "XXL"],
    image: IMG("1503341504253-dff4815485f1"),
    imageHover: IMG("1583743814966-8936f5b7be1a"),
    description: "Premium heavyweight cotton tee featuring the iconic Hintell logo. Drop-shoulder fit, screen-printed in neon yellow on jet black.",
    badge: "NEW",
    inStock: true
  },
  {
    id: "hintell-party-time-tee",
    name: "Party Time Album Tee",
    artist: "Hintell",
    artistSlug: "hintell",
    category: "tee",
    price: 40,
    originalPrice: null,
    sizes: ["S", "M", "L", "XL"],
    image: IMG("1576566588028-4147f3842f27"),
    imageHover: IMG("1618354691792-d1d42acfd860"),
    description: "Limited edition tee celebrating the Party Time album. Full back print with tracklist, front chest logo.",
    badge: "LIMITED",
    inStock: true
  },
  {
    id: "hintell-hoodie",
    name: "Hintell 1 Jamaica Music Hoodie",
    artist: "Hintell",
    artistSlug: "hintell",
    category: "hoodie",
    price: 75,
    originalPrice: null,
    sizes: ["S", "M", "L", "XL", "XXL"],
    image: IMG("1556821840-3a63f15732ce"),
    imageHover: IMG("1614495600720-3ec50df7b2ab"),
    description: "Heavyweight 400gsm fleece hoodie. Embroidered Hintell × 1 Jamaica Music branding. Kangaroo pocket, ribbed cuffs.",
    badge: "NEW",
    inStock: true
  },
  {
    id: "hintell-snapback",
    name: "Hintell Logo Snapback",
    artist: "Hintell",
    artistSlug: "hintell",
    category: "cap",
    price: 30,
    originalPrice: null,
    sizes: ["One Size"],
    image: IMG("1588850561407-ed78c282e89b"),
    imageHover: IMG("1534215754734-18e55d13e346"),
    description: "Structured 6-panel snapback. Embroidered yellow Hintell logo on black. Flat brim, adjustable snap closure.",
    badge: null,
    inStock: true
  },
  {
    id: "hintell-vinyl",
    name: "Party Time — Limited Yellow Vinyl",
    artist: "Hintell",
    artistSlug: "hintell",
    category: "vinyl",
    price: 55,
    originalPrice: null,
    sizes: ["One Size"],
    image: IMG("1510915361894-db8b60106cb1"),
    imageHover: IMG("1461360370896-922624d12aa1"),
    description: "Exclusive limited pressing of Party Time on 12\" yellow vinyl. Numbered edition of 300. Includes digital download code.",
    badge: "LIMITED",
    inStock: true
  },
  {
    id: "hintell-poster",
    name: "Hintell Tour Poster A2",
    artist: "Hintell",
    artistSlug: "hintell",
    category: "poster",
    price: 20,
    originalPrice: null,
    sizes: ["One Size"],
    image: IMG("1470229722913-7c0e2dbbafd3"),
    imageHover: IMG("1540039155733-5bb30b53aa14"),
    description: "High-quality A2 giclée print. Tour artwork on thick matte paper. Ships in protective tube.",
    badge: "LIMITED",
    inStock: true
  },
  {
    id: "hintell-bundle",
    name: "Hintell Ultimate Bundle",
    artist: "Hintell",
    artistSlug: "hintell",
    category: "bundle",
    price: 120,
    originalPrice: 150,
    sizes: ["M", "L", "XL"],
    image: IMG("1490481651871-ab68de25d43d"),
    imageHover: IMG("1523381210434-271e8329d51f"),
    description: "Classic Logo Tee + 1 Jamaica Music Hoodie + Party Time Yellow Vinyl. Includes signed postcard and exclusive sticker pack.",
    badge: "SALE",
    inStock: true
  },

  // ─── DARK KOKO ─────────────────────────────────────────
  {
    id: "dark-koko-logo-tee",
    name: "Dark Koko Signature Tee",
    artist: "Dark Koko",
    artistSlug: "dark-koko",
    category: "tee",
    price: 35,
    originalPrice: null,
    sizes: ["S", "M", "L", "XL", "XXL"],
    image: IMG("1618354691792-d1d42acfd860"),
    imageHover: IMG("1503341504253-dff4815485f1"),
    description: "Ultra-soft 100% cotton tee with Dark Koko's iconic logo. Oversized cut, double-stitched seams, screen-printed in neon green.",
    badge: "NEW",
    inStock: true
  },
  {
    id: "dark-koko-wangle-tee",
    name: "Wangle Edition Tee",
    artist: "Dark Koko",
    artistSlug: "dark-koko",
    category: "tee",
    price: 40,
    originalPrice: null,
    sizes: ["S", "M", "L", "XL"],
    image: IMG("1583743814966-8936f5b7be1a"),
    imageHover: IMG("1576566588028-4147f3842f27"),
    description: "Inspired by the hit single Wangle. All-over graphic print with vintage wash finish. Relaxed fit, unisex sizing.",
    badge: "LIMITED",
    inStock: true
  },
  {
    id: "dark-koko-hoodie",
    name: "Dark Koko Afro Hoodie",
    artist: "Dark Koko",
    artistSlug: "dark-koko",
    category: "hoodie",
    price: 75,
    originalPrice: null,
    sizes: ["S", "M", "L", "XL", "XXL"],
    image: IMG("1614495600720-3ec50df7b2ab"),
    imageHover: IMG("1556821840-3a63f15732ce"),
    description: "Premium fleece pullover hoodie with Afrobeats-inspired artwork. Embroidered Dark Koko × 1 Jamaica Music logo on chest.",
    badge: null,
    inStock: true
  },
  {
    id: "dark-koko-cap",
    name: "Dark Koko Dad Cap",
    artist: "Dark Koko",
    artistSlug: "dark-koko",
    category: "cap",
    price: 28,
    originalPrice: null,
    sizes: ["One Size"],
    image: IMG("1534215754734-18e55d13e346"),
    imageHover: IMG("1588850561407-ed78c282e89b"),
    description: "Unstructured cotton dad cap. Embroidered Dark Koko monogram on front. Adjustable strap with metal buckle.",
    badge: null,
    inStock: true
  },
  {
    id: "dark-koko-vinyl",
    name: "Glocks & Mimosas — Clear Vinyl",
    artist: "Dark Koko",
    artistSlug: "dark-koko",
    category: "vinyl",
    price: 55,
    originalPrice: null,
    sizes: ["One Size"],
    image: IMG("1461360370896-922624d12aa1"),
    imageHover: IMG("1510915361894-db8b60106cb1"),
    description: "Limited clear vinyl pressing of the debut EP. Gatefold sleeve with exclusive photos. Numbered edition of 200.",
    badge: "LIMITED",
    inStock: true
  },
  {
    id: "dark-koko-poster",
    name: "Dark Koko Tour Poster A2",
    artist: "Dark Koko",
    artistSlug: "dark-koko",
    category: "poster",
    price: 20,
    originalPrice: null,
    sizes: ["One Size"],
    image: IMG("1540039155733-5bb30b53aa14"),
    imageHover: IMG("1470229722913-7c0e2dbbafd3"),
    description: "Bold A2 format tour poster printed on 250gsm matte stock. Limited run. Ships rolled in protective tube.",
    badge: null,
    inStock: true
  },
  {
    id: "dark-koko-bundle",
    name: "Dark Koko Essentials Bundle",
    artist: "Dark Koko",
    artistSlug: "dark-koko",
    category: "bundle",
    price: 105,
    originalPrice: 135,
    sizes: ["M", "L", "XL"],
    image: IMG("1523381210434-271e8329d51f"),
    imageHover: IMG("1490481651871-ab68de25d43d"),
    description: "Signature Tee + Afro Hoodie + Clear Vinyl. Includes signed A5 print and 1 Jamaica Music wristband.",
    badge: "SALE",
    inStock: true
  },

  // ─── SWAZZ ─────────────────────────────────────────────
  {
    id: "swazz-logo-tee",
    name: "Swazz Club Shake Tee",
    artist: "Swazz",
    artistSlug: "swazz",
    category: "tee",
    price: 35,
    originalPrice: null,
    sizes: ["S", "M", "L", "XL", "XXL"],
    image: IMG("1529374255216-f0ef61dde988"),
    imageHover: IMG("1618354691792-d1d42acfd860"),
    description: "Club-ready heavyweight tee. Swazz neon logo printed on the chest. Ribbed crewneck, boxy silhouette.",
    badge: "NEW",
    inStock: true
  },
  {
    id: "swazz-dubai-tee",
    name: "Dubai Collab Tee",
    artist: "Swazz",
    artistSlug: "swazz",
    category: "tee",
    price: 45,
    originalPrice: null,
    sizes: ["S", "M", "L", "XL"],
    image: IMG("1562157873-818bc0726f68"),
    imageHover: IMG("1583743814966-8936f5b7be1a"),
    description: "Swazz × Stylo G Dubai collab edition. Gold foil and screen-print combo. Collector's piece — strictly limited.",
    badge: "LIMITED",
    inStock: true
  },
  {
    id: "swazz-hoodie",
    name: "Swazz Night Business Hoodie",
    artist: "Swazz",
    artistSlug: "swazz",
    category: "hoodie",
    price: 75,
    originalPrice: null,
    sizes: ["S", "M", "L", "XL", "XXL"],
    image: IMG("1509631179647-0177331693ae"),
    imageHover: IMG("1556821840-3a63f15732ce"),
    description: "Night Business edition hoodie. Glow-in-the-dark print on the back. 380gsm fleece, drop-shoulder fit.",
    badge: "NEW",
    inStock: true
  },
  {
    id: "swazz-cap",
    name: "Swazz 5-Panel Cap",
    artist: "Swazz",
    artistSlug: "swazz",
    category: "cap",
    price: 30,
    originalPrice: null,
    sizes: ["One Size"],
    image: IMG("1521369035602-d8b46ebab55b"),
    imageHover: IMG("1534215754734-18e55d13e346"),
    description: "5-panel camp cap with curved brim. Swazz logo embroidered in yellow on front. Nylon shell, strapback.",
    badge: null,
    inStock: true
  },
  {
    id: "swazz-vinyl",
    name: "Club Shake — Green Vinyl 12\"",
    artist: "Swazz",
    artistSlug: "swazz",
    category: "vinyl",
    price: 50,
    originalPrice: null,
    sizes: ["One Size"],
    image: IMG("1487180144351-b8472da7d491"),
    imageHover: IMG("1461360370896-922624d12aa1"),
    description: "Neon green 12\" vinyl of Club Shake. Includes Dubai Remix and 2 B-sides. Hand-numbered, 150 copies only.",
    badge: "LIMITED",
    inStock: true
  },
  {
    id: "swazz-poster",
    name: "Swazz Stage Print A2",
    artist: "Swazz",
    artistSlug: "swazz",
    category: "poster",
    price: 18,
    originalPrice: null,
    sizes: ["One Size"],
    image: IMG("1493225457124-a3eb161ffa5f"),
    imageHover: IMG("1540039155733-5bb30b53aa14"),
    description: "Live stage photography art print. A2, heavy matte paper, museum-quality giclée. Ships in rigid tube.",
    badge: null,
    inStock: true
  },
  {
    id: "swazz-bundle",
    name: "Swazz Night Bundle",
    artist: "Swazz",
    artistSlug: "swazz",
    category: "bundle",
    price: 110,
    originalPrice: 140,
    sizes: ["M", "L", "XL"],
    image: IMG("1490481651871-ab68de25d43d"),
    imageHover: IMG("1523381210434-271e8329d51f"),
    description: "Club Shake Tee + Night Business Hoodie + Green Vinyl. Includes laminated backstage pass replica.",
    badge: "SALE",
    inStock: true
  },

  // ─── MEE$CH ────────────────────────────────────────────
  {
    id: "meesch-logo-tee",
    name: "Mee$ch Trap Tee",
    artist: "Mee$ch",
    artistSlug: "meesch",
    category: "tee",
    price: 35,
    originalPrice: null,
    sizes: ["S", "M", "L", "XL", "XXL"],
    image: IMG("1549062572-119d6e876a32"),
    imageHover: IMG("1529374255216-f0ef61dde988"),
    description: "Raw edge oversized tee. Mee$ch dollar-sign logo on chest, 1 Jamaica Music barcode on sleeve. Pre-washed for vintage feel.",
    badge: "NEW",
    inStock: true
  },
  {
    id: "meesch-samurai-tee",
    name: "Samurai Edition Tee",
    artist: "Mee$ch",
    artistSlug: "meesch",
    category: "tee",
    price: 40,
    originalPrice: null,
    sizes: ["S", "M", "L", "XL"],
    image: IMG("1562157873-818bc0726f68"),
    imageHover: IMG("1549062572-119d6e876a32"),
    description: "Samurai single artwork on the back, full-size. Subtle chest print. Heavyweight 220gsm cotton, boxy cut.",
    badge: "LIMITED",
    inStock: true
  },
  {
    id: "meesch-hoodie",
    name: "Mee$ch Heavyweight Hoodie",
    artist: "Mee$ch",
    artistSlug: "meesch",
    category: "hoodie",
    price: 70,
    originalPrice: null,
    sizes: ["S", "M", "L", "XL", "XXL"],
    image: IMG("1509631179647-0177331693ae"),
    imageHover: IMG("1614495600720-3ec50df7b2ab"),
    description: "400gsm heavyweight hoodie. Mee$ch x 1 Jamaica Music co-branded embroidery. Double-lined hood, kangaroo pocket.",
    badge: null,
    inStock: true
  },
  {
    id: "meesch-cap",
    name: "Mee$ch Trucker Cap",
    artist: "Mee$ch",
    artistSlug: "meesch",
    category: "cap",
    price: 28,
    originalPrice: null,
    sizes: ["One Size"],
    image: IMG("1588850561407-ed78c282e89b"),
    imageHover: IMG("1521369035602-d8b46ebab55b"),
    description: "Foam-front trucker cap. Mee$ch logo patch on front. Mesh back, snapback closure. Unisex.",
    badge: null,
    inStock: true
  },
  {
    id: "meesch-vinyl",
    name: "Samurai — Black & Gold Vinyl",
    artist: "Mee$ch",
    artistSlug: "meesch",
    category: "vinyl",
    price: 50,
    originalPrice: null,
    sizes: ["One Size"],
    image: IMG("1510915361894-db8b60106cb1"),
    imageHover: IMG("1487180144351-b8472da7d491"),
    description: "Debut release on split black and gold vinyl. 10\" format. Includes instrumental on B-side. 100 copies.",
    badge: "LIMITED",
    inStock: true
  },
  {
    id: "meesch-poster",
    name: "Mee$ch Studio Print A2",
    artist: "Mee$ch",
    artistSlug: "meesch",
    category: "poster",
    price: 18,
    originalPrice: null,
    sizes: ["One Size"],
    image: IMG("1493225457124-a3eb161ffa5f"),
    imageHover: IMG("1470229722913-7c0e2dbbafd3"),
    description: "Studio session fine art print. Black and yellow high-contrast photography. A2, matte finish.",
    badge: null,
    inStock: true
  },
  {
    id: "meesch-bundle",
    name: "Mee$ch Starter Bundle",
    artist: "Mee$ch",
    artistSlug: "meesch",
    category: "bundle",
    price: 100,
    originalPrice: 123,
    sizes: ["M", "L", "XL"],
    image: IMG("1523381210434-271e8329d51f"),
    imageHover: IMG("1490481651871-ab68de25d43d"),
    description: "Trap Tee + Heavyweight Hoodie + Samurai Vinyl. Includes hand-signed lyric sheet insert.",
    badge: "SALE",
    inStock: true
  }
];

export const getProductsByArtist = (artistSlug: string) =>
  merchProducts.filter((p) => p.artistSlug === artistSlug);

export const getProductById = (id: string) =>
  merchProducts.find((p) => p.id === id);

export const categories = ["tee", "hoodie", "cap", "vinyl", "poster", "bundle"] as const;
