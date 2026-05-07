import { Router } from "express";
import { z } from "zod";
import { SourceType } from "@prisma/client";
import { requireAdmin } from "../middleware/auth.js";
import { prisma } from "../services/prisma.js";

export const sourcesRouter = Router();

const SourceSchema = z.object({
  name: z.string().trim().min(2).max(120),
  homepageUrl: z.string().url(),
  feedUrl: z.string().url(),
  type: z.nativeEnum(SourceType).default(SourceType.RSS),
  enabled: z.boolean().default(true),
  respectRobots: z.boolean().default(true)
});

sourcesRouter.get("/", async (_req, res) => {
  const sources = await prisma.source.findMany({ orderBy: { name: "asc" } });
  res.json(sources);
});

sourcesRouter.post("/", requireAdmin, async (req, res) => {
  const data = SourceSchema.parse(req.body);
  const source = await prisma.source.create({ data });
  await prisma.adminAction.create({ data: { action: "source.create", targetId: source.id, metadata: data } });
  res.status(201).json(source);
});

sourcesRouter.put("/:id", requireAdmin, async (req, res) => {
  const data = SourceSchema.partial().parse(req.body);
  const source = await prisma.source.update({ where: { id: req.params.id }, data });
  await prisma.adminAction.create({ data: { action: "source.update", targetId: source.id, metadata: data } });
  res.json(source);
});

sourcesRouter.delete("/:id", requireAdmin, async (req, res) => {
  await prisma.source.delete({ where: { id: req.params.id } });
  await prisma.adminAction.create({ data: { action: "source.delete", targetId: req.params.id } });
  res.status(204).end();
});
