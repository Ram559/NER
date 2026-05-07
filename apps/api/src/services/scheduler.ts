import cron from "node-cron";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { runIngestionOnce } from "./ingestion.js";

let running = false;

export function startScheduler() {
  if (!env.CRON_ENABLED) {
    logger.info("cron disabled");
    return;
  }

  cron.schedule(env.INGESTION_CRON, async () => {
    if (running) return;
    running = true;
    try {
      const stats = await runIngestionOnce();
      logger.info(stats, "scheduled ingestion completed");
    } catch (error) {
      logger.error({ error }, "scheduled ingestion failed");
    } finally {
      running = false;
    }
  });

  logger.info({ schedule: env.INGESTION_CRON }, "scheduler started");
}
