import { Router } from "express";
import { prisma } from "../services/prisma.js";

export const sourcesRouter = Router();

sourcesRouter.get("/", async (_req, res) => {
  const sources = await prisma.source.findMany({
    where: { enabled: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      homepageUrl: true,
      feedUrl: true,
      type: true,
      enabled: true,
      respectRobots: true
    }
  });
  res.json(sources);
});
