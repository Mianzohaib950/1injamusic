create table if not exists users (
  id text primary key,
  email text not null unique,
  name text not null,
  phone text not null,
  password_hash text not null,
  role text not null default 'user',
  created_at timestamp not null default now()
);

create table if not exists addresses (
  id text primary key,
  user_id text not null,
  label text not null,
  first_name text not null,
  last_name text not null,
  address text not null,
  city text not null,
  state text not null,
  zip text not null,
  country text not null,
  is_default boolean not null default false,
  created_at timestamp not null default now()
);

create table if not exists products (
  id text primary key,
  name text not null,
  artist text not null,
  artist_slug text not null,
  category text not null,
  price integer not null,
  original_price integer,
  image text not null,
  image_hover text not null,
  description text not null,
  badge text,
  sizes jsonb not null default '["One Size"]'::jsonb,
  in_stock boolean not null default true,
  created_at timestamp not null default now()
);

alter table products add column if not exists sizes jsonb not null default '["One Size"]'::jsonb;

create table if not exists artists (
  slug text primary key,
  name text not null,
  genres jsonb not null default '[]'::jsonb,
  bio text not null default '',
  image text not null default '',
  booking_email text not null default 'booking@1jamaicamusic.com',
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamp not null default now(),
  updated_at timestamp not null default now()
);

create table if not exists categories (
  slug text primary key,
  name text not null,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamp not null default now(),
  updated_at timestamp not null default now()
);

create table if not exists bookings (
  id text primary key,
  name text not null,
  email text not null,
  phone text not null,
  artist text not null,
  event_type text not null,
  event_date text not null,
  message text not null,
  status text not null default 'New',
  created_at timestamp not null default now(),
  updated_at timestamp not null default now()
);

create table if not exists event_contacts (
  id text primary key,
  name text not null,
  email text not null,
  phone text not null,
  artist text not null,
  event_type text not null,
  event_date text not null,
  message text not null,
  status text not null default 'New',
  created_at timestamp not null default now(),
  updated_at timestamp not null default now()
);

create table if not exists orders (
  id text primary key,
  user_id text not null,
  status text not null default 'Pending',
  subtotal_cents integer not null,
  shipping_cents integer not null,
  tax_cents integer not null,
  total_cents integer not null,
  stripe_payment_intent_id text not null unique,
  first_name text not null,
  last_name text not null,
  address text not null,
  city text not null,
  state text not null,
  zip text not null,
  country text not null,
  created_at timestamp not null default now()
);

create table if not exists order_items (
  id text primary key,
  order_id text not null,
  product_id text not null,
  name text not null,
  artist text not null,
  price integer not null,
  image text not null,
  size text not null,
  quantity integer not null
);

create table if not exists wishlists (
  id text primary key,
  user_id text not null,
  product_id text not null,
  created_at timestamp not null default now(),
  unique (user_id, product_id)
);

create table if not exists cms_pages (
  id text primary key,
  page_key text not null unique,
  title text not null default '',
  active boolean not null default true,
  created_at timestamp not null default now(),
  updated_at timestamp not null default now()
);

create table if not exists cms_sections (
  id text primary key,
  page_id text not null,
  section_key text not null,
  section_type text not null,
  title text not null default '',
  subtitle text not null default '',
  body text not null default '',
  image_url text not null default '',
  video_url text not null default '',
  cta_label text not null default '',
  cta_url text not null default '',
  settings jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamp not null default now(),
  updated_at timestamp not null default now(),
  unique (page_id, section_key)
);

create table if not exists cms_section_items (
  id text primary key,
  section_id text not null,
  item_key text not null default '',
  title text not null default '',
  subtitle text not null default '',
  description text not null default '',
  image_url text not null default '',
  video_url text not null default '',
  link_label text not null default '',
  link_url text not null default '',
  tags jsonb not null default '[]'::jsonb,
  meta jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamp not null default now(),
  updated_at timestamp not null default now()
);

drop table if exists advertisements;

create index if not exists addresses_user_id_idx on addresses (user_id);
create index if not exists artists_active_idx on artists (active);
create index if not exists bookings_status_idx on bookings (status);
create index if not exists event_contacts_status_idx on event_contacts (status);
create index if not exists orders_user_id_idx on orders (user_id);
create index if not exists order_items_order_id_idx on order_items (order_id);
create index if not exists wishlists_user_id_idx on wishlists (user_id);
create index if not exists wishlists_product_id_idx on wishlists (product_id);
create index if not exists categories_sort_idx on categories (sort_order, name);

