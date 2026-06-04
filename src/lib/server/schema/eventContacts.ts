import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const eventContacts = pgTable("event_contacts", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  artist: text("artist").notNull(),
  eventType: text("event_type").notNull(),
  eventDate: text("event_date").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull().default("New"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type EventContact = typeof eventContacts.$inferSelect;
export type InsertEventContact = typeof eventContacts.$inferInsert;
