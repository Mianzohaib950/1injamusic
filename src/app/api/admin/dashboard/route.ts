import { eventContacts, getDb, orderItems, orders, products, users, artists, bookings } from "@/lib/server/db";
import { requireAdminAuth } from "@/lib/server/admin";
import { json, serverError } from "@/lib/server/http";
import { ensureServerSchema } from "@/lib/server/schemaSync";
import { listDevUsers } from "@/lib/server/devAuthStore";
import { withDatabaseRetry } from "@/lib/server/dbRetry";

export const runtime = "nodejs";

function normalizeStatus(value: unknown) {
  return String(value ?? "").trim().toLowerCase().replace(/\s+/g, "-");
}

function countStatus(rows: Array<typeof orders.$inferSelect>, expected: string) {
  const target = normalizeStatus(expected);
  return rows.filter((order) => normalizeStatus(order.status) === target).length;
}

export async function GET(request: Request) {
  try {
    const auth = requireAdminAuth(request);
    if (auth instanceof Response) return auth;
    const [productRows, orderRows, userRows, artistRows, bookingRows, orderItemRows, eventContactRows] =
      await withDatabaseRetry(async () => {
        await ensureServerSchema();

        const db = getDb();
        return Promise.all([
          db.select().from(products),
          db.select().from(orders),
          db.select().from(users),
          db.select().from(artists),
          db.select().from(bookings),
          db.select().from(orderItems),
          db.select().from(eventContacts),
        ]);
      });

    const devUserRows = process.env.VERCEL ? [] : await listDevUsers();
    const totalUsers = Math.max(userRows.length, devUserRows.length);

    const totalRevenueCents = orderRows.reduce(
      (sum: number, order: typeof orders.$inferSelect) => sum + Number(order.totalCents ?? 0),
      0,
    );
    const pendingOrders = countStatus(orderRows, "Pending");
    const processingOrders = countStatus(orderRows, "Processing");
    const shippedOrders = countStatus(orderRows, "Shipped");
    const deliveredOrders = countStatus(orderRows, "Delivered");
    const cancelledOrders = orderRows.filter((order: typeof orders.$inferSelect) => {
      const status = normalizeStatus(order.status);
      return status === "cancelled" || status === "canceled";
    }).length;
    const totalUnitsSold = orderItemRows.reduce(
      (sum: number, item: typeof orderItems.$inferSelect) => sum + Number(item.quantity ?? 0),
      0,
    );

    return json({
      totals: {
        products: productRows.length,
        artists: artistRows.length,
        bookings: bookingRows.length,
        eventContacts: eventContactRows.length,
        orders: orderRows.length,
        users: totalUsers,
        revenueCents: totalRevenueCents,
        unitsSold: totalUnitsSold,
      },
      ordersByStatus: {
        Pending: pendingOrders,
        Processing: processingOrders,
        Shipped: shippedOrders,
        Delivered: deliveredOrders,
        Cancelled: cancelledOrders,
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
