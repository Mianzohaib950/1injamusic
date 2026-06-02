import { getDb, products } from "@/lib/server/db";
import { json } from "@/lib/server/http";
import { seedProducts } from "@/lib/server/productSeed";

export const runtime = "nodejs";

export async function GET() {
  await seedProducts();
  const productList = await getDb().select().from(products);
  return json(productList);
}
