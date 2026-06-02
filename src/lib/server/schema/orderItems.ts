import { pgTable, text, integer } from "drizzle-orm/pg-core";

export const orderItems = pgTable("order_items", {
  id: text("id").primaryKey(),
  orderId: text("order_id").notNull(),
  productId: text("product_id").notNull(),
  name: text("name").notNull(),
  artist: text("artist").notNull(),
  price: integer("price").notNull(),
  image: text("image").notNull(),
  size: text("size").notNull(),
  quantity: integer("quantity").notNull(),
});

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;
