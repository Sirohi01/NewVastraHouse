"use client";

import { Edit3, Plus, RefreshCw, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { EmptyState } from "@/components/states/EmptyState";
import { Checkbox } from "@/components/ui/Checkbox";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DataTable } from "@/components/ui/DataTable";
import { Field } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { Tabs } from "@/components/ui/Tabs";
import { Textarea } from "@/components/ui/Textarea";
import { errorMessage, useToast } from "@/components/ui/Toast";
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
  const toast = useToast();
  const [kind, setKind] = useState<TaxonomyKind>("categories");
  const [items, setItems] = useState<TaxonomyItem[]>([]);
  const [form, setForm] = useState<TaxonomyForm>(blankForm);
  const [editingId, setEditingId] = useState<string>();
  const [editorOpen, setEditorOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TaxonomyItem>();

  async function loadItems(nextKind: TaxonomyKind = kind) {
    setLoading(true);
    try {
      const params = new URLSearchParams({ sort: "name" });

      if (search) {
        params.set("search", search);
      }

      const payload = await apiFetch<{ data: TaxonomyItem[] }>(
        `/catalog/admin/${nextKind}?${params.toString()}`,
        { accessToken },
      );
      setItems(payload.data);
    } catch (error) {
      toast.error(errorMessage(error, "Failed to load catalog data"));
    } finally {
      setLoading(false);
    }
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
  }

  function openCreate() {
    setEditingId(undefined);
    setForm(blankForm);
    setEditorOpen(true);
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
    setEditorOpen(true);
  }

  async function saveItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
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

    try {
      await apiFetch(path, { accessToken, method, body: JSON.stringify(payload) });
      setEditorOpen(false);
      setEditingId(undefined);
      setForm(blankForm);
      toast.success("Catalog data saved");
      await loadItems();
    } catch (error) {
      toast.error(errorMessage(error, "Failed to save catalog data"));
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) {
      return;
    }

    try {
      await apiFetch(`/catalog/admin/${kind}/${deleteTarget._id}`, {
        accessToken,
        method: "DELETE",
      });
      toast.success("Catalog data deleted");
      setDeleteTarget(undefined);
      await loadItems();
    } catch (error) {
      toast.error(errorMessage(error, "Failed to delete catalog data"));
    }
  }

  return (
    <ProtectedRoute>
      <section className="mx-auto max-w-6xl">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-semibold">Catalog</h1>
            <p className="text-sm text-muted-foreground">
              Manage categories, collections, and tags.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-card px-3 text-sm font-semibold"
              onClick={() => void loadItems()}
              type="button"
            >
              <RefreshCw aria-hidden="true" size={16} />
              Refresh
            </button>
            <button
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground"
              onClick={openCreate}
              type="button"
            >
              <Plus aria-hidden="true" size={16} />
              New {tabs.find((tab) => tab.value === kind)?.label.replace(/s$/, "")}
            </button>
          </div>
        </div>

        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <Tabs active={kind} items={tabs} onChange={selectKind} />
          <div className="flex gap-2">
            <input
              className="h-9 w-48 rounded-md border border-border px-2.5 text-sm"
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  void loadItems();
                }
              }}
              placeholder={`Search ${labelFor(kind).toLowerCase()}`}
              value={search}
            />
            <button
              className="inline-flex h-9 items-center rounded-md border border-border px-3 text-sm font-semibold"
              onClick={() => void loadItems()}
              type="button"
            >
              Search
            </button>
          </div>
        </div>

        {items.length ? (
          <DataTable
            columns={[
              {
                header: "Name",
                render: (item) => <span className="font-semibold">{item.name}</span>,
              },
              {
                header: "Slug",
                render: (item) => <span className="text-muted-foreground">{item.slug}</span>,
              },
              { header: "Status", render: (item) => (item.active ? "Active" : "Inactive") },
              {
                align: "right",
                header: "Actions",
                render: (item) => (
                  <div className="flex justify-end gap-1.5">
                    <button
                      className="inline-flex size-8 items-center justify-center rounded-md border border-border"
                      onClick={() => editItem(item)}
                      title="Edit"
                      type="button"
                    >
                      <Edit3 aria-hidden="true" size={14} />
                    </button>
                    <button
                      className="inline-flex size-8 items-center justify-center rounded-md border border-border text-destructive"
                      onClick={() => setDeleteTarget(item)}
                      title="Delete"
                      type="button"
                    >
                      <Trash2 aria-hidden="true" size={14} />
                    </button>
                  </div>
                ),
              },
            ]}
            emptyMessage={loading ? "Loading..." : `No ${labelFor(kind).toLowerCase()} yet.`}
            getRowKey={(item) => item._id}
            rows={items}
          />
        ) : (
          <EmptyState
            title={`No ${labelFor(kind).toLowerCase()}`}
            message={loading ? "Loading..." : "Create the first item."}
          />
        )}

        <Modal
          onClose={() => setEditorOpen(false)}
          open={editorOpen}
          size="sm"
          title={editingId ? "Edit item" : "Create item"}
        >
          <form className="space-y-3" onSubmit={saveItem}>
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
              <Textarea
                label="Description"
                onChange={(value) => updateForm("description", value)}
                value={form.description}
              />
            ) : null}
            <Checkbox
              checked={form.active}
              label="Active"
              onChange={(value) => updateForm("active", value)}
            />
            <div className="flex justify-end gap-2 pt-1">
              <button
                className="h-9 rounded-md border border-border px-3 text-sm font-semibold"
                onClick={() => setEditorOpen(false)}
                type="button"
              >
                Cancel
              </button>
              <button className="h-9 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground">
                Save
              </button>
            </div>
          </form>
        </Modal>

        <ConfirmDialog
          confirmLabel="Delete"
          message={`This will permanently delete "${deleteTarget?.name}". This cannot be undone.`}
          onCancel={() => setDeleteTarget(undefined)}
          onConfirm={confirmDelete}
          open={!!deleteTarget}
          title="Delete item"
        />
      </section>
    </ProtectedRoute>
  );
}

function labelFor(kind: TaxonomyKind): string {
  return tabs.find((tab) => tab.value === kind)?.label ?? "Catalog";
}
