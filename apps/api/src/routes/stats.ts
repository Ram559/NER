import { Router } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../services/prisma.js";
import { normalizeCategory, visibleCategoryNames } from "../utils/categories.js";

export const statsRouter = Router();

const personWeights: Record<string, number> = {
  "orban viktor": 34,
  "rogan antal": 30,
  "meszaros lorinc": 24,
  "tiborcz istvan": 24,
  "lazar janos": 20,
  "balasy gyula": 18,
  "matolcsy gyorgy": 18,
  "magyar peter": 14
};

const categoryWeights: Record<string, number> = {
  "ner bukas": 10,
  korrupcio: 18,
  "eu penzek": 16,
  "allami tender": 14,
  propaganda: 12
};

const negativeWeights: Record<string, number> = {
  nyomozas: 18,
  feljelentes: 16,
  gyanus: 12,
  korrupcio: 18,
  bukas: 14,
  lemond: 12,
  befagyott: 12,
  vagyon: 10,
  elszamoltatas: 12,
  hatosag: 10
};

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

async function getBarometer() {
  const articles = await prisma.article.findMany({
    where: {
      status: "APPROVED",
      publishedAt: { gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30) },
      categories: { some: { name: { in: visibleCategoryNames() } } }
    },
    include: {
      categories: { select: { name: true } },
      persons: { select: { name: true } }
    },
    orderBy: { publishedAt: "desc" },
    take: 120
  });

  let weightedSignal = 0;
  const signals: { label: string; weight: number }[] = [];

  for (const article of articles) {
    const ageDays = Math.max(0, (Date.now() - article.publishedAt.getTime()) / (1000 * 60 * 60 * 24));
    const recency = Math.max(0.25, 1 - ageDays / 30);
    const text = normalize(`${article.title} ${article.summary ?? ""}`);
    const categoryScore = article.categories.reduce((sum, category) => sum + (categoryWeights[normalizeCategory(category.name)] ?? 0), 0);
    const personScore = article.persons.reduce((sum, person) => sum + (personWeights[normalize(person.name)] ?? 0), 0);
    const negativeScore = Object.entries(negativeWeights).reduce((sum, [keyword, weight]) => sum + (text.includes(keyword) ? weight : 0), 0);
    const articleSignal = Math.min(70, categoryScore + personScore + negativeScore) * recency;
    weightedSignal += articleSignal;

    if (personScore > 0 || negativeScore > 0) {
      signals.push({
        label: article.persons[0]?.name ?? article.categories[0]?.name ?? article.title,
        weight: Math.round(articleSignal)
      });
    }
  }

  const score = Math.max(0, Math.min(100, Math.round(100 * (1 - Math.exp(-weightedSignal / 260)))));
  return {
    score,
    level: score >= 75 ? "forrpont" : score >= 50 ? "erősödő" : score >= 25 ? "figyelendő" : "csendes",
    weightedSignal: Math.round(weightedSignal),
    articleCount: articles.length,
    topSignals: signals.sort((left, right) => right.weight - left.weight).slice(0, 3)
  };
}

statsRouter.get("/home", async (_req, res) => {
  const [trendingCategories, mentionedPersons, latestRun, sources, barometer] = await Promise.all([
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
    prisma.source.findMany({ where: { enabled: true }, select: { name: true } }),
    getBarometer()
  ]);

  res.json({ trendingCategories, mentionedPersons, latestRun, sources, barometer });
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
