import { Router } from "express";
import { env } from "../config/env.js";
import { runIngestionOnce } from "../services/ingestion.js";

export const refreshRouter = Router();

refreshRouter.post("/", async (_req, res) => {
  if (!env.PUBLIC_REFRESH_ENABLED) {
    return res.status(403).json({ error: "Public refresh is disabled" });
  }

  const stats = await runIngestionOnce();
  if ("alreadyRunning" in stats) {
    return res.status(409).json({ error: "Refresh already running" });
  }

  res.json(stats);
});
