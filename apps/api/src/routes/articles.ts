import { Router } from "express";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../services/prisma.js";
import { isVisibleCategory } from "../utils/categories.js";
import { stripSummaryBoilerplate } from "../utils/text.js";

export const articlesRouter = Router();

const QuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  source: z.string().trim().max(80).optional(),
  category: z.string().trim().max(80).optional(),
  person: z.string().trim().max(80).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20)
});

function articleInclude() {
  return {
    source: { select: { name: true, homepageUrl: true } },
    categories: { select: { name: true } },
    tags: { select: { name: true } },
    persons: { select: { name: true } },
    storyGroup: { select: { id: true, title: true } }
  } satisfies Prisma.ArticleInclude;
}

function presentArticle<T extends { summary: string | null; categories: { name: string }[] }>(article: T) {
  return {
    ...article,
    summary: stripSummaryBoilerplate(article.summary),
    categories: article.categories.filter((category) => isVisibleCategory(category.name))
  };
}

articlesRouter.get("/", async (req, res) => {
  const query = QuerySchema.parse(req.query);
  const where: Prisma.ArticleWhereInput = {
    status: "APPROVED",
    ...(query.source ? { source: { name: query.source } } : {}),
    ...(query.category ? { categories: { some: { name: query.category } } } : {}),
    ...(query.person ? { persons: { some: { name: query.person } } } : {})
  };

  if (query.from || query.to) {
    where.publishedAt = { gte: query.from, lte: query.to };
  }

  if (query.q) {
    const ids = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id
      FROM "Article"
      WHERE status = 'APPROVED'
        AND to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(summary, '')) @@ plainto_tsquery('simple', ${query.q})
      ORDER BY "publishedAt" DESC
      LIMIT ${query.limit * 5}
    `;
    where.id = { in: ids.map((row) => row.id) };
  }

  const [items, total] = await Promise.all([
    prisma.article.findMany({
      where,
      include: articleInclude(),
      orderBy: { publishedAt: "desc" },
      skip: (query.page - 1) * query.limit,
      take: query.limit
    }),
    prisma.article.count({ where })
  ]);

  res.json({ items: items.map(presentArticle), total, page: query.page, limit: query.limit });
});

articlesRouter.get("/:id", async (req, res) => {
  const article = await prisma.article.findFirst({
    where: { id: req.params.id, status: "APPROVED" },
    include: articleInclude()
  });

  if (!article) return res.status(404).json({ error: "Article not found" });
  res.json(presentArticle(article));
});
