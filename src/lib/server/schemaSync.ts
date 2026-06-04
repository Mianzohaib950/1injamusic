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
      await pool.query(`drop table if exists advertisements;`);
      await pool.query(`drop table if exists categories;`);
    })();
  }

  await globalThis.__schemaSyncPromise;
}
