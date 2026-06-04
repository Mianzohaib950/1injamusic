import { eventContacts, getDb, orderItems, orders, products, users, artists, bookings } from "@/lib/server/db";
import { requireAdminAuth } from "@/lib/server/admin";
import { json, serverError } from "@/lib/server/http";
import { ensureServerSchema } from "@/lib/server/schemaSync";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const auth = requireAdminAuth(request);
    if (auth instanceof Response) return auth;
    await ensureServerSchema();

    const db = getDb();
    const [productRows, orderRows, userRows, artistRows, bookingRows, orderItemRows, eventContactRows] = await Promise.all([
      db.select().from(products),
      db.select().from(orders),
      db.select().from(users),
      db.select().from(artists),
      db.select().from(bookings),
      db.select().from(orderItems),
      db.select().from(eventContacts),
    ]);

    const totalRevenueCents = orderRows.reduce(
      (sum: number, order: typeof orders.$inferSelect) => sum + order.totalCents,
      0,
    );
    const pendingOrders = orderRows.filter((order: typeof orders.$inferSelect) => order.status === "Pending").length;
    const processingOrders = orderRows.filter((order: typeof orders.$inferSelect) => order.status === "Processing").length;
    const shippedOrders = orderRows.filter((order: typeof orders.$inferSelect) => order.status === "Shipped").length;
    const deliveredOrders = orderRows.filter((order: typeof orders.$inferSelect) => order.status === "Delivered").length;
    const totalUnitsSold = orderItemRows.reduce(
      (sum: number, item: typeof orderItems.$inferSelect) => sum + item.quantity,
      0,
    );

    return json({
      totals: {
        products: productRows.length,
        artists: artistRows.length,
        bookings: bookingRows.length,
        eventContacts: eventContactRows.length,
        orders: orderRows.length,
        users: userRows.length,
        revenueCents: totalRevenueCents,
        unitsSold: totalUnitsSold,
      },
      ordersByStatus: {
        Pending: pendingOrders,
        Processing: processingOrders,
        Shipped: shippedOrders,
        Delivered: deliveredOrders,
      },
      recentOrders: orderRows
        .sort((a: typeof orders.$inferSelect, b: typeof orders.$inferSelect) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        })
        .slice(0, 10),
      lowStockProducts: productRows.filter((product: typeof products.$inferSelect) => !product.inStock),
    });
  } catch (error) {
    return serverError(error);
  }
}
