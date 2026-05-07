import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { createApp } from "./app.js";
import { prisma } from "./services/prisma.js";
import { startScheduler } from "./services/scheduler.js";
import { ensureBootstrapData } from "./services/bootstrap.js";
import { runIngestionOnce } from "./services/ingestion.js";

const app = createApp();
await ensureBootstrapData();

const server = app.listen(env.API_PORT, () => {
  logger.info({ port: env.API_PORT }, "api listening");
  startScheduler();
  if (env.INITIAL_INGESTION_ENABLED) {
    runIngestionOnce()
      .then((stats) => logger.info(stats, "initial ingestion completed"))
      .catch((error) => logger.error({ error }, "initial ingestion failed"));
  }
});

async function shutdown(signal: string) {
  logger.info({ signal }, "shutting down");
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
