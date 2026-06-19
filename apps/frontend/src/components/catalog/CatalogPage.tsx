import { ChevronDown, Search } from "lucide-react";
import { CatalogToolbar } from "@/components/catalog/CatalogToolbar";
import { Pagination } from "@/components/catalog/Pagination";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import { ErrorState } from "@/components/states/ErrorState";
import {
  getCatalogFilters,
  getProducts,
  type CatalogFilters,
  type CatalogQuery,
} from "@/lib/catalog";

const heroImage = "/images/home-hero.jpg";

export async function CatalogPage({
  description,
  query,
  title,
}: Readonly<{ description: string; query: CatalogQuery & { view?: string }; title: string }>) {
  const view = query.view === "list" ? "list" : "grid";
  const catalogQuery: CatalogQuery = {
    categoryId: query.categoryId,
    collectionId: query.collectionId,
    color: query.color,
    fabric: query.fabric,
    maxPrice: query.maxPrice,
    minPrice: query.minPrice,
    page: query.page,
    preOrder: query.preOrder,
    search: query.search,
    size: query.size,
    sort: query.sort ?? "-newest",
    tagId: query.tagId,
    view,
  };

  try {
    const [products, filters] = await Promise.all([
      getProducts({ ...catalogQuery, limit: "12" }),
      getCatalogFilters(),
    ]);

    return (
      <main className="bg-[#fbf7ef]">
        <section className="mx-auto max-w-7xl px-5 py-6">
          <div className="relative overflow-hidden rounded-sm border border-[#e1d6c4] shadow-[0_24px_60px_-46px_rgba(46,12,18,0.6)]">
            <ResponsiveImage
              alt={`${title} banner`}
              aspectRatio="16 / 5"
              priority
              sizes="100vw"
              src={heroImage}
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgb(46_12_18/0.86),rgb(46_12_18/0.42)_50%,transparent)]" />

            {/* Royal inset frame + corner filigree */}
            <div className="pointer-events-none absolute inset-3 border border-[#caa14e]/45 sm:inset-5">
              <CornerFiligree className="absolute -left-px -top-px text-[#caa14e]/85" />
              <CornerFiligree className="absolute -right-px -top-px rotate-90 text-[#caa14e]/85" />
              <CornerFiligree className="absolute -bottom-px -right-px rotate-180 text-[#caa14e]/85" />
              <CornerFiligree className="absolute -bottom-px -left-px -rotate-90 text-[#caa14e]/85" />
            </div>

            <div className="absolute inset-0 flex items-center px-7 sm:px-10">
              <div className="max-w-xl text-white">
                <p className="text-xs uppercase tracking-[0.18em] text-white/75">
                  Home <span className="text-[#caa14e]">›</span> {title}
                </p>
                <div className="mt-4 flex items-center gap-2 text-[#caa14e]">
                  <span className="h-px w-10 bg-[#caa14e]" />
                  <span aria-hidden="true">✦</span>
                  <span className="h-px w-6 bg-[#caa14e]/60" />
                </div>
                <h1 className="mt-3 font-serif text-4xl uppercase leading-tight drop-shadow-sm sm:text-5xl">
                  {title}
                </h1>
                <p className="mt-4 max-w-md leading-7 text-white/88">{description}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 pb-10">
          <div className="overflow-hidden rounded-sm border border-[#e1d6c4] bg-[#fffdf8] shadow-[0_18px_50px_-40px_rgba(46,12,18,0.5)]">
            <div className="grid min-h-14 items-center border-b border-[#e1d6c4] text-sm md:grid-cols-[260px_1fr]">
              <div className="flex items-center gap-2 border-[#e1d6c4] px-5 py-4 md:border-r">
                <span aria-hidden="true" className="text-xs text-[#caa14e]">
                  ❖
                </span>
                <span className="font-serif text-[#3d1620]">
                  <span className="font-semibold text-[#6e1423]">{products.meta.total}</span>{" "}
                  Results
                </span>
              </div>
              <CatalogToolbar query={catalogQuery} total={products.meta.total} view={view} />
            </div>

            <div className="grid md:grid-cols-[260px_1fr]">
              <FilterSidebar filters={filters} query={catalogQuery} />
              <div className="p-5">
                <ProductGrid products={products.data} view={view} />
                {products.data.length ? <PromoBand /> : null}
                <Pagination meta={products.meta} query={{ ...catalogQuery, view }} />
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  } catch (error) {
    return (
      <main className="mx-auto flex min-h-[calc(100vh-144px)] max-w-4xl items-center px-4 sm:px-6 lg:px-8">
        <ErrorState
          title={`${title} could not load`}
          message={error instanceof Error ? error.message : "Catalog request failed"}
        />
      </main>
    );
  }
}

