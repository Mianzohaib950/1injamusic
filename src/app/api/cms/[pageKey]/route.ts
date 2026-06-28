import { asc, eq } from "drizzle-orm";
import { cmsPages, cmsSectionItems, cmsSections, getDb } from "@/lib/server/db";
import { json, serverError } from "@/lib/server/http";
import { ensureServerSchema } from "@/lib/server/schemaSync";
import { withDatabaseRetry } from "@/lib/server/dbRetry";

export const runtime = "nodejs";
const PUBLIC_CACHE_HEADERS = { "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=86400" };

export async function GET(
  _request: Request,
  context: { params: Promise<{ pageKey: string }> },
) {
  try {
    const { pageKey: rawPageKey } = await context.params;
    const pageKey = String(rawPageKey ?? "").trim().toLowerCase();
    if (!pageKey) {
      return json({ error: "pageKey is required" }, { status: 400 });
    }

    const { page, payload } = await withDatabaseRetry(async () => {
      await ensureServerSchema();
      const db = getDb();
      const [selectedPage] = await db.select().from(cmsPages).where(eq(cmsPages.pageKey, pageKey));
      if (!selectedPage) return { page: null, payload: [] };

      const sections = await db
        .select()
        .from(cmsSections)
        .where(eq(cmsSections.pageId, selectedPage.id))
        .orderBy(asc(cmsSections.sortOrder));

      const sectionItems = await Promise.all(
        sections.map(async (section: typeof cmsSections.$inferSelect) => {
          const items = await db
            .select()
            .from(cmsSectionItems)
            .where(eq(cmsSectionItems.sectionId, section.id))
            .orderBy(asc(cmsSectionItems.sortOrder));
          return { ...section, items };
        }),
      );

      return { page: selectedPage, payload: sectionItems };
    });

    if (!page) {
      return json({ error: `CMS page not found: ${pageKey}` }, { status: 404 });
    }

    return json({
      page,
      sections: payload,
    }, { headers: PUBLIC_CACHE_HEADERS });
  } catch (error) {
    return serverError(error);
  }
}