insert into categories (slug, name, active, sort_order)
values
  ('tee', 'Tee', true, 1),
  ('hoodie', 'Hoodie', true, 2),
  ('cap', 'Cap', true, 3),
  ('vinyl', 'Vinyl', true, 4),
  ('poster', 'Poster', true, 5),
  ('bundle', 'Bundle', true, 6)
on conflict (slug) do nothing;
create index if not exists cms_pages_page_key_idx on cms_pages (page_key);
create index if not exists cms_sections_page_id_idx on cms_sections (page_id);
create index if not exists cms_sections_sort_idx on cms_sections (page_id, sort_order);
create index if not exists cms_items_section_id_idx on cms_section_items (section_id);
create index if not exists cms_items_sort_idx on cms_section_items (section_id, sort_order);

insert into cms_pages (id, page_key, title, active)
values
  ('home-page', 'home', 'Home Page', true),
  ('artists-page', 'artists', 'Artists Page', true),
  ('shop-page', 'shop', 'Shop Page', true),
  ('events-page', 'events', 'Events & Contact Page', true),
  ('booking-page', 'booking', 'Booking Page', true)
on conflict (page_key) do nothing;

insert into cms_sections (id, page_id, section_key, section_type, title, subtitle, body, sort_order, active)
values
  ('home-hero', 'home-page', 'hero', 'hero', 'WE COLLABORATE', 'WITH AMBITIOUS DJS AND PRODUCERS.', 'Booking world-renowned and rising music artists, DJs, and producers out of Jamaica.', 1, true),
  ('home-marquee', 'home-page', 'marquee', 'marquee', '1 JAMAICA MUSIC', '', 'LET''S CREATE SOMETHING GREAT TOGETHER', 2, true),
  ('home-what-we-do', 'home-page', 'what_we_do', 'content', 'WHAT WE DO', '', 'WE COLLABORATE WITH AMBITIOUS DJS AND PRODUCERS. LET''S MAKE SOMETHING GREAT TOGETHER.', 3, true),
  ('home-artists-preview', 'home-page', 'artists_preview', 'list', 'OUR ARTISTS', '', '', 4, true),
  ('home-new-drops', 'home-page', 'new_drops', 'list', 'NEW DROPS', '', '', 5, true),
  ('home-featured-video', 'home-page', 'featured_video', 'video', 'LATEST VIDEO', '', '', 6, true),
  ('home-album-gallery', 'home-page', 'album_gallery', 'gallery', 'ALBUM ART', '', '', 7, true),
  ('home-community', 'home-page', 'community', 'gallery', 'COMMUNITY', '', '', 8, true),
  ('home-collaborate', 'home-page', 'collaborate', 'content', 'WE COLLABORATE WITH NEW RISING DJs', '', 'Our team is always on the lookout for new rising producers and fresh artists to join the 1 Jamaica Music family.', 9, true),
  ('home-footer', 'home-page', 'footer', 'footer', '1 JAMAICA MUSIC', '', '', 10, true),
  ('artists-hero', 'artists-page', 'hero', 'hero', 'OUR ARTISTS', '', 'Representing the sound of Jamaica to the world.', 1, true),
  ('artists-content', 'artists-page', 'content', 'content', 'OUR ARTISTS', '', 'Discover the full lineup.', 2, true),
  ('shop-hero', 'shop-page', 'hero', 'hero', 'OFFICIAL MERCH SHOP', '', 'Exclusive drops from Hintell, Dark Koko, Swazz and Mee$ch. Represent the movement.', 1, true),
  ('shop-content', 'shop-page', 'content', 'content', 'NEW DROPS EVERY MONTH', '', 'Follow 1 Jamaica Music on Instagram for first access to limited drops and exclusive bundles.', 2, true),
  ('events-hero', 'events-page', 'hero', 'hero', 'EVENTS & CONTACT', '', 'Book events and contact us.', 1, true),
  ('events-content', 'events-page', 'content', 'content', 'UPCOMING & PAST EVENTS', '', 'Share your event requirements.', 2, true),
  ('booking-hero', 'booking-page', 'hero', 'hero', 'BOOK AN ARTIST', '', 'From club nights to international festivals we make it happen.', 1, true),
  ('booking-content', 'booking-page', 'content', 'content', 'BOOKING REQUEST', '', 'All fields are required. Please provide as much detail as possible about your event.', 2, true)
