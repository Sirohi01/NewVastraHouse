"use client";

import { Loader2, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import { apiBaseUrl } from "@/lib/api";
import type { MediaReference } from "@/lib/catalog";

type SearchResult = {
  _id: string;
  href: string;
  image?: MediaReference;
  kind: "Category" | "Collection" | "Product" | "Tag";
  title: string;
};

export function MobileHomeSearch() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const trimmedQuery = query.trim();
  const viewAllHref = useMemo(
    () => `/shop?search=${encodeURIComponent(trimmedQuery)}`,
    [trimmedQuery],
  );

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedQuery(trimmedQuery), 350);
    return () => window.clearTimeout(timeout);
  }, [trimmedQuery]);

  useEffect(() => {
    const controller = new AbortController();

    async function searchCatalog() {
      if (debouncedQuery.length < 2) {
        setResults([]);
        setError("");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `${apiBaseUrl}/catalog/search?q=${encodeURIComponent(debouncedQuery)}`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          throw new Error("Search failed");
        }

        const payload = (await response.json()) as { results: SearchResult[] };
        setResults(payload.results);
      } catch (searchError) {
        if (!controller.signal.aborted) {
          setError(searchError instanceof Error ? searchError.message : "Search failed");
          setResults([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void searchCatalog();

    return () => controller.abort();
  }, [debouncedQuery]);

  return (
    <section className="border-b border-[#e1d6c4] bg-[#fffaf1] px-4 py-3 md:hidden">
      <div className="relative">
        <label className="flex h-11 items-center gap-2 rounded-sm border border-[#d9cab4] bg-white px-3 shadow-[0_8px_20px_-18px_rgba(46,12,18,0.8)] focus-within:border-[#caa14e] focus-within:shadow-[0_0_0_3px_rgba(202,161,78,0.16)]">
          <Search aria-hidden="true" className="shrink-0 text-[#9b6d35]" size={18} />
          <input
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#a99a86]"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search products, categories, collections..."
            type="search"
            value={query}
          />
          {loading ? (
            <Loader2
              aria-hidden="true"
              className="shrink-0 animate-spin text-[#9b6d35]"
              size={17}
            />
          ) : null}
        </label>

        {trimmedQuery.length >= 2 ? (
          <div className="absolute inset-x-0 top-full z-40 mt-2 overflow-hidden rounded-sm border border-[#e1d6c4] bg-white shadow-lifted">
            {error ? (
              <p className="p-3 text-sm text-destructive">{error}</p>
            ) : results.length ? (
              <>
                <div className="max-h-[360px] overflow-y-auto">
                  {results.map((item) => (
                    <a
                      className="grid grid-cols-[48px_1fr] items-center gap-3 border-b border-[#efe5d6] p-2.5 last:border-b-0"
                      href={item.href}
                      key={`${item.kind}-${item._id}`}
                    >
                      {item.image?.url ? (
                        <ResponsiveImage
                          alt={item.image.altText ?? item.title}
                          aspectRatio="1 / 1"
                          className="rounded-sm"
                          objectFit={item.image.objectFit ?? "cover"}
                          sizes="48px"
                          src={item.image.url}
                        />
                      ) : (
                        <span className="grid aspect-square place-items-center rounded-sm bg-[#fbf7ef] text-xs font-semibold text-[#9b6d35]">
                          {item.kind.slice(0, 1)}
                        </span>
                      )}
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-[#2f1c12]">
                          {item.title}
                        </span>
                        <span className="mt-0.5 inline-flex rounded-sm bg-[#fbf7ef] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#9b6d35]">
                          {item.kind}
                        </span>
                      </span>
                    </a>
                  ))}
                </div>
                <a
                  className="block bg-[#6e1423] px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-white"
                  href={viewAllHref}
                >
                  View all results
                </a>
              </>
            ) : loading ? (
              <p className="p-3 text-sm text-muted-foreground">Searching...</p>
            ) : (
              <p className="p-3 text-sm text-muted-foreground">No results found.</p>
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}
