import { Router } from "express";
import { prisma } from "../services/prisma.js";

export const statsRouter = Router();

statsRouter.get("/home", async (_req, res) => {
  const [trendingCategories, mentionedPersons, latestRun, sources] = await Promise.all([
    prisma.category.findMany({
      select: { name: true, _count: { select: { articles: true } } },
      orderBy: { articles: { _count: "desc" } },
      take: 10
    }),
    prisma.person.findMany({
      select: { name: true, _count: { select: { articles: true } } },
      orderBy: { articles: { _count: "desc" } },
      take: 10
    }),
    prisma.ingestionRun.findFirst({ orderBy: { startedAt: "desc" } }),
    prisma.source.findMany({ where: { enabled: true }, select: { name: true } })
  ]);

  res.json({ trendingCategories, mentionedPersons, latestRun, sources });
});

statsRouter.get("/timeline", async (_req, res) => {
  const rows = await prisma.$queryRaw<{ day: Date; count: bigint }[]>`
    SELECT date_trunc('day', "publishedAt") AS day, count(*) AS count
    FROM "Article"
    WHERE status = 'APPROVED' AND "publishedAt" > now() - interval '30 days'
    GROUP BY 1
    ORDER BY 1 DESC
  `;

  res.json(rows.map((row) => ({ day: row.day, count: Number(row.count) })));
});