function FilterSidebar({
  filters,
  query,
}: Readonly<{ filters: CatalogFilters; query: CatalogQuery }>) {
  return (
    <aside className="border-[#e1d6c4] bg-[#fffaf1] md:border-r">
      <form className="divide-y divide-[#e1d6c4]">
        <input name="search" type="hidden" value={query.search ?? ""} />
        <input name="sort" type="hidden" value={query.sort ?? "-newest"} />
        <input name="view" type="hidden" value={query.view ?? "grid"} />
        {query.preOrder ? <input name="preOrder" type="hidden" value={query.preOrder} /> : null}
        <div className="flex items-center justify-between bg-[#fdf6e8] px-5 py-4">
          <span className="flex items-center gap-2 font-serif text-sm font-semibold uppercase tracking-wide text-[#3d1620]">
            <span aria-hidden="true" className="text-[#caa14e]">
              ❖
            </span>
            Filters
          </span>
          <a
            className="text-xs font-semibold uppercase tracking-wide text-[#6e1423] underline-offset-2 hover:underline"
            href="/shop"
          >
            Clear All
          </a>
        </div>
        <FilterGroup title="Category">
          {filters.categories.map((item) => (
            <Checkbox
              checked={query.categoryId === item._id}
              key={item._id}
              label={`${item.name} (${item.count})`}
              name="categoryId"
              value={item._id}
            />
          ))}
        </FilterGroup>
        {filters.collections.length ? (
          <FilterGroup title="Collection">
            {filters.collections.map((item) => (
              <Checkbox
                checked={query.collectionId === item._id}
                key={item._id}
                label={`${item.name} (${item.count})`}
                name="collectionId"
                value={item._id}
              />
            ))}
          </FilterGroup>
        ) : null}
        <FilterGroup title="Price">
          <div className="grid grid-cols-2 gap-3">
            <input
              className="h-9 min-w-0 rounded-sm border border-[#e1d6c4] bg-white px-2 text-sm outline-none transition-[border-color,box-shadow] duration-200 focus:border-[#caa14e] focus:shadow-[0_0_0_3px_rgba(202,161,78,0.16)]"
              defaultValue={query.minPrice}
              name="minPrice"
              placeholder={`Min ${filters.price.min}`}
            />
            <input
              className="h-9 min-w-0 rounded-sm border border-[#e1d6c4] bg-white px-2 text-sm outline-none transition-[border-color,box-shadow] duration-200 focus:border-[#caa14e] focus:shadow-[0_0_0_3px_rgba(202,161,78,0.16)]"
              defaultValue={query.maxPrice}
              name="maxPrice"
              placeholder={`Max ${filters.price.max}`}
            />
          </div>
        </FilterGroup>
        <FilterGroup title="Size">
          <div className="flex flex-wrap gap-2">
            {filters.sizes.map((size) => (
              <label
                className={`grid size-9 cursor-pointer place-items-center rounded-sm border text-xs font-semibold transition-colors ${
                  query.size === size
                    ? "border-[#6e1423] bg-[#6e1423] text-white shadow-[0_4px_12px_-6px_rgba(110,20,35,0.7)]"
                    : "border-[#e1d6c4] bg-white hover:border-[#caa14e]"
                }`}
                key={size}
              >
                <input
                  className="sr-only"
                  defaultChecked={query.size === size}
                  name="size"
                  type="radio"
                  value={size}
                />
                {size}
              </label>
            ))}
          </div>
        </FilterGroup>
        <FilterGroup title="Color">
          <div className="flex flex-wrap gap-2.5">
            {filters.colors.map((color) => (
              <label
                className={`grid size-7 cursor-pointer place-items-center rounded-full border-2 transition-colors ${
                  query.color === color
                    ? "border-[#6e1423]"
                    : "border-[#e1d6c4] hover:border-[#caa14e]"
                }`}
                key={color}
                title={color}
              >
                <input
                  className="sr-only"
                  defaultChecked={query.color === color}
                  name="color"
                  type="radio"
                  value={color}
                />
                <span
                  className="size-4 rounded-full ring-1 ring-black/5"
                  style={{ backgroundColor: colorToSwatch(color) }}
                />
              </label>
            ))}
          </div>
        </FilterGroup>
        <FilterGroup title="Fabric">
          {filters.fabrics.map((item) => (
            <Checkbox
              checked={query.fabric === item}
              key={item}
              label={item}
              name="fabric"
              value={item}
            />
          ))}
        </FilterGroup>
        {filters.tags.length ? (
          <FilterGroup title="Tags">
            {filters.tags.map((item) => (
              <Checkbox
                checked={query.tagId === item._id}
                key={item._id}
                label={`${item.name} (${item.count})`}
                name="tagId"
                value={item._id}
              />
            ))}
          </FilterGroup>
        ) : null}
        <div className="grid grid-cols-2 gap-3 p-5">
          <a
            className="grid h-10 place-items-center border border-[#6e1423] text-sm font-semibold uppercase tracking-wide text-[#6e1423] transition-colors hover:bg-[#6e1423] hover:text-white"
            href="/shop"
          >
            Reset
          </a>
          <button className="relative h-10 overflow-hidden bg-[#6e1423] text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-[#84182c]">
            <span className="pointer-events-none absolute left-1 top-1 size-1.5 border-l border-t border-[#f0d9a4]/70" />
            <span className="pointer-events-none absolute bottom-1 right-1 size-1.5 border-b border-r border-[#f0d9a4]/70" />
            Apply
          </button>
        </div>
      </form>
    </aside>
  );
}

