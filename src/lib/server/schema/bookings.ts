import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const bookings = pgTable("bookings", {
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

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = typeof bookings.$inferInsert;
