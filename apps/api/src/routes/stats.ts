import { Router } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../services/prisma.js";
import { visibleCategoryNames } from "../utils/categories.js";

export const statsRouter = Router();

statsRouter.get("/home", async (_req, res) => {
  const [trendingCategories, mentionedPersons, latestRun, sources] = await Promise.all([
    prisma.category.findMany({
      where: { name: { in: visibleCategoryNames() } },
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
  const categories = visibleCategoryNames();
  const rows = await prisma.$queryRaw<{ day: Date; count: bigint }[]>`
    SELECT date_trunc('day', a."publishedAt") AS day, count(DISTINCT a.id) AS count
    FROM "Article" a
    JOIN "_ArticleToCategory" ac ON ac."A" = a.id
    JOIN "Category" c ON c.id = ac."B"
    WHERE a.status = 'APPROVED'
      AND a."publishedAt" > now() - interval '30 days'
      AND c.name IN (${Prisma.join(categories)})
    GROUP BY 1
    ORDER BY 1 DESC
  `;

  res.json(rows.map((row) => ({ day: row.day, count: Number(row.count) })));
});
