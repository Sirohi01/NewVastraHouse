"use client";

import { Edit3, Plus, RefreshCw, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { EmptyState } from "@/components/states/EmptyState";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";

type TaxonomyKind = "categories" | "collections" | "tags";

type TaxonomyItem = {
  _id: string;
  brandId?: string;
  name: string;
  slug: string;
  description?: string;
  active: boolean;
};

type TaxonomyForm = {
  brandId: string;
  name: string;
  slug: string;
  description: string;
  active: boolean;
};

const tabs: { label: string; value: TaxonomyKind }[] = [
  { label: "Categories", value: "categories" },
  { label: "Collections", value: "collections" },
  { label: "Tags", value: "tags" },
];

const blankForm: TaxonomyForm = {
  brandId: "",
  name: "",
  slug: "",
  description: "",
  active: true,
};

export default function AdminCatalogPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [kind, setKind] = useState<TaxonomyKind>("categories");
  const [items, setItems] = useState<TaxonomyItem[]>([]);
  const [form, setForm] = useState<TaxonomyForm>(blankForm);
  const [editingId, setEditingId] = useState<string>();
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  async function loadItems(nextKind = kind) {
    setMessage("Loading catalog data...");
    const params = new URLSearchParams({ sort: "name" });

    if (search) {
      params.set("search", search);
    }

    const payload = await apiFetch<{ data: TaxonomyItem[] }>(
      `/catalog/admin/${nextKind}?${params.toString()}`,
      { accessToken },
    );
    setItems(payload.data);
    setMessage(`${labelFor(nextKind)} loaded`);
  }

  useEffect(() => {
    if (accessToken) {
      void loadItems(kind);
    }
  }, [accessToken, kind]);

  function updateForm(field: keyof TaxonomyForm, value: string | boolean) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function selectKind(nextKind: TaxonomyKind) {
    setKind(nextKind);
    setEditingId(undefined);
    setForm(blankForm);
  }

  function editItem(item: TaxonomyItem) {
    setEditingId(item._id);
    setForm({
      brandId: item.brandId ? String(item.brandId) : "",
      name: item.name,
      slug: item.slug,
      description: item.description ?? "",
      active: item.active,
    });
    setMessage(`Editing ${item.name}`);
  }

  async function saveItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("Saving catalog data...");
    const payload =
      kind === "tags"
        ? { name: form.name, slug: form.slug || undefined, active: form.active }
        : {
            brandId: kind === "collections" ? form.brandId : undefined,
            name: form.name,
            slug: form.slug || undefined,
            description: form.description || undefined,
            active: form.active,
          };
    const path = editingId ? `/catalog/admin/${kind}/${editingId}` : `/catalog/admin/${kind}`;
    const method = editingId ? "PATCH" : "POST";
    await apiFetch(path, { accessToken, method, body: JSON.stringify(payload) });
    setEditingId(undefined);
    setForm(blankForm);
    setMessage("Catalog data saved");
    await loadItems();
  }

  async function deleteItem(id: string) {
    setMessage("Deleting catalog data...");
    await apiFetch(`/catalog/admin/${kind}/${id}`, { accessToken, method: "DELETE" });
    setMessage("Catalog data deleted");
    await loadItems();
  }

  return (
    <ProtectedRoute>
      <section className="mx-auto min-h-[calc(100vh-144px)] max-w-6xl px-5 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Catalog</h1>
            <p className="text-sm text-muted-foreground">
              {message || "Manage categories, collections, and tags."}
            </p>
          </div>
          <button
            className="inline-flex h-10 items-center gap-2 rounded-md border border-border px-3 font-semibold"
            onClick={() => void loadItems()}
            type="button"
          >
            <RefreshCw aria-hidden="true" size={18} />
            Refresh
          </button>
        </div>

        <div className="mb-5 flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              className={`h-10 rounded-md border px-4 font-semibold ${
                kind === tab.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card"
              }`}
              key={tab.value}
              onClick={() => selectKind(tab.value)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4">
            <div className="flex gap-3 rounded-lg border border-border bg-card p-4">
              <input
                className="h-10 min-w-0 flex-1 rounded-md border border-border px-3"
                onChange={(event) => setSearch(event.target.value)}
                placeholder={`Search ${labelFor(kind).toLowerCase()}`}
                value={search}
              />
              <button
                className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-3 font-semibold text-primary-foreground"
                onClick={() => void loadItems()}
                type="button"
              >
                <RefreshCw aria-hidden="true" size={18} />
                Search
              </button>
            </div>

            {items.length ? (
              <div className="overflow-hidden rounded-lg border border-border bg-card">
                <table className="w-full border-collapse text-sm">
                  <thead className="bg-muted text-left">
                    <tr>
                      <th className="p-3">Name</th>
                      <th className="p-3">Slug</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr className="border-t border-border" key={item._id}>
                        <td className="p-3 font-semibold">{item.name}</td>
                        <td className="p-3 text-muted-foreground">{item.slug}</td>
                        <td className="p-3">{item.active ? "Active" : "Inactive"}</td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <button
                              className="inline-flex size-9 items-center justify-center rounded-md border border-border"
                              onClick={() => editItem(item)}
                              title="Edit"
                              type="button"
                            >
                              <Edit3 aria-hidden="true" size={16} />
                            </button>
                            <button
                              className="inline-flex size-9 items-center justify-center rounded-md border border-border text-primary"
                              onClick={() => void deleteItem(item._id)}
                              title="Delete"
                              type="button"
                            >
                              <Trash2 aria-hidden="true" size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                title={`No ${labelFor(kind).toLowerCase()}`}
                message="Create the first item."
              />
            )}
          </div>

          <form
            className="space-y-4 rounded-lg border border-border bg-card p-5"
            onSubmit={saveItem}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editingId ? "Edit" : "Create"}</h2>
              <button className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-3 font-semibold text-primary-foreground">
                {editingId ? (
                  <Save aria-hidden="true" size={18} />
                ) : (
                  <Plus aria-hidden="true" size={18} />
                )}
                Save
              </button>
            </div>

            {kind === "collections" ? (
              <Field
                label="Brand ID"
                onChange={(value) => updateForm("brandId", value)}
                required
                value={form.brandId}
              />
            ) : null}
            <Field
              label="Name"
              onChange={(value) => updateForm("name", value)}
              required
              value={form.name}
            />
            <Field label="Slug" onChange={(value) => updateForm("slug", value)} value={form.slug} />
            {kind !== "tags" ? (
              <label className="block text-sm font-medium">
                Description
                <textarea
                  className="mt-1 min-h-24 w-full rounded-md border border-border px-3 py-2"
                  onChange={(event) => updateForm("description", event.target.value)}
                  value={form.description}
                />
              </label>
            ) : null}
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                checked={form.active}
                onChange={(event) => updateForm("active", event.target.checked)}
                type="checkbox"
              />
              Active
            </label>
          </form>
        </div>
      </section>
    </ProtectedRoute>
  );
}

function Field({
  label,
  onChange,
  required,
  value,
}: Readonly<{
  label: string;
  onChange: (value: string) => void;
  required?: boolean;
  value: string;
}>) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <input
        className="mt-1 h-10 w-full rounded-md border border-border px-3"
        onChange={(event) => onChange(event.target.value)}
        required={required}
        value={value}
      />
    </label>
  );
}

function labelFor(kind: TaxonomyKind): string {
  return tabs.find((tab) => tab.value === kind)?.label ?? "Catalog";
}
