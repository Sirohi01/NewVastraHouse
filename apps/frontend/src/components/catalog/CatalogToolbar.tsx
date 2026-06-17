import { LayoutGrid, List } from "lucide-react";
import { filterOptions, type CatalogQuery } from "@/lib/catalog";

export function CatalogToolbar({
  query,
  total,
  view,
}: Readonly<{ query: CatalogQuery; total: number; view: "grid" | "list" }>) {
  return (
    <form className="rounded-lg border border-border bg-card p-4 shadow-soft">
      <div className="grid gap-3 md:grid-cols-[1fr_180px_180px_180px]">
        <label className="block">
          <span className="text-xs font-semibold uppercase text-muted-foreground">Search</span>
          <input
            className="mt-1 h-11 w-full rounded-md border border-border bg-background px-3 outline-none focus:border-primary"
            defaultValue={query.search}
            name="search"
            placeholder="Kurti, saree, silk"
          />
        </label>
        <Select label="Size" name="size" options={filterOptions.sizes} value={query.size} />
        <Select label="Color" name="color" options={filterOptions.colors} value={query.color} />
        <Select label="Fabric" name="fabric" options={filterOptions.fabrics} value={query.fabric} />
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-[140px_140px_1fr_auto] md:items-end">
        <label className="block">
          <span className="text-xs font-semibold uppercase text-muted-foreground">Min Price</span>
          <input
            className="mt-1 h-11 w-full rounded-md border border-border bg-background px-3 outline-none focus:border-primary"
            defaultValue={query.minPrice}
            min="0"
            name="minPrice"
            type="number"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase text-muted-foreground">Max Price</span>
          <input
            className="mt-1 h-11 w-full rounded-md border border-border bg-background px-3 outline-none focus:border-primary"
            defaultValue={query.maxPrice}
            min="0"
            name="maxPrice"
            type="number"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase text-muted-foreground">Sort</span>
          <select
            className="mt-1 h-11 w-full rounded-md border border-border bg-background px-3 outline-none focus:border-primary"
            defaultValue={query.sort ?? "-newest"}
            name="sort"
          >
            {filterOptions.sorts.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <input name="view" type="hidden" value={view} />
        <button
          className="h-11 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground"
          type="submit"
        >
          Apply
        </button>
      </div>
      <details className="mt-3 rounded-md border border-border bg-background p-3">
        <summary className="cursor-pointer text-sm font-semibold">Advanced filters</summary>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="block">
            <span className="text-xs font-semibold uppercase text-muted-foreground">
              Collection ID
            </span>
            <input
              className="mt-1 h-11 w-full rounded-md border border-border bg-card px-3 outline-none focus:border-primary"
              defaultValue={query.collectionId}
              name="collectionId"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase text-muted-foreground">Tag ID</span>
            <input
              className="mt-1 h-11 w-full rounded-md border border-border bg-card px-3 outline-none focus:border-primary"
              defaultValue={query.tagId}
              name="tagId"
            />
          </label>
        </div>
      </details>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <p className="text-sm text-muted-foreground">{total} products</p>
        <div className="flex rounded-md border border-border bg-background p-1">
          <ViewLink
            active={view === "grid"}
            icon={<LayoutGrid size={16} />}
            label="Grid"
            query={query}
            view="grid"
          />
          <ViewLink
            active={view === "list"}
            icon={<List size={16} />}
            label="List"
            query={query}
            view="list"
          />
        </div>
      </div>
    </form>
  );
}

function Select({
  label,
  name,
  options,
  value,
}: Readonly<{ label: string; name: string; options: string[]; value?: string }>) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase text-muted-foreground">{label}</span>
      <select
        className="mt-1 h-11 w-full rounded-md border border-border bg-background px-3 outline-none focus:border-primary"
        defaultValue={value ?? ""}
        name={name}
      >
        <option value="">All</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function ViewLink({
  active,
  icon,
  label,
  query,
  view,
}: Readonly<{
  active: boolean;
  icon: React.ReactNode;
  label: string;
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
      aria-label={label}
      className={`inline-flex size-9 items-center justify-center rounded-sm ${
        active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-primary"
      }`}
      href={`?${params.toString()}`}
      title={label}
    >
      {icon}
    </a>
  );
}
