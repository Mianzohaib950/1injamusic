import { pgTable, text, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";

export const artists = pgTable("artists", {
  slug: text("slug").primaryKey(),
  name: text("name").notNull(),
  genres: jsonb("genres").$type<string[]>().notNull().default([]),
  bio: text("bio").notNull().default(""),
  image: text("image").notNull().default(""),
  bookingEmail: text("booking_email").notNull().default("booking@1jamaicamusic.com"),
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Artist = typeof artists.$inferSelect;
export type InsertArtist = typeof artists.$inferInsert;
