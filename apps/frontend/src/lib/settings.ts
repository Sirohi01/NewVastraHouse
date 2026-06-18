import { apiFetch } from "@/lib/api";

export type RuntimeSetting = {
  key: string;
  label: string;
  category: string;
  type: "boolean" | "number" | "secret" | "string" | "url";
  envValue: string;
  effectiveValue: string;
  overrideValue: string;
  hasOverride: boolean;
  impact: string;
  runtimePriority: boolean;
  requiresRestart?: boolean;
};

export function fetchAdminSettings(accessToken?: string) {
  return apiFetch<{ settings: RuntimeSetting[] }>("/settings/admin", { accessToken });
}

export function saveAdminSettings(values: Record<string, string>, accessToken?: string) {
  return apiFetch<{ settings: RuntimeSetting[] }>("/settings/admin", {
    accessToken,
    body: JSON.stringify({ values }),
    method: "PUT",
  });
}
