import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { pinoHttp } from "pino-http";
import { corsOrigins } from "./config/env.js";
import { logger } from "./config/logger.js";
import { healthRouter } from "./routes/health.js";
import { articlesRouter } from "./routes/articles.js";
import { sourcesRouter } from "./routes/sources.js";
import { statsRouter } from "./routes/stats.js";
import { sitemapRouter } from "./routes/sitemap.js";
import { refreshRouter } from "./routes/refresh.js";
import { errorHandler, notFound } from "./middleware/error.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(
    cors({
      origin: corsOrigins,
      credentials: false
    })
  );
  app.use(express.json({ limit: "500kb" }));
  app.use(pinoHttp({ logger }));
  app.use(
    rateLimit({
      windowMs: 60_000,
      limit: 120,
      standardHeaders: true,
      legacyHeaders: false
    })
  );

  app.use("/api/health", healthRouter);
  app.use("/api/articles", articlesRouter);
  app.use("/api/sources", sourcesRouter);
  app.use("/api/stats", statsRouter);
  app.use("/api/refresh", refreshRouter);
  app.use("/api/sitemap.xml", sitemapRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
