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
  in_stock boolean not null default true,
  created_at timestamp not null default now()
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

create index if not exists addresses_user_id_idx on addresses (user_id);
create index if not exists orders_user_id_idx on orders (user_id);
create index if not exists order_items_order_id_idx on order_items (order_id);
