import { Filter, LayoutGrid, List, Search } from "lucide-react";
import { sortOptions, type CatalogQuery } from "@/lib/catalog";

export function CatalogToolbar({
  query,
  total,
  view,
}: Readonly<{ query: CatalogQuery; total: number; view: "grid" | "list" }>) {
  return (
    <form className="grid gap-3 px-5 py-3 md:grid-cols-[1fr_auto_auto_auto] md:items-center">
      <p className="text-sm text-muted-foreground md:hidden">{total} Results</p>
      <label className="flex h-10 items-center gap-2 border-[#e1d6c4] md:border-l md:px-4">
        <span className="text-sm">Search</span>
        <Search aria-hidden="true" size={17} />
        <input
          className="min-w-0 flex-1 bg-transparent text-sm outline-none"
          defaultValue={query.search}
          name="search"
        />
      </label>
      <label className="flex h-10 items-center gap-2 border-[#e1d6c4] md:border-l md:px-4">
        <span className="text-sm">Sort by:</span>
        <select
          className="bg-transparent text-sm outline-none"
          defaultValue={query.sort ?? "-newest"}
          name="sort"
        >
          {sortOptions.sorts.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <div className="flex h-10 items-center gap-2 border-[#e1d6c4] md:border-l md:px-4">
        <span className="text-sm">View:</span>
        <input name="view" type="hidden" value={view} />
        <ViewLink
          active={view === "grid"}
          icon={<LayoutGrid size={17} />}
          query={query}
          view="grid"
        />
        <ViewLink active={view === "list"} icon={<List size={17} />} query={query} view="list" />
      </div>
      <button className="inline-flex h-10 items-center justify-center gap-2 border-[#e1d6c4] text-sm md:border-l md:px-4">
        Filters <Filter aria-hidden="true" size={17} />
      </button>
    </form>
  );
}

function ViewLink({
  active,
  icon,
  query,
  view,
}: Readonly<{
  active: boolean;
  icon: React.ReactNode;
  query: CatalogQuery;
  view: "grid" | "list";
}>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (typeof value === "string" && value.length > 0) {
      params.set(key, value);
    }
  }
  params.set("view", view);

  return (
    <a
      className={active ? "text-[#6e1423]" : "text-muted-foreground hover:text-[#caa14e]"}
      href={`?${params.toString()}`}
    >
      {icon}
    </a>
  );
}
