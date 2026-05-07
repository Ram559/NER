import { Router } from "express";
import { z } from "zod";
import { requireAdmin } from "../middleware/auth.js";
import { prisma } from "../services/prisma.js";
import { runIngestionOnce } from "../services/ingestion.js";

export const adminRouter = Router();

adminRouter.use(requireAdmin);

adminRouter.post("/ingest", async (_req, res) => {
  const stats = await runIngestionOnce();
  if ("alreadyRunning" in stats) {
    return res.status(409).json({ error: "Refresh already running" });
  }
  res.json(stats);
});

adminRouter.get("/queue", async (_req, res) => {
  const articles = await prisma.article.findMany({
    where: { status: "PENDING" },
    include: { source: true, categories: true, persons: true },
    orderBy: { createdAt: "desc" },
    take: 100
  });
  res.json(articles);
});

adminRouter.post("/articles/:id/status", async (req, res) => {
  const body = z.object({ status: z.enum(["PENDING", "APPROVED", "REJECTED"]) }).parse(req.body);
  const article = await prisma.article.update({ where: { id: req.params.id }, data: { status: body.status } });
  await prisma.adminAction.create({ data: { action: `article.${body.status.toLowerCase()}`, targetId: article.id } });
  res.json(article);
});

adminRouter.get("/blocklist", async (_req, res) => {
  res.json(await prisma.blocklistKeyword.findMany({ orderBy: { keyword: "asc" } }));
});

adminRouter.post("/blocklist", async (req, res) => {
  const body = z.object({ keyword: z.string().trim().min(2).max(80), enabled: z.boolean().default(true) }).parse(req.body);
  const item = await prisma.blocklistKeyword.upsert({
    where: { keyword: body.keyword },
    create: body,
    update: { enabled: body.enabled }
  });
  res.status(201).json(item);
});

adminRouter.get("/prompts", async (_req, res) => {
  res.json(await prisma.aiPrompt.findMany({ orderBy: { key: "asc" } }));
});

adminRouter.put("/prompts/:key", async (req, res) => {
  const body = z.object({ content: z.string().trim().min(20) }).parse(req.body);
  const prompt = await prisma.aiPrompt.upsert({
    where: { key: req.params.key },
    create: { key: req.params.key, content: body.content },
    update: { content: body.content }
  });
  res.json(prompt);
});

adminRouter.delete("/cache", async (_req, res) => {
  const result = await prisma.cacheEntry.deleteMany();
  await prisma.adminAction.create({ data: { action: "cache.clear", metadata: { count: result.count } } });
  res.json({ deleted: result.count });
});
