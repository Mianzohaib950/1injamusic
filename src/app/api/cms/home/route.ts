import { asc, eq } from "drizzle-orm";
import { cmsPages, cmsSectionItems, cmsSections, getDb } from "@/lib/server/db";
import { json, serverError } from "@/lib/server/http";
import { ensureServerSchema } from "@/lib/server/schemaSync";
import { withDatabaseRetry } from "@/lib/server/dbRetry";

export const runtime = "nodejs";
const PUBLIC_CACHE_HEADERS = { "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=86400" };

export async function GET() {
  try {
    const { homePage, payload } = await withDatabaseRetry(async () => {
      await ensureServerSchema();
      const db = getDb();
      const [page] = await db.select().from(cmsPages).where(eq(cmsPages.pageKey, "home"));
      const pageId = page?.id ?? "home-page";
      const sections = await db.select().from(cmsSections).where(eq(cmsSections.pageId, pageId)).orderBy(asc(cmsSections.sortOrder));
      const sectionItems = await Promise.all(
        sections.map(async (section: typeof cmsSections.$inferSelect) => {
          const items = await db.select().from(cmsSectionItems).where(eq(cmsSectionItems.sectionId, section.id)).orderBy(asc(cmsSectionItems.sortOrder));
          return { ...section, items };
        }),
      );
      return { homePage: page, payload: sectionItems };
    });

    return json({
      page: homePage ?? { id: "home-page", pageKey: "home", title: "Home Page", active: true },
      sections: payload,
    }, { headers: PUBLIC_CACHE_HEADERS });
  } catch (error) {
    return serverError(error);
  }
}

