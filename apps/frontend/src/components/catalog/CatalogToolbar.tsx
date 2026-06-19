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
      <label className="flex h-10 items-center gap-2 rounded-sm border border-[#e1d6c4] bg-white px-3 transition-[border-color,box-shadow] duration-200 focus-within:border-[#caa14e] focus-within:shadow-[0_0_0_3px_rgba(202,161,78,0.16)] md:rounded-none md:border-0 md:border-l md:bg-transparent md:px-4 md:focus-within:shadow-none">
        <Search aria-hidden="true" className="text-[#9b6d35]" size={17} />
        <input
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#a99a86]"
          defaultValue={query.search}
          name="search"
          placeholder="Search products"
        />
      </label>
      <label className="flex h-10 items-center gap-2 border-[#e1d6c4] md:border-l md:px-4">
        <span className="text-sm text-[#6f6256]">Sort by:</span>
        <select
          className="cursor-pointer bg-transparent text-sm font-medium text-[#3d1620] outline-none"
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
      <div className="flex h-10 items-center gap-1.5 border-[#e1d6c4] md:border-l md:px-4">
        <span className="text-sm text-[#6f6256]">View:</span>
        <input name="view" type="hidden" value={view} />
        <ViewLink
          active={view === "grid"}
          icon={<LayoutGrid size={17} />}
          query={query}
          view="grid"
        />
        <ViewLink active={view === "list"} icon={<List size={17} />} query={query} view="list" />
      </div>
      <button className="inline-flex h-10 items-center justify-center gap-2 rounded-sm border border-[#6e1423] px-4 text-sm font-semibold uppercase tracking-wide text-[#6e1423] transition-colors hover:bg-[#6e1423] hover:text-white md:rounded-none md:border-0 md:border-l md:text-[#3d1620] md:hover:bg-transparent md:hover:text-[#6e1423]">
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
      className={`grid size-8 place-items-center rounded-sm border transition-colors ${
        active
          ? "border-[#6e1423] bg-[#6e1423] text-white"
          : "border-transparent text-[#9b6d35] hover:border-[#caa14e] hover:text-[#6e1423]"
      }`}
      href={`?${params.toString()}`}
    >
      {icon}
    </a>
  );
}
