import type { CatalogQuery, PaginatedResult } from "@/lib/catalog";

export function Pagination({
  meta,
  query,
}: Readonly<{ meta: PaginatedResult<unknown>["meta"]; query: CatalogQuery }>) {
  if (meta.totalPages <= 1) {
    return null;
  }

  return (
    <nav className="mt-10 flex items-center justify-center gap-4">
      <PageLink
        disabled={!meta.hasPreviousPage}
        label="Previous"
        page={meta.page - 1}
        query={query}
      />
      <span className="flex items-center gap-2 font-serif text-sm text-[#3d1620]">
        <span aria-hidden="true" className="text-xs text-[#caa14e]">
          ✦
        </span>
        Page <span className="font-semibold text-[#6e1423]">{meta.page}</span> of {meta.totalPages}
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
      className={`h-10 rounded-sm border px-5 py-2 text-sm font-semibold uppercase tracking-wide transition-colors ${
        disabled
          ? "pointer-events-none border-[#e1d6c4] text-[#b3a692]"
          : "border-[#6e1423] text-[#6e1423] hover:bg-[#6e1423] hover:text-white"
      }`}
      href={`?${params.toString()}`}
    >
      {label}
    </a>
  );
}
