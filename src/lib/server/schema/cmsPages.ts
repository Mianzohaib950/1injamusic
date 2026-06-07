import { pgTable, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const cmsPages = pgTable("cms_pages", {
  id: text("id").primaryKey(),
  pageKey: text("page_key").notNull().unique(),
  title: text("title").notNull().default(""),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type CmsPage = typeof cmsPages.$inferSelect;
export type InsertCmsPage = typeof cmsPages.$inferInsert;

