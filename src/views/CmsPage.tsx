import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { apiGet } from "@/lib/api";
import NotFound from "@/views/not-found";

type CmsItem = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  linkUrl: string;
  active: boolean;
};

type CmsSection = {
  id: string;
  sectionKey: string;
  sectionType: string;
  title: string;
  subtitle: string;
  body: string;
  imageUrl: string;
  active: boolean;
  items: CmsItem[];
};

type CmsPageResponse = {
  page: {
    pageKey: string;
    title: string;
    active: boolean;
  };
  sections: CmsSection[];
};

export default function CmsPage() {
  const { pageKey = "" } = useParams<{ pageKey: string }>();
  const cacheKey = `cms-page:${String(pageKey).toLowerCase()}`;
  const [loading, setLoading] = useState(() => {
    if (typeof window === "undefined") return true;
    return !window.sessionStorage.getItem(cacheKey);
  });
  const [notFound, setNotFound] = useState(false);
  const [data, setData] = useState<CmsPageResponse | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.sessionStorage.getItem(cacheKey);
      return raw ? (JSON.parse(raw) as CmsPageResponse) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    let active = true;
    try {
      const raw = window.sessionStorage.getItem(cacheKey);
      if (raw) {
        setData(JSON.parse(raw) as CmsPageResponse);
        setLoading(false);
      } else {
        setData(null);
        setLoading(true);
      }
    } catch {
      setData(null);
      setLoading(true);
    }

    const load = async () => {
      setNotFound(false);
      try {
        const response = await apiGet<CmsPageResponse>(`/cms/${encodeURIComponent(pageKey)}`);
        if (!active) return;
        setData(response);
        try {
          window.sessionStorage.setItem(cacheKey, JSON.stringify(response));
        } catch {
          // Ignore storage failures.
        }
      } catch (error: any) {
        if (!active) return;
        setData(null);
        try {
          window.sessionStorage.removeItem(cacheKey);
        } catch {
          // Ignore storage failures.
        }
        setNotFound(Number(error?.status ?? 0) === 404);
      } finally {
        if (active) setLoading(false);
      }
    };
    if (pageKey) load();
    return () => {
      active = false;
    };
  }, [pageKey]);

  const sections = useMemo(
    () => (data?.sections ?? []).filter((section) => section.active !== false),
    [data],
  );

  if (loading) {
    return (
      <main className="w-full min-h-screen bg-[var(--brand-black)] pt-28 pb-20 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <p className="text-[var(--brand-gray)] font-bebas text-3xl">LOADING PAGE...</p>
        </div>
      </main>
    );
  }

  if (notFound || !data) return <NotFound />;

  return (
    <main className="w-full min-h-screen bg-[var(--brand-black)] pt-28 pb-20">
      <section className="max-w-6xl mx-auto px-6 md:px-12 mb-10">
        <p className="text-[var(--brand-yellow)] font-bebas tracking-widest text-lg">
          {String(data.page.pageKey ?? "").toUpperCase()}
        </p>
        <h1 className="text-white font-bebas text-5xl md:text-7xl leading-none mt-1">
          {data.page.title}
        </h1>
      </section>

      <div className="max-w-6xl mx-auto px-6 md:px-12 space-y-8">
        {sections.map((section) => (
          <section key={section.id} className="border border-[#222] bg-[#111]/70">
            {section.imageUrl && (
              <img
                src={section.imageUrl}
                alt={section.title || section.sectionKey}
                className="w-full h-[280px] object-cover border-b border-[#222]"
              />
            )}
            <div className="p-5 md:p-7">
              {(section.title || section.subtitle) && (
                <div className="mb-3">
                  {section.title && (
                    <h2 className="text-white font-bebas text-3xl md:text-4xl leading-none">
                      {section.title}
                    </h2>
                  )}
                  {section.subtitle && (
                    <p className="text-[var(--brand-yellow)] font-bebas tracking-widest text-lg mt-1">
                      {section.subtitle}
                    </p>
                  )}
                </div>
              )}
              {section.body && (
                <p className="text-[var(--brand-gray)] font-sans text-base leading-relaxed mb-4">
                  {section.body}
                </p>
              )}

              {Array.isArray(section.items) && section.items.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {section.items
                    .filter((item) => item.active !== false)
                    .map((item) => (
                      <article key={item.id} className="border border-[#222] bg-[#0d0d0d]">
                        {item.imageUrl && (
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="w-full h-44 object-cover border-b border-[#222]"
                          />
                        )}
                        <div className="p-4">
                          {item.title && (
                            <h3 className="text-white font-bebas text-2xl leading-none mb-1">
                              {item.title}
                            </h3>
                          )}
                          {item.subtitle && (
                            <p className="text-[var(--brand-yellow)] font-bebas tracking-widest text-sm mb-2">
                              {item.subtitle}
                            </p>
                          )}
                          {item.description && (
                            <p className="text-[var(--brand-gray)] font-sans text-sm leading-relaxed">
                              {item.description}
                            </p>
                          )}
                          {item.linkUrl && (
                            <a
                              href={item.linkUrl}
                              className="inline-block mt-3 text-[var(--brand-yellow)] font-bebas tracking-widest hover:text-white transition-colors"
                            >
                              OPEN
                            </a>
                          )}
                        </div>
                      </article>
                    ))}
                </div>
              )}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
