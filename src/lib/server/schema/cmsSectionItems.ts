import { pgTable, text, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";

export const cmsSectionItems = pgTable("cms_section_items", {
  id: text("id").primaryKey(),
  sectionId: text("section_id").notNull(),
  itemKey: text("item_key").notNull().default(""),
  title: text("title").notNull().default(""),
  subtitle: text("subtitle").notNull().default(""),
  description: text("description").notNull().default(""),
  imageUrl: text("image_url").notNull().default(""),
  videoUrl: text("video_url").notNull().default(""),
  linkLabel: text("link_label").notNull().default(""),
  linkUrl: text("link_url").notNull().default(""),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  meta: jsonb("meta").$type<Record<string, unknown>>().notNull().default({}),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type CmsSectionItem = typeof cmsSectionItems.$inferSelect;
export type InsertCmsSectionItem = typeof cmsSectionItems.$inferInsert;

