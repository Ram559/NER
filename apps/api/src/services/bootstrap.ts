import { SourceType } from "@prisma/client";
import { logger } from "../config/logger.js";
import { titleHash } from "./dedupe.js";
import { prisma } from "./prisma.js";
import { keywordFingerprint, stableHash } from "../utils/text.js";
import { visibleCategoryNames } from "../utils/categories.js";

const defaultCategories = visibleCategoryNames();

const defaultSources = [
  { name: "Telex", homepageUrl: "https://telex.hu", feedUrl: "https://telex.hu/rss", type: SourceType.RSS },
  { name: "444", homepageUrl: "https://444.hu", feedUrl: "https://444.hu/feed/", type: SourceType.RSS },
  { name: "24.hu Belfold", homepageUrl: "https://24.hu", feedUrl: "https://24.hu/belfold/feed/", type: SourceType.RSS },
  {
    name: "Google News - NER bukás",
    homepageUrl: "https://news.google.com",
    feedUrl: "https://news.google.com/rss/search?q=NER%20buk%C3%A1s%20OR%20korrupci%C3%B3%20OR%20Bal%C3%A1sy%20OR%20Fidesz&hl=hu&gl=HU&ceid=HU:hu",
    type: SourceType.GOOGLE_NEWS_RSS
  },
  {
    name: "Reddit r/hungary - NER figyelő",
    homepageUrl: "https://www.reddit.com/r/hungary/",
    feedUrl:
      "https://www.reddit.com/r/hungary/search.rss?q=NER%20OR%20Orb%C3%A1n%20OR%20Rog%C3%A1n%20OR%20korrupci%C3%B3%20OR%20k%C3%B6zbeszerz%C3%A9s%20OR%20EU%20p%C3%A9nzek%20OR%20propaganda%20OR%20%C3%A1llami%20tender&restrict_sr=on&sort=new&t=month",
    type: SourceType.RSS
  }
];

const articleAnalysisPrompt = `You analyze Hungarian public affairs and political news.
Return strict JSON only:
{
  "summary": "Hungarian, max two short original sentences. Do not copy source wording.",
  "categories": ["one or more concise Hungarian categories"],
  "tags": ["lowercase topical tags"],
  "persons": ["Full Name"]
}
Use only the title and RSS snippet. Never invent facts not supported by the input. Never start the summary with "Források szerint az ügy lényege". Use only these categories: NER bukás, EU pénzek, korrupció, állami tender, propaganda.`;

const demoArticles: {
  title: string;
  summary: string;
  sourceName: string;
  originalUrl: string;
  publishedAt: Date;
  categories: string[];
  tags: string[];
  persons: string[];
}[] = [];

async function ensureName(model: "category" | "tag" | "person", name: string) {
  if (model === "category") return prisma.category.upsert({ where: { name }, create: { name }, update: {} });
  if (model === "tag") return prisma.tag.upsert({ where: { name }, create: { name }, update: {} });
  return prisma.person.upsert({ where: { name }, create: { name }, update: {} });
}

async function mergeLegacyCategory(oldName: string, newName: string) {
  const oldCategory = await prisma.category.findUnique({ where: { name: oldName } });
  if (!oldCategory) return;

  const targetCategory = await prisma.category.findUnique({ where: { name: newName } });
  if (!targetCategory) {
    await prisma.category.update({ where: { id: oldCategory.id }, data: { name: newName } });
    return;
  }

  await prisma.$executeRaw`
    INSERT INTO "_ArticleToCategory" ("A", "B")
    SELECT "A", ${targetCategory.id}
    FROM "_ArticleToCategory"
    WHERE "B" = ${oldCategory.id}
    ON CONFLICT DO NOTHING
  `;
  await prisma.$executeRaw`DELETE FROM "_ArticleToCategory" WHERE "B" = ${oldCategory.id}`;
  await prisma.category.delete({ where: { id: oldCategory.id } });
}

export async function ensureBootstrapData() {
  await prisma.source.deleteMany({
    where: {
      OR: [{ name: "Kontroll.hu" }, { homepageUrl: { contains: "kontroll.hu" } }, { feedUrl: { contains: "kontroll.hu" } }]
    }
  });

  await prisma.$executeRaw`
    UPDATE "Article"
    SET "summary" = regexp_replace("summary", '^Források szerint az ügy lényege:\\s*', '', 'i')
    WHERE "summary" IS NOT NULL
  `;
  await prisma.$executeRaw`
    UPDATE "Article"
    SET "summary" = regexp_replace("summary", '^Forrasok szerint az ugy lenyege:\\s*', '', 'i')
    WHERE "summary" IS NOT NULL
  `;

  await mergeLegacyCategory("korrupcio", "korrupció");
  await mergeLegacyCategory("kozbeszerzes", "közbeszerzés");
  await mergeLegacyCategory("EU penzek", "EU pénzek");
  await mergeLegacyCategory("lemondas", "lemondás");
  await mergeLegacyCategory("nyomozas", "nyomozás");
  await mergeLegacyCategory("allami tender", "állami tender");
  await mergeLegacyCategory("gazdasag", "gazdaság");
  await mergeLegacyCategory("media", "média");
  await mergeLegacyCategory("kozelet", "közélet");
  await mergeLegacyCategory("NER bukas", "NER bukás");

  for (const name of defaultCategories) {
    await ensureName("category", name);
  }

  for (const source of defaultSources) {
    const existingByName = await prisma.source.findFirst({ where: { name: source.name } });
    if (existingByName) {
      await prisma.source.update({
        where: { id: existingByName.id },
        data: { ...source, enabled: true, respectRobots: true }
      });
    } else {
      await prisma.source.upsert({
        where: { feedUrl: source.feedUrl },
        create: { ...source, enabled: true, respectRobots: true },
        update: { name: source.name, homepageUrl: source.homepageUrl, type: source.type, enabled: true }
      });
    }
  }

  await prisma.aiPrompt.upsert({
    where: { key: "article-analysis" },
    create: { key: "article-analysis", content: articleAnalysisPrompt },
    update: { content: articleAnalysisPrompt }
  });

  for (const item of demoArticles) {
    const source = await prisma.source.findFirstOrThrow({ where: { name: item.sourceName } });
    const [articleCategories, tags, persons] = await Promise.all([
      Promise.all(item.categories.map((name) => ensureName("category", name))),
      Promise.all(item.tags.map((name) => ensureName("tag", name))),
      Promise.all(item.persons.map((name) => ensureName("person", name)))
    ]);
    const storyGroup = await prisma.storyGroup.upsert({
      where: { fingerprint: keywordFingerprint(item.title) },
      create: { fingerprint: keywordFingerprint(item.title), title: item.title },
      update: { updatedAt: new Date() }
    });

    await prisma.article.upsert({
      where: { originalUrl: item.originalUrl },
      create: {
        title: item.title,
        summary: item.summary,
        sourceId: source.id,
        publishedAt: item.publishedAt,
        originalUrl: item.originalUrl,
        canonicalUrl: item.originalUrl,
        imageUrl: null,
        titleHash: titleHash(item.title),
        contentHash: stableHash(item.summary),
        storyGroupId: storyGroup.id,
        categories: { connect: articleCategories.map((category) => ({ id: category.id })) },
        tags: { connect: tags.map((tag) => ({ id: tag.id })) },
        persons: { connect: persons.map((person) => ({ id: person.id })) }
      },
      update: {}
    });
  }

  logger.info("bootstrap sources, prompts and demo articles ensured");
}
