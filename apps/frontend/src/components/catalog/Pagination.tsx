import type { CatalogQuery, PaginatedResult } from "@/lib/catalog";

export function Pagination({
  meta,
  query,
}: Readonly<{ meta: PaginatedResult<unknown>["meta"]; query: CatalogQuery }>) {
  if (meta.totalPages <= 1) {
    return null;
  }

  return (
    <nav className="mt-8 flex items-center justify-center gap-3">
      <PageLink
        disabled={!meta.hasPreviousPage}
        label="Previous"
        page={meta.page - 1}
        query={query}
      />
      <span className="text-sm text-muted-foreground">
        Page {meta.page} of {meta.totalPages}
      </span>
      <PageLink disabled={!meta.hasNextPage} label="Next" page={meta.page + 1} query={query} />
    </nav>
  );
}

function PageLink({
  disabled,
  label,
  page,
  query,
}: Readonly<{ disabled: boolean; label: string; page: number; query: CatalogQuery }>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (typeof value === "string" && value.length > 0) {
      params.set(key, value);
    }
  }
  params.set("page", String(page));

  return (
    <a
      aria-disabled={disabled}
      className={`h-10 rounded-md border px-4 py-2 text-sm font-semibold ${
        disabled
          ? "pointer-events-none border-border text-muted-foreground"
          : "border-primary text-primary hover:bg-primary hover:text-primary-foreground"
      }`}
      href={`?${params.toString()}`}
    >
      {label}
    </a>
  );
}
