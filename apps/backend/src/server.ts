import { env, isProduction } from "./config/env.js";
import { connectMongo } from "./db/mongoose.js";
import { createApp } from "./app.js";
import { logger } from "./utils/logger.js";

async function bootstrap() {
  if (isProduction) {
    await connectMongo();
  } else {
    void connectMongo().catch((error) => {
      logger.warn({ error }, "MongoDB unavailable; API is running with disconnected health status");
    });
  }

  const app = createApp();
  const server = app.listen(env.BACKEND_PORT, () => {
    logger.info({ port: env.BACKEND_PORT }, "Backend server is running");
  });

  const shutdown = (signal: NodeJS.Signals) => {
    logger.info({ signal }, "Shutting down backend server");
    server.close(() => {
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

bootstrap().catch((error) => {
  logger.fatal({ error }, "Backend bootstrap failed");
  process.exit(1);
});
