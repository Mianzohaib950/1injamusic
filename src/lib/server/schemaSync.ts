import { getPool } from "./db";

declare global {
  // eslint-disable-next-line no-var
  var __schemaSyncPromise: Promise<void> | undefined;
}

export async function ensureServerSchema() {
  if (!globalThis.__schemaSyncPromise) {
    globalThis.__schemaSyncPromise = (async () => {
      const pool = getPool();
      await pool.query(
        `alter table if exists products add column if not exists sizes jsonb not null default '["One Size"]'::jsonb;`,
      );
      await pool.query(
        `create table if not exists artists (
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
        );`,
      );
      await pool.query(
        `create table if not exists bookings (
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
        );`,
      );
      await pool.query(
        `create table if not exists event_contacts (
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
        );`,
      );
      await pool.query(
        `create table if not exists cms_pages (
          id text primary key,
          page_key text not null unique,
          title text not null default '',
          active boolean not null default true,
          created_at timestamp not null default now(),
          updated_at timestamp not null default now()
        );`,
      );
      await pool.query(
        `create table if not exists cms_sections (
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
        );`,
      );
      await pool.query(
        `create table if not exists cms_section_items (
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
        );`,
      );
      await pool.query(`create index if not exists cms_pages_page_key_idx on cms_pages (page_key);`);
      await pool.query(`create index if not exists cms_sections_page_id_idx on cms_sections (page_id);`);
      await pool.query(`create index if not exists cms_sections_sort_idx on cms_sections (page_id, sort_order);`);
      await pool.query(`create index if not exists cms_items_section_id_idx on cms_section_items (section_id);`);
      await pool.query(`create index if not exists cms_items_sort_idx on cms_section_items (section_id, sort_order);`);

      await pool.query(
        `insert into cms_pages (id, page_key, title, active)
         values
          ('home-page', 'home', 'Home Page', true),
          ('artists-page', 'artists', 'Artists Page', true),
          ('shop-page', 'shop', 'Shop Page', true),
          ('events-page', 'events', 'Events & Contact Page', true),
          ('booking-page', 'booking', 'Booking Page', true)
         on conflict (page_key) do nothing;`,
      );
      await pool.query(
        `insert into cms_sections (id, page_id, section_key, section_type, title, subtitle, body, sort_order, active)
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
          ('home-footer', 'home-page', 'footer', 'footer', '1 JAMAICA MUSIC', '', '', 10, true)
         on conflict (id) do nothing;`,
      );
      await pool.query(
        `insert into cms_section_items (id, section_id, item_key, title, subtitle, description, image_url, link_url, sort_order, active, meta)
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
         on conflict (id) do nothing;`,
      );
      await pool.query(
        `insert into cms_section_items (id, section_id, item_key, title, subtitle, description, image_url, link_url, tags, sort_order, active, meta)
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
         on conflict (id) do nothing;`,
      );
      await pool.query(`drop table if exists advertisements;`);
      await pool.query(`drop table if exists categories;`);
    })();
  }

  await globalThis.__schemaSyncPromise;

  // Keep CMS seeds self-healing even if someone deletes core pages/sections at runtime.
  const pool = getPool();
  await pool.query(
    `insert into cms_pages (id, page_key, title, active)
     values
      ('home-page', 'home', 'Home Page', true),
      ('artists-page', 'artists', 'Artists Page', true),
      ('shop-page', 'shop', 'Shop Page', true),
      ('events-page', 'events', 'Events & Contact Page', true),
      ('booking-page', 'booking', 'Booking Page', true)
     on conflict (page_key) do nothing;`,
  );
  await pool.query(
    `insert into cms_sections (id, page_id, section_key, section_type, title, subtitle, body, sort_order, active)
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
     on conflict (id) do nothing;`,
  );
  await pool.query(
    `insert into cms_section_items (id, section_id, item_key, title, subtitle, description, image_url, link_url, sort_order, active, meta)
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
     on conflict (id) do nothing;`,
  );
  await pool.query(
    `insert into cms_section_items (id, section_id, item_key, title, subtitle, description, image_url, link_url, tags, sort_order, active, meta)
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
     on conflict (id) do nothing;`,
  );
}
