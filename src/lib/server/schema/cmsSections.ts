import { pgTable, text, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";

export const cmsSections = pgTable("cms_sections", {
  id: text("id").primaryKey(),
  pageId: text("page_id").notNull(),
  sectionKey: text("section_key").notNull(),
  sectionType: text("section_type").notNull(),
  title: text("title").notNull().default(""),
  subtitle: text("subtitle").notNull().default(""),
  body: text("body").notNull().default(""),
  imageUrl: text("image_url").notNull().default(""),
  videoUrl: text("video_url").notNull().default(""),
  ctaLabel: text("cta_label").notNull().default(""),
  ctaUrl: text("cta_url").notNull().default(""),
  settings: jsonb("settings").$type<Record<string, unknown>>().notNull().default({}),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type CmsSection = typeof cmsSections.$inferSelect;
export type InsertCmsSection = typeof cmsSections.$inferInsert;