on conflict (id) do nothing;

insert into cms_section_items (id, section_id, item_key, title, subtitle, description, image_url, link_url, sort_order, active, meta)
values
  ('home-artist-hintell', 'home-artists-preview', 'hintell', 'HINTELL', 'ROSTER', '', '/hintell.jpg', '/artists/hintell', 1, true, '{}'::jsonb),
  ('home-artist-dark-koko', 'home-artists-preview', 'dark-koko', 'DARK KOKO', 'ROSTER', '', '/dark-koko.jpg', '/artists/dark-koko', 2, true, '{}'::jsonb),
  ('home-artist-swazz', 'home-artists-preview', 'swazz', 'SWAZZ', 'ROSTER', '', '/swazz.jpg', '/artists/swazz', 3, true, '{}'::jsonb),
  ('home-artist-meesch', 'home-artists-preview', 'meesch', 'MEE$CH', 'ROSTER', '', '/meesch-home.jpg', '/artists/meesch', 4, true, '{}'::jsonb),
  ('home-drop-party-time', 'home-new-drops', 'party-time', 'Party Time', 'Hintell', 'Dancehall', '/album-push-start.jpg', '/releases/party-time', 1, true, '{}'::jsonb),
  ('home-drop-die-once', 'home-new-drops', 'die-once', 'Die Once', 'Hintell', 'Hip-Hop', '/album-new-wave.jpg', '/releases/die-once', 2, true, '{}'::jsonb),
  ('home-drop-sunday-mix', 'home-new-drops', 'sunday-mix', 'Sunday Mix', 'Hintell', 'Techno/Peak Time', '/album-hot-hintell.jpg', '/releases/sunday-mix', 3, true, '{}'::jsonb),
  ('home-drop-hypnotic-society', 'home-new-drops', 'hypnotic-society', 'Hypnotic Society', 'Hintell', 'Techno/Driving', '/album-inevitable.jpg', '/releases/hypnotic-society', 4, true, '{}'::jsonb),
  ('home-drop-club-shake', 'home-new-drops', 'club-shake', 'Club Shake', 'Swazz', 'Dancehall', '/album-night-business.jpg', '/releases/club-shake', 5, true, '{}'::jsonb),
  ('home-drop-dubai', 'home-new-drops', 'dubai', 'Dubai ft. Stylo G', 'Swazz', 'Dancehall', '/album-dudus.jpg', '/releases/dubai-ft-stylo-g', 6, true, '{}'::jsonb),
  ('home-drop-glocks', 'home-new-drops', 'glocks-and-mimosas', 'Glocks and Mimosas', 'Dark Koko', 'Afrobeats', '/album-hangle.jpg', '/releases/glocks-and-mimosas', 7, true, '{}'::jsonb),
  ('home-drop-portland-love', 'home-new-drops', 'portland-love', 'Portland Love ft. Dark Koko', 'Hintell', 'Dancehall', '/album-black-barbie.jpg', '/releases/portland-love-ft-dark-koko', 8, true, '{}'::jsonb),
  ('home-album-push-start', 'home-album-gallery', 'album-push-start', 'Push Start Accelerate', '', '', '/album-push-start.jpg', '', 1, true, '{"row":1}'::jsonb),
  ('home-album-new-wave', 'home-album-gallery', 'album-new-wave', 'New Wave', '', '', '/album-new-wave.jpg', '', 2, true, '{"row":1}'::jsonb),
  ('home-album-inevitable', 'home-album-gallery', 'album-inevitable', 'Inevitable', '', '', '/album-inevitable.jpg', '', 3, true, '{"row":1}'::jsonb),
  ('home-album-hot-hintell', 'home-album-gallery', 'album-hot-hintell', 'HOT - Hintell', '', '', '/album-hot-hintell.jpg', '', 4, true, '{"row":1}'::jsonb),
  ('home-album-price-up', 'home-album-gallery', 'album-price-gone-up', 'Price Gone Up', '', '', '/album-price-gone-up.jpg', '', 5, true, '{"row":2}'::jsonb),
  ('home-album-dudus', 'home-album-gallery', 'album-dudus', 'Dudus', '', '', '/album-dudus.jpg', '', 6, true, '{"row":2}'::jsonb),
  ('home-album-night-business', 'home-album-gallery', 'album-night-business', 'Night Business', '', '', '/album-night-business.jpg', '', 7, true, '{"row":2}'::jsonb),
  ('home-album-hot-darkkoko', 'home-album-gallery', 'album-hot-darkkoko', 'HOT - Dark Koko', '', '', '/album-hot-darkkoko.jpg', '', 8, true, '{"row":2}'::jsonb),
  ('home-community-1', 'home-community', 'community-1', '', '', '', '/comm-1.jpg', '', 1, true, '{}'::jsonb),
  ('home-community-2', 'home-community', 'community-2', '', '', '', '/comm-2.jpg', '', 2, true, '{}'::jsonb),
  ('home-community-3', 'home-community', 'community-3', '', '', '', '/comm-3.jpg', '', 3, true, '{}'::jsonb),
  ('home-community-4', 'home-community', 'community-4', '', '', '', '/comm-4.jpg', '', 4, true, '{}'::jsonb),
  ('home-community-5', 'home-community', 'community-5', '', '', '', '/comm-5.jpg', '', 5, true, '{}'::jsonb),
  ('home-community-6', 'home-community', 'community-6', '', '', '', '/comm-6.jpg', '', 6, true, '{}'::jsonb),
  ('home-community-7', 'home-community', 'community-7', '', '', '', '/comm-7.jpg', '', 7, true, '{}'::jsonb),
  ('home-community-8', 'home-community', 'community-8', '', '', '', '/comm-8.jpg', '', 8, true, '{}'::jsonb),
  ('home-community-9', 'home-community', 'community-9', '', '', '', '/comm-9.jpg', '', 9, true, '{}'::jsonb),
  ('home-footer-contact-booking', 'home-footer', 'contact-booking', 'Booking World Wide', '', '', '', 'mailto:booking@1jamaicamusic.com', 1, true, '{}'::jsonb),
  ('home-footer-contact-demos', 'home-footer', 'contact-demos', 'Demo Publishing', '', '', '', 'mailto:demos@1jamaicamusic.com', 2, true, '{}'::jsonb),
  ('home-footer-contact-licensing', 'home-footer', 'contact-licensing', 'Music Licencing', '', '', '', 'mailto:licensing@1jamaicamusic.com', 3, true, '{}'::jsonb),
  ('home-footer-social-instagram', 'home-footer', 'social-instagram', 'Instagram', '', '', '', '#', 4, true, '{}'::jsonb),
  ('home-footer-social-twitter', 'home-footer', 'social-twitter', 'Twitter', '', '', '', '#', 5, true, '{}'::jsonb),
  ('home-footer-social-facebook', 'home-footer', 'social-facebook', 'Facebook', '', '', '', '#', 6, true, '{}'::jsonb),
  ('home-footer-social-youtube', 'home-footer', 'social-youtube', 'YouTube', '', '', '', '#', 7, true, '{}'::jsonb),
  ('home-footer-social-music', 'home-footer', 'social-music', 'Music', '', '', '', '#', 8, true, '{}'::jsonb)
