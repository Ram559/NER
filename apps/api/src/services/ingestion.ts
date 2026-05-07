import { ArticleStatus, Source } from "@prisma/client";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { analyzeArticle } from "./ai.js";
import { findDuplicate, ensureStoryGroup, titleHash } from "./dedupe.js";
import { fetchFeed, FeedItem } from "./rss.js";
import { prisma } from "./prisma.js";
import { canonicalizeUrl, cleanText, stableHash } from "../utils/text.js";

type IngestionStats = {
  importedCount: number;
  duplicateCount: number;
  rejectedCount: number;
  errorCount: number;
};

const POLITICAL_KEYWORDS = [
  "ner",
  "fidesz",
  "orban",
  "orbán",
  "magyar peter",
  "magyar péter",
  "tisza",
  "balasy",
  "balásy",
  "lazar",
  "lázár",
  "rogan",
  "rogán",
  "meszaros",
  "mészáros",
  "tiborcz",
  "matolcsy",
  "mnb",
  "asz",
  "ász",
  "ugyeszseg",
  "ügyészség",
  "nyomozas",
  "nyomozás",
  "feljelentes",
  "feljelentés",
  "korrupcio",
  "korrupció",
  "kozbeszerzes",
  "közbeszerzés",
  "tender",
  "allami",
  "állami",
  "eu penz",
  "eu-s pénz",
  "unios penz",
  "uniós pénz",
  "propaganda",
  "vagyon",
  "lemond",
  "bukás",
  "vereség",
  "elszámoltatás",
  "kastelyprivatizacio",
  "kastélyprivatizáció"
];

let ingestionRunning = false;

async function isBlocked(title: string, snippet?: string): Promise<boolean> {
  const keywords = await prisma.blocklistKeyword.findMany({ where: { enabled: true } });
  const haystack = `${title} ${snippet ?? ""}`.toLowerCase();
  return keywords.some((entry) => haystack.includes(entry.keyword.toLowerCase()));
}

function matchesPoliticalFilter(title: string, snippet?: string): boolean {
  if (!env.POLITICAL_FILTER_ENABLED) return true;
  const haystack = `${title} ${snippet ?? ""}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
  return POLITICAL_KEYWORDS.some((keyword) => haystack.includes(keyword.normalize("NFD").replace(/\p{Diacritic}/gu, "")));
}

async function upsertNames(model: "category" | "tag" | "person", names: string[]) {
  const uniqueNames = [...new Set(names.map((name) => cleanText(name)).filter(Boolean))].slice(0, 12);
  if (model === "category") {
    return Promise.all(uniqueNames.map((name) => prisma.category.upsert({ where: { name }, create: { name }, update: {} })));
  }
  if (model === "tag") {
    return Promise.all(uniqueNames.map((name) => prisma.tag.upsert({ where: { name }, create: { name }, update: {} })));
  }
  return Promise.all(uniqueNames.map((name) => prisma.person.upsert({ where: { name }, create: { name }, update: {} })));
}

async function importItem(source: Source, item: FeedItem): Promise<"imported" | "duplicate" | "rejected"> {
  const canonicalUrl = canonicalizeUrl(item.link);
  if (!matchesPoliticalFilter(item.title, item.snippet)) return "rejected";
  if (await isBlocked(item.title, item.snippet)) return "rejected";

  const duplicate = await findDuplicate(item.title, canonicalUrl, item.publishedAt);
  if (duplicate.duplicate) return "duplicate";

  const ai = await analyzeArticle(item.title, item.snippet);
  const [categories, tags, persons] = await Promise.all([
    upsertNames("category", ai.categories),
    upsertNames("tag", ai.tags),
    upsertNames("person", ai.persons)
  ]);

  await prisma.$transaction(async (tx) => {
    const storyGroupId = await ensureStoryGroup(tx, item.title, duplicate.storyGroupId);
    await tx.article.create({
      data: {
        title: item.title,
        summary: ai.summary,
        sourceId: source.id,
        publishedAt: item.publishedAt,
        originalUrl: item.link,
        canonicalUrl,
        imageUrl: item.imageUrl,
        titleHash: titleHash(item.title),
        contentHash: stableHash(`${item.title} ${item.snippet ?? ""}`),
        status: env.AUTO_APPROVE_ARTICLES ? ArticleStatus.APPROVED : ArticleStatus.PENDING,
        storyGroupId,
        categories: { connect: categories.map((category) => ({ id: category.id })) },
        tags: { connect: tags.map((tag) => ({ id: tag.id })) },
        persons: { connect: persons.map((person) => ({ id: person.id })) }
      }
    });
  });

  return "imported";
}

async function processSource(source: Source): Promise<IngestionStats> {
  const stats: IngestionStats = { importedCount: 0, duplicateCount: 0, rejectedCount: 0, errorCount: 0 };
  const items = await fetchFeed(source);

  for (const item of items) {
    try {
      const result = await importItem(source, item);
      if (result === "imported") stats.importedCount += 1;
      if (result === "duplicate") stats.duplicateCount += 1;
      if (result === "rejected") stats.rejectedCount += 1;
    } catch (error) {
      stats.errorCount += 1;
      logger.warn({ error, source: source.name, item: item.link }, "failed to import feed item");
    }
  }

  return stats;
}

export async function runIngestion(): Promise<IngestionStats & { sourceCount: number; runId: string }> {
  const run = await prisma.ingestionRun.create({ data: {} });
  const sources = await prisma.source.findMany({ where: { enabled: true }, orderBy: { name: "asc" } });
  const totals: IngestionStats = { importedCount: 0, duplicateCount: 0, rejectedCount: 0, errorCount: 0 };

  for (let index = 0; index < sources.length; index += env.INGESTION_CONCURRENCY) {
    const chunk = sources.slice(index, index + env.INGESTION_CONCURRENCY);
    const results = await Promise.allSettled(chunk.map((source) => processSource(source)));
    for (const result of results) {
      if (result.status === "fulfilled") {
        totals.importedCount += result.value.importedCount;
        totals.duplicateCount += result.value.duplicateCount;
        totals.rejectedCount += result.value.rejectedCount;
        totals.errorCount += result.value.errorCount;
      } else {
        totals.errorCount += 1;
        logger.error({ error: result.reason }, "source ingestion failed");
      }
    }
  }

  await prisma.ingestionRun.update({
    where: { id: run.id },
    data: {
      finishedAt: new Date(),
      sourceCount: sources.length,
      importedCount: totals.importedCount,
      duplicateCount: totals.duplicateCount,
      rejectedCount: totals.rejectedCount,
      errorCount: totals.errorCount
    }
  });

  return { ...totals, sourceCount: sources.length, runId: run.id };
}

export async function runIngestionOnce(): Promise<(IngestionStats & { sourceCount: number; runId: string }) | { alreadyRunning: true }> {
  if (ingestionRunning) return { alreadyRunning: true };
  ingestionRunning = true;
  try {
    return await runIngestion();
  } finally {
    ingestionRunning = false;
  }
}
