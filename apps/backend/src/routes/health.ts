import type { HealthStatus } from "@vastra/shared";
import { Router } from "express";
import { getDatabaseStatus } from "../db/mongoose.js";

export const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  const payload: HealthStatus = {
    status: "ok",
    service: "vastra-house-api",
    version: "v1",
    timestamp: new Date().toISOString(),
    database: getDatabaseStatus(),
  };

  res.json(payload);
});
