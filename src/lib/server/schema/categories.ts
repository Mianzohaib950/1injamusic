import { pgTable, text, boolean, integer, timestamp } from "drizzle-orm/pg-core";

export const categories = pgTable("categories", {
  slug: text("slug").primaryKey(),
  name: text("name").notNull(),
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;