on conflict (id) do nothing;

insert into cms_section_items (id, section_id, item_key, title, subtitle, description, image_url, link_url, tags, sort_order, active, meta)
values
  ('events-item-biggest-diynamic-festival-2022', 'events-content', 'biggest-diynamic-festival-2022', 'Biggest Diynamic Festival 2022', 'Aug 12-24 2022', 'Official Afterhour', 'https://images.unsplash.com/photo-1514525253661-33852e893fb4?w=800&h=533&fit=crop&q=80', '/events/biggest-diynamic-festival-2022', '["festival"]'::jsonb, 1, true, '{}'::jsonb),
  ('events-item-electric-beach-flora-gray-2022', 'events-content', 'electric-beach-flora-gray-2022', 'Electric Beach at Flora Gray', 'Sep 27 2022', 'Meth Lee BBCRadio 1', 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=533&fit=crop&q=80', '/events/electric-beach-flora-gray-2022', '["livestream"]'::jsonb, 2, true, '{}'::jsonb),
  ('events-item-arena-ten-years-2022', 'events-content', 'arena-ten-years-2022', 'Arena - Ten Years and Counting', 'Mar 9 2022', 'Anniversary Showcase', 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&h=533&fit=crop&q=80', '/events/arena-ten-years-2022', '["event"]'::jsonb, 3, true, '{}'::jsonb),
  ('events-item-electric-beach-goa-2022', 'events-content', 'electric-beach-goa-2022', 'Electric Beach at Goa Beach', 'Nov 18 2022', 'Pete Tong BBCRadio 3', 'https://images.unsplash.com/photo-1571266028743-9ddfab0ca46a?w=800&h=533&fit=crop&q=80', '/events/electric-beach-goa-2022', '["djset"]'::jsonb, 4, true, '{}'::jsonb),
  ('events-item-intro-festival-2022', 'events-content', 'intro-festival-2022', 'Intro Festival 2022', 'Dec 30 2022', 'Official Aftermovie', 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&h=533&fit=crop&q=80', '/events/intro-festival-2022', '["studio"]'::jsonb, 5, true, '{}'::jsonb),
  ('events-item-raw-festival-2022', 'events-content', 'raw-festival-2022', 'Raw Festival 2022', 'Dec 30 2022', 'Official Aftermovie', 'https://images.unsplash.com/photo-1520523839897-8116b40ee4db?w=800&h=533&fit=crop&q=80', '/events/raw-festival-2022', '["studio"]'::jsonb, 6, true, '{}'::jsonb),
  ('events-item-spike-island-reunion-2022', 'events-content', 'spike-island-reunion-2022', 'Spike Island Reunion', 'Aug 12-16 2022', 'International Festival', 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=533&fit=crop&q=80', '/events/spike-island-reunion-2022', '["festival"]'::jsonb, 7, true, '{}'::jsonb),
  ('events-item-electric-eclectic-2022', 'events-content', 'electric-eclectic-2022', 'Electric Eclectic Event 2022', 'Sep 30 2022', 'Global Livestream', 'https://images.unsplash.com/photo-1501281668745-7bba8ddd27b4?w=800&h=533&fit=crop&q=80', '/events/electric-eclectic-2022', '["livestream"]'::jsonb, 8, true, '{}'::jsonb),
  ('events-item-fifth-world-live-2022', 'events-content', 'fifth-world-live-2022', 'Fifth World Live - Reggie House', 'May 10 2022', 'Intimate Showcase', 'https://images.unsplash.com/photo-1429962824592-700b1e6db02d?w=800&h=533&fit=crop&q=80', '/events/fifth-world-live-2022', '["event"]'::jsonb, 9, true, '{}'::jsonb)
on conflict (id) do nothing;

insert into products (id, name, artist, artist_slug, category, price, original_price, image, image_hover, description, badge, sizes, in_stock)
values
  ('hintell-logo-tee', 'Hintell Classic Logo Tee', 'Hintell', 'hintell', 'tee', 35, null, 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=600&h=600&fit=crop&q=80', 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&h=600&fit=crop&q=80', 'Premium heavyweight cotton tee featuring the iconic Hintell logo. Drop-shoulder fit, screen-printed in neon yellow on jet black.', 'NEW', '["S","M","L","XL","XXL"]'::jsonb, true),
  ('hintell-party-time-tee', 'Party Time Album Tee', 'Hintell', 'hintell', 'tee', 40, null, 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&h=600&fit=crop&q=80', 'https://images.unsplash.com/photo-1618354691792-d1d42acfd860?w=600&h=600&fit=crop&q=80', 'Limited edition tee celebrating the Party Time album. Full back print with tracklist, front chest logo.', 'LIMITED', '["S","M","L","XL"]'::jsonb, true),
  ('hintell-hoodie', 'Hintell 1 Jamaica Music Hoodie', 'Hintell', 'hintell', 'hoodie', 75, null, 'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=600&h=600&fit=crop&q=80', 'https://images.unsplash.com/photo-1614495600720-3ec50df7b2ab?w=600&h=600&fit=crop&q=80', 'Heavyweight 400gsm fleece hoodie. Embroidered Hintell Ã— 1 Jamaica Music branding. Kangaroo pocket, ribbed cuffs.', 'NEW', '["S","M","L","XL","XXL"]'::jsonb, true),
  ('hintell-snapback', 'Hintell Logo Snapback', 'Hintell', 'hintell', 'cap', 30, null, 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600&h=600&fit=crop&q=80', 'https://images.unsplash.com/photo-1534215754734-18e55d13e346?w=600&h=600&fit=crop&q=80', 'Structured 6-panel snapback. Embroidered yellow Hintell logo on black. Flat brim, adjustable snap closure.', null, '["One Size"]'::jsonb, true),
  ('hintell-vinyl', 'Party Time â€” Limited Yellow Vinyl', 'Hintell', 'hintell', 'vinyl', 55, null, 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=600&h=600&fit=crop&q=80', 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=600&h=600&fit=crop&q=80', 'Exclusive limited pressing of Party Time on 12" yellow vinyl. Numbered edition of 300. Includes digital download code.', 'LIMITED', '["One Size"]'::jsonb, true),
  ('hintell-poster', 'Hintell Tour Poster A2', 'Hintell', 'hintell', 'poster', 20, null, 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600&h=600&fit=crop&q=80', 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=600&h=600&fit=crop&q=80', 'High-quality A2 giclÃ©e print. Tour artwork on thick matte paper. Ships in protective tube.', 'LIMITED', '["One Size"]'::jsonb, true),
  ('hintell-bundle', 'Hintell Ultimate Bundle', 'Hintell', 'hintell', 'bundle', 120, 150, 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&h=600&fit=crop&q=80', 'https://images.unsplash.com/photo-1523381210434-271e8329d51f?w=600&h=600&fit=crop&q=80', 'Classic Logo Tee + 1 Jamaica Music Hoodie + Party Time Yellow Vinyl. Includes signed postcard and exclusive sticker pack.', 'SALE', '["M","L","XL"]'::jsonb, true),
  ('dark-koko-logo-tee', 'Dark Koko Signature Tee', 'Dark Koko', 'dark-koko', 'tee', 35, null, 'https://images.unsplash.com/photo-1618354691792-d1d42acfd860?w=600&h=600&fit=crop&q=80', 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=600&h=600&fit=crop&q=80', 'Ultra-soft 100% cotton tee with Dark Koko''s iconic logo. Oversized cut, double-stitched seams, screen-printed in neon green.', 'NEW', '["S","M","L","XL","XXL"]'::jsonb, true),
  ('dark-koko-wangle-tee', 'Wangle Edition Tee', 'Dark Koko', 'dark-koko', 'tee', 40, null, 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&h=600&fit=crop&q=80', 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&h=600&fit=crop&q=80', 'Inspired by the hit single Wangle. All-over graphic print with vintage wash finish. Relaxed fit, unisex sizing.', 'LIMITED', '["S","M","L","XL"]'::jsonb, true),
  ('dark-koko-hoodie', 'Dark Koko Afro Hoodie', 'Dark Koko', 'dark-koko', 'hoodie', 75, null, 'https://images.unsplash.com/photo-1614495600720-3ec50df7b2ab?w=600&h=600&fit=crop&q=80', 'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=600&h=600&fit=crop&q=80', 'Premium fleece pullover hoodie with Afrobeats-inspired artwork. Embroidered Dark Koko Ã— 1 Jamaica Music logo on chest.', null, '["S","M","L","XL","XXL"]'::jsonb, true),
  ('dark-koko-cap', 'Dark Koko Dad Cap', 'Dark Koko', 'dark-koko', 'cap', 28, null, 'https://images.unsplash.com/photo-1534215754734-18e55d13e346?w=600&h=600&fit=crop&q=80', 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600&h=600&fit=crop&q=80', 'Unstructured cotton dad cap. Embroidered Dark Koko monogram on front. Adjustable strap with metal buckle.', null, '["One Size"]'::jsonb, true),
  ('dark-koko-vinyl', 'Glocks & Mimosas â€” Clear Vinyl', 'Dark Koko', 'dark-koko', 'vinyl', 55, null, 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=600&h=600&fit=crop&q=80', 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=600&h=600&fit=crop&q=80', 'Limited clear vinyl pressing of the debut EP. Gatefold sleeve with exclusive photos. Numbered edition of 200.', 'LIMITED', '["One Size"]'::jsonb, true),
  ('dark-koko-poster', 'Dark Koko Tour Poster A2', 'Dark Koko', 'dark-koko', 'poster', 20, null, 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=600&h=600&fit=crop&q=80', 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600&h=600&fit=crop&q=80', 'Bold A2 format tour poster printed on 250gsm matte stock. Limited run. Ships rolled in protective tube.', null, '["One Size"]'::jsonb, true),
  ('dark-koko-bundle', 'Dark Koko Essentials Bundle', 'Dark Koko', 'dark-koko', 'bundle', 105, 135, 'https://images.unsplash.com/photo-1523381210434-271e8329d51f?w=600&h=600&fit=crop&q=80', 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&h=600&fit=crop&q=80', 'Signature Tee + Afro Hoodie + Clear Vinyl. Includes signed A5 print and 1 Jamaica Music wristband.', 'SALE', '["M","L","XL"]'::jsonb, true),
  ('swazz-logo-tee', 'Swazz Club Shake Tee', 'Swazz', 'swazz', 'tee', 35, null, 'https://images.unsplash.com/photo-1529374255216-f0ef61dde988?w=600&h=600&fit=crop&q=80', 'https://images.unsplash.com/photo-1618354691792-d1d42acfd860?w=600&h=600&fit=crop&q=80', 'Club-ready heavyweight tee. Swazz neon logo printed on the chest. Ribbed crewneck, boxy silhouette.', 'NEW', '["S","M","L","XL","XXL"]'::jsonb, true),
  ('swazz-dubai-tee', 'Dubai Collab Tee', 'Swazz', 'swazz', 'tee', 45, null, 'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=600&h=600&fit=crop&q=80', 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&h=600&fit=crop&q=80', 'Swazz Ã— Stylo G Dubai collab edition. Gold foil and screen-print combo. Collector''s piece â€” strictly limited.', 'LIMITED', '["S","M","L","XL"]'::jsonb, true),
  ('swazz-hoodie', 'Swazz Night Business Hoodie', 'Swazz', 'swazz', 'hoodie', 75, null, 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&h=600&fit=crop&q=80', 'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=600&h=600&fit=crop&q=80', 'Night Business edition hoodie. Glow-in-the-dark print on the back. 380gsm fleece, drop-shoulder fit.', 'NEW', '["S","M","L","XL","XXL"]'::jsonb, true),
  ('swazz-cap', 'Swazz 5-Panel Cap', 'Swazz', 'swazz', 'cap', 30, null, 'https://images.unsplash.com/photo-1521369035602-d8b46ebab55b?w=600&h=600&fit=crop&q=80', 'https://images.unsplash.com/photo-1534215754734-18e55d13e346?w=600&h=600&fit=crop&q=80', '5-panel camp cap with curved brim. Swazz logo embroidered in yellow on front. Nylon shell, strapback.', null, '["One Size"]'::jsonb, true),
  ('swazz-vinyl', 'Club Shake â€” Green Vinyl 12"', 'Swazz', 'swazz', 'vinyl', 50, null, 'https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=600&h=600&fit=crop&q=80', 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=600&h=600&fit=crop&q=80', 'Neon green 12" vinyl of Club Shake. Includes Dubai Remix and 2 B-sides. Hand-numbered, 150 copies only.', 'LIMITED', '["One Size"]'::jsonb, true),
  ('swazz-poster', 'Swazz Stage Print A2', 'Swazz', 'swazz', 'poster', 18, null, 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=600&fit=crop&q=80', 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=600&h=600&fit=crop&q=80', 'Live stage photography art print. A2, heavy matte paper, museum-quality giclÃ©e. Ships in rigid tube.', null, '["One Size"]'::jsonb, true),
  ('swazz-bundle', 'Swazz Night Bundle', 'Swazz', 'swazz', 'bundle', 110, 140, 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&h=600&fit=crop&q=80', 'https://images.unsplash.com/photo-1523381210434-271e8329d51f?w=600&h=600&fit=crop&q=80', 'Club Shake Tee + Night Business Hoodie + Green Vinyl. Includes laminated backstage pass replica.', 'SALE', '["M","L","XL"]'::jsonb, true),
  ('meesch-logo-tee', 'Mee$ch Trap Tee', 'Mee$ch', 'meesch', 'tee', 35, null, 'https://images.unsplash.com/photo-1549062572-119d6e876a32?w=600&h=600&fit=crop&q=80', 'https://images.unsplash.com/photo-1529374255216-f0ef61dde988?w=600&h=600&fit=crop&q=80', 'Raw edge oversized tee. Mee$ch dollar-sign logo on chest, 1 Jamaica Music barcode on sleeve. Pre-washed for vintage feel.', 'NEW', '["S","M","L","XL","XXL"]'::jsonb, true),
  ('meesch-samurai-tee', 'Samurai Edition Tee', 'Mee$ch', 'meesch', 'tee', 40, null, 'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=600&h=600&fit=crop&q=80', 'https://images.unsplash.com/photo-1549062572-119d6e876a32?w=600&h=600&fit=crop&q=80', 'Samurai single artwork on the back, full-size. Subtle chest print. Heavyweight 220gsm cotton, boxy cut.', 'LIMITED', '["S","M","L","XL"]'::jsonb, true),
  ('meesch-hoodie', 'Mee$ch Heavyweight Hoodie', 'Mee$ch', 'meesch', 'hoodie', 70, null, 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&h=600&fit=crop&q=80', 'https://images.unsplash.com/photo-1614495600720-3ec50df7b2ab?w=600&h=600&fit=crop&q=80', '400gsm heavyweight hoodie. Mee$ch x 1 Jamaica Music co-branded embroidery. Double-lined hood, kangaroo pocket.', null, '["S","M","L","XL","XXL"]'::jsonb, true),
  ('meesch-cap', 'Mee$ch Trucker Cap', 'Mee$ch', 'meesch', 'cap', 28, null, 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600&h=600&fit=crop&q=80', 'https://images.unsplash.com/photo-1521369035602-d8b46ebab55b?w=600&h=600&fit=crop&q=80', 'Foam-front trucker cap. Mee$ch logo patch on front. Mesh back, snapback closure. Unisex.', null, '["One Size"]'::jsonb, true),
  ('meesch-vinyl', 'Samurai â€” Black & Gold Vinyl', 'Mee$ch', 'meesch', 'vinyl', 50, null, 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=600&h=600&fit=crop&q=80', 'https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=600&h=600&fit=crop&q=80', 'Debut release on split black and gold vinyl. 10" format. Includes instrumental on B-side. 100 copies.', 'LIMITED', '["One Size"]'::jsonb, true),
  ('meesch-poster', 'Mee$ch Studio Print A2', 'Mee$ch', 'meesch', 'poster', 18, null, 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=600&fit=crop&q=80', 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600&h=600&fit=crop&q=80', 'Studio session fine art print. Black and yellow high-contrast photography. A2, matte finish.', null, '["One Size"]'::jsonb, true),
  ('meesch-bundle', 'Mee$ch Starter Bundle', 'Mee$ch', 'meesch', 'bundle', 100, 123, 'https://images.unsplash.com/photo-1523381210434-271e8329d51f?w=600&h=600&fit=crop&q=80', 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&h=600&fit=crop&q=80', 'Trap Tee + Heavyweight Hoodie + Samurai Vinyl. Includes hand-signed lyric sheet insert.', 'SALE', '["M","L","XL"]'::jsonb, true)
on conflict (id) do update set
  name = excluded.name,
  artist = excluded.artist,
  artist_slug = excluded.artist_slug,
  category = excluded.category,
  price = excluded.price,
  original_price = excluded.original_price,
  image = excluded.image,
  image_hover = excluded.image_hover,
  description = excluded.description,
  badge = excluded.badge,
  sizes = excluded.sizes,
  in_stock = excluded.in_stock;

insert into artists (slug, name, genres, bio, image, booking_email, active, sort_order)
values
  (
    'hintell',
    'HINTELL',
    '["Dancehall", "Hip-Hop", "Techno"]'::jsonb,
    'Hintell is a versatile Jamaican artist known for blending Dancehall, Hip-Hop, and electronic sounds.',
    '/hintell.jpg',
    'booking@1jamaicamusic.com',
    true,
    1
  ),
  (
    'dark-koko',
    'DARK KOKO',
    '["Afrobeats", "Dancehall"]'::jsonb,
    'Dark Koko brings Afrobeats flair and Dancehall heat to every record.',
    '/dark-koko.jpg',
    'booking@1jamaicamusic.com',
    true,
    2
  ),
  (
    'swazz',
    'SWAZZ',
    '["Dancehall", "Electronic"]'::jsonb,
    'Swazz is the high-energy Dancehall and Electronic crossover artist behind club-ready releases.',
    '/swazz.jpg',
    'booking@1jamaicamusic.com',
    true,
    3
  ),
  (
    'meesch',
    'MEE$CH',
    '["Hip-Hop", "Trap"]'::jsonb,
    'Mee$ch brings raw Hip-Hop and Trap energy with a Jamaican twist.',
    '/meesch.jpg',
    'booking@1jamaicamusic.com',
    true,
    4
  )
on conflict (slug) do nothing;
