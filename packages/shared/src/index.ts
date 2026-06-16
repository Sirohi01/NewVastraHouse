export const API_VERSION = "v1";

export type HealthStatus = {
  status: "ok";
  service: string;
  version: string;
  timestamp: string;
  database: "connected" | "disconnected" | "connecting" | "unknown";
};

export const moduleBoundaries = [
  "catalog",
  "inventory",
  "manufacturing",
  "orders",
  "payments",
  "crm",
  "marketing",
  "seo",
  "cms",
] as const;

export type ModuleBoundary = (typeof moduleBoundaries)[number];
