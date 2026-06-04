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

drop table if exists advertisements;
drop table if exists categories;

create index if not exists addresses_user_id_idx on addresses (user_id);
create index if not exists artists_active_idx on artists (active);
create index if not exists bookings_status_idx on bookings (status);
create index if not exists event_contacts_status_idx on event_contacts (status);
create index if not exists orders_user_id_idx on orders (user_id);
create index if not exists order_items_order_id_idx on order_items (order_id);

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