function FilterGroup({ children, title }: Readonly<{ children: React.ReactNode; title: string }>) {
  return (
    <details className="group px-5 py-4" open>
      <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold uppercase tracking-wide text-[#3d1620]">
        {title}
        <ChevronDown
          aria-hidden="true"
          className="text-[#9b6d35] transition-transform duration-200 group-open:rotate-180"
          size={16}
        />
      </summary>
      <div className="mt-4 grid gap-3">{children}</div>
    </details>
  );
}

function Checkbox({
  checked = false,
  label,
  name = "category",
  value = label,
}: Readonly<{ checked?: boolean; label: string; name?: string; value?: string }>) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-sm text-[#6f6256] transition-colors hover:text-[#3d1620]">
      <input
        className="size-4 rounded-sm border-[#d8c8b1] accent-[#6e1423]"
        defaultChecked={checked}
        name={name}
        type="radio"
        value={value}
      />
      {label}
    </label>
  );
}

function colorToSwatch(color: string) {
  const map: Record<string, string> = {
    black: "#111111",
    cream: "#efe0c8",
    gold: "#c59a45",
    ivory: "#eee3cf",
    mint: "#9bbfac",
    mustard: "#b47a28",
    navy: "#15243b",
    pearl: "#f3ead9",
    rose: "#d59a9a",
    sage: "#909b73",
    wine: "#7e2432",
  };

  return map[color.toLowerCase()] ?? "#a88968";
}

function PromoBand() {
  return (
    <a
      className="group relative mt-8 block overflow-hidden rounded-sm border border-[#e1d6c4]"
      href="/shop?sort=-bestSelling"
    >
      <ResponsiveImage
        alt="Crafted heritage fabric banner"
        aspectRatio="16 / 5"
        className="transition-transform duration-500 group-hover:scale-105"
        sizes="100vw"
        src={heroImage}
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgb(46_12_18/0.82),rgb(46_12_18/0.25))]" />
      <div className="pointer-events-none absolute inset-3 border border-[#caa14e]/40" />
      <div className="absolute inset-0 flex items-center px-6 text-white sm:px-8">
        <div>
          <h2 className="font-serif text-2xl uppercase leading-tight">
            Crafted with Heritage, Worn with Pride.
          </h2>
          <p className="mt-2 text-sm text-white/80">Explore our handpicked premium collection.</p>
          <span className="relative mt-4 inline-flex h-10 items-center gap-2 border border-[#caa14e] bg-[#6e1423] px-5 text-xs font-semibold uppercase tracking-[0.1em] transition-colors group-hover:bg-[#84182c]">
            Explore Collection <Search aria-hidden="true" size={14} />
          </span>
        </div>
      </div>
    </a>
  );
}

/* ---------- Royal ornamental helper (presentational only) ---------- */

function CornerFiligree({ className = "" }: Readonly<{ className?: string }>) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height="30"
      stroke="currentColor"
      strokeWidth="1"
      viewBox="0 0 34 34"
      width="30"
    >
      <path d="M1 12C1 6 6 1 12 1" />
      <path d="M1 20c6 0 11-5 11-11" />
      <circle cx="12" cy="12" fill="currentColor" r="1.6" stroke="none" />
    </svg>
  );
}
