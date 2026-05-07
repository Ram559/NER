import { PrismaClient, SourceType } from "@prisma/client";
import { titleHash } from "../src/services/dedupe.js";
import { keywordFingerprint, stableHash } from "../src/utils/text.js";

const prisma = new PrismaClient();

const categories = [
  "korrupció",
  "közbeszerzés",
  "EU pénzek",
  "lemondás",
  "nyomozás",
  "állami tender",
  "oligarcha",
  "propaganda",
  "gazdaság",
  "média",
  "közélet"
];

const sources = [
  { name: "Telex", homepageUrl: "https://telex.hu", feedUrl: "https://telex.hu/rss", type: SourceType.RSS },
  { name: "24.hu Belfold", homepageUrl: "https://24.hu", feedUrl: "https://24.hu/feed/", type: SourceType.RSS },
  { name: "444", homepageUrl: "https://444.hu", feedUrl: "https://444.hu/feed/", type: SourceType.RSS },
  { name: "HVG", homepageUrl: "https://hvg.hu", feedUrl: "https://hvg.hu/rss", type: SourceType.RSS },
  { name: "Index 24 ora", homepageUrl: "https://index.hu", feedUrl: "https://index.hu/24ora/rss/", type: SourceType.RSS },
  {
    name: "Google News - magyar közbeszerzés",
    homepageUrl: "https://news.google.com",
    feedUrl: "https://news.google.com/rss/search?q=magyar%20kozbeszerzes%20politika&hl=hu&gl=HU&ceid=HU:hu",
    type: SourceType.GOOGLE_NEWS_RSS
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
Use only the title and RSS snippet. Never invent facts not supported by the input. Prefer categories: korrupció, közbeszerzés, EU pénzek, lemondás, nyomozás, állami tender, oligarcha, propaganda, gazdaság, média.`;

const mockArticles = [
  {
    title: "Új vizsgálat indul egy állami tender körül",
    summary: "Források szerint az ügy egy nagy értékű állami megbízás körül forog. A hatósági lépések és a politikai reakciók további fejleményeket hozhatnak.",
    sourceName: "Telex",
    originalUrl: "https://example.com/mock/allami-tender-vizsgalat",
    publishedAt: new Date(Date.now() - 1000 * 60 * 35),
    categories: ["közbeszerzés", "állami tender", "nyomozás"],
    tags: ["tender", "hatóság", "közpénz"],
    persons: ["Nagy Marton"]
  },
  {
    title: "Vita robbant ki az uniós források felhasználásáról",
    summary: "A megszólalók az EU-s pénzek átláthatóságát és ellenőrzését kérik számon. A téma várhatóan a következő parlamenti vitán is napirenden lesz.",
    sourceName: "HVG",
    originalUrl: "https://example.com/mock/eu-forrasok-vita",
    publishedAt: new Date(Date.now() - 1000 * 60 * 120),
    categories: ["EU pénzek", "gazdaság"],
    tags: ["unió", "költségvetés", "átláthatóság"],
    persons: ["Orban Viktor"]
  },
  {
    title: "Médiapiaci döntés miatt bírálják a kormányzati kommunikációt",
    summary: "A kritikusok szerint a döntés tovább erősítheti az állami hirdetések politikai súlyát. A kormányzati oldal szerint jogszerű kommunikációs beszerzés történt.",
    sourceName: "444",
    originalUrl: "https://example.com/mock/media-kommunikacio",
    publishedAt: new Date(Date.now() - 1000 * 60 * 240),
    categories: ["média", "propaganda", "közbeszerzés"],
    tags: ["média", "kampány", "hirdetés"],
    persons: ["Rogan Antal"]
  }
];

async function ensureName(model: "category" | "tag" | "person", name: string) {
  if (model === "category") return prisma.category.upsert({ where: { name }, create: { name }, update: {} });
  if (model === "tag") return prisma.tag.upsert({ where: { name }, create: { name }, update: {} });
  return prisma.person.upsert({ where: { name }, create: { name }, update: {} });
}

async function main() {
  for (const name of categories) {
    await ensureName("category", name);
  }

  for (const source of sources) {
    await prisma.source.upsert({
      where: { feedUrl: source.feedUrl },
      create: { ...source, enabled: true, respectRobots: true },
      update: { name: source.name, homepageUrl: source.homepageUrl, type: source.type }
    });
  }

  await prisma.aiPrompt.upsert({
    where: { key: "article-analysis" },
    create: { key: "article-analysis", content: articleAnalysisPrompt },
    update: { content: articleAnalysisPrompt }
  });

  await prisma.blocklistKeyword.upsert({
    where: { keyword: "bulvar" },
    create: { keyword: "bulvar", enabled: false },
    update: {}
  });

  for (const item of mockArticles) {
    const source = await prisma.source.findFirstOrThrow({ where: { name: item.sourceName } });
    const [articleCategories, tags, persons] = await Promise.all([
      Promise.all(item.categories.map((name) => ensureName("category", name))),
      Promise.all(item.tags.map((name) => ensureName("tag", name))),
      Promise.all(item.persons.map((name) => ensureName("person", name)))
    ]);

    const storyGroup = await prisma.storyGroup.upsert({
      where: { fingerprint: keywordFingerprint(item.title) },
      create: { fingerprint: keywordFingerprint(item.title), title: item.title },
      update: {}
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
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
