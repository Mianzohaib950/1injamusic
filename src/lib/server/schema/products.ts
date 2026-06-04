import { pgTable, text, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";

export const products = pgTable("products", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  artist: text("artist").notNull(),
  artistSlug: text("artist_slug").notNull(),
  category: text("category").notNull(),
  price: integer("price").notNull(),
  originalPrice: integer("original_price"),
  image: text("image").notNull(),
  imageHover: text("image_hover").notNull(),
  description: text("description").notNull(),
  badge: text("badge"),
  sizes: jsonb("sizes").$type<string[]>().notNull().default(["One Size"]),
  inStock: boolean("in_stock").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;
