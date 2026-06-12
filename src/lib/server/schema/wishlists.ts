import { pgTable, text, timestamp, uniqueIndex, index } from "drizzle-orm/pg-core";

export const wishlists = pgTable(
  "wishlists",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    productId: text("product_id").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    userProductUnique: uniqueIndex("wishlists_user_product_unique").on(table.userId, table.productId),
    userIdIdx: index("wishlists_user_id_idx").on(table.userId),
    productIdIdx: index("wishlists_product_id_idx").on(table.productId),
  }),
);

export type Wishlist = typeof wishlists.$inferSelect;
export type InsertWishlist = typeof wishlists.$inferInsert;

