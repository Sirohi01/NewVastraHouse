"use client";

import { Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Tabs } from "@/components/ui/Tabs";
import { fetchAdminSettings, saveAdminSettings, type RuntimeSetting } from "@/lib/settings";
import { useAuthStore } from "@/stores/authStore";

export default function AdminSettingsPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [settings, setSettings] = useState<RuntimeSetting[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [activeCategory, setActiveCategory] = useState("");

  const grouped = useMemo(() => {
    const map = new Map<string, RuntimeSetting[]>();

    for (const setting of settings) {
      map.set(setting.category, [...(map.get(setting.category) ?? []), setting]);
    }

    return [...map.entries()];
  }, [settings]);
  const categories = useMemo(
    () => grouped.map(([category]) => ({ label: category, value: category })),
    [grouped],
  );
  const activeSettings =
    grouped.find(([category]) => category === activeCategory)?.[1] ?? grouped[0]?.[1] ?? [];

  useEffect(() => {
    async function load() {
      try {
        const payload = await fetchAdminSettings(accessToken);
        setSettings(payload.settings);
        setValues(
          Object.fromEntries(payload.settings.map((item) => [item.key, item.overrideValue])),
        );
        setActiveCategory((current) => current || payload.settings[0]?.category || "");
        setMessage("Settings loaded");
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Settings load failed");
      }
    }

    void load();
  }, [accessToken]);

  async function save() {
    setMessage("Saving settings...");
    try {
      const payload = await saveAdminSettings(values, accessToken);
      setSettings(payload.settings);
      setValues(Object.fromEntries(payload.settings.map((item) => [item.key, item.overrideValue])));
      setMessage("Settings saved. Runtime-aware settings use admin values first, then .env.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Settings save failed");
    }
  }

  return (
    <ProtectedRoute adminOnly>
      <main className="mx-auto max-w-7xl">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold leading-tight">Settings</h1>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
              Admin values override matching .env values for runtime-aware settings. If an admin
              value is blank or missing, the backend falls back to .env. Security keys, ports, and
              build-time values may require a server restart or redeploy.
            </p>
          </div>
          <button
            className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"
            onClick={() => void save()}
            type="button"
          >
            <Save aria-hidden="true" size={16} />
            Save Settings
          </button>
        </div>

        {message ? <p className="mb-4 text-sm font-semibold text-accent">{message}</p> : null}

        {categories.length ? (
          <Tabs
            active={activeCategory || categories[0].value}
            items={categories}
            onChange={setActiveCategory}
          />
        ) : null}

        <section className="mt-4 rounded-lg border border-border bg-card p-4 shadow-soft">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {activeSettings.map((setting) => (
              <SettingCard
                key={setting.key}
                onChange={(value) => setValues((current) => ({ ...current, [setting.key]: value }))}
                setting={setting}
                value={values[setting.key] ?? ""}
              />
            ))}
          </div>
        </section>
      </main>
    </ProtectedRoute>
  );
}

function SettingCard({
  onChange,
  setting,
  value,
}: Readonly<{
  onChange: (value: string) => void;
  setting: RuntimeSetting;
  value: string;
}>) {
  return (
    <div className="grid min-h-[318px] content-start gap-3 rounded-md border border-border p-3">
      <div>
        <p className="text-sm font-semibold">{setting.label}</p>
        <p className="mt-1 font-mono text-[11px] text-muted-foreground">{setting.key}</p>
        <div className="mt-2 flex flex-wrap gap-1.5 text-[9px] font-bold uppercase">
          <span className="rounded-full bg-muted px-2 py-1 text-muted-foreground">
            {setting.type}
          </span>
          <span
            className={`rounded-full px-2 py-1 ${
              setting.runtimePriority
                ? "bg-emerald-50 text-emerald-700"
                : "bg-amber-50 text-amber-700"
            }`}
          >
            {setting.runtimePriority ? "API priority" : "Restart/build may be needed"}
          </span>
        </div>
      </div>

      <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Admin override
        {setting.type === "boolean" ? (
          <select
            className="mt-1 h-10 w-full rounded-md border border-border px-3 text-sm normal-case tracking-normal"
            onChange={(event) => onChange(event.target.value)}
            value={value}
          >
            <option value="">Use .env value</option>
            <option value="true">true</option>
            <option value="false">false</option>
          </select>
        ) : (
          <input
            className="mt-1 h-10 w-full rounded-md border border-border px-3 text-sm normal-case tracking-normal"
            onChange={(event) => onChange(event.target.value)}
            placeholder={
              setting.type === "secret" ? "Leave blank to use .env secret" : "Use .env value"
            }
            type={
              setting.type === "secret" ? "password" : setting.type === "number" ? "number" : "text"
            }
            value={value}
          />
        )}
      </label>

      <div className="grid gap-1 rounded-md bg-muted/50 p-3 text-xs leading-5 text-muted-foreground">
        <p className="break-words">
          <span className="font-semibold text-foreground">Current effective value:</span>{" "}
          {displayValue(setting.type, setting.effectiveValue)}
        </p>
        <p className="break-words">
          <span className="font-semibold text-foreground">.env fallback:</span>{" "}
          {displayValue(setting.type, setting.envValue)}
        </p>
        <p>
          <span className="font-semibold text-foreground">Impact:</span> {setting.impact}
        </p>
      </div>
    </div>
  );
}

function displayValue(type: RuntimeSetting["type"], value: string) {
  if (!value) {
    return "blank";
  }

  return type === "secret" ? "********" : value;
}
