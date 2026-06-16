import { API_VERSION } from "@vastra/shared";
import express from "express";
import { securityMiddleware } from "./config/security.js";
import { requestId, errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { healthRouter } from "./routes/health.js";

export function createApp() {
  const app = express();

  app.use(requestId);
  app.use(requestLogger);
  app.use(securityMiddleware);
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: false, limit: "1mb" }));

  app.use(`/api/${API_VERSION}/health`, healthRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
