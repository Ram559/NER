import OpenAI from "openai";
import { env } from "../config/env.js";
import { compactSentences, cleanText } from "../utils/text.js";
import { prisma } from "./prisma.js";

const DEFAULT_CATEGORIES = [
  "korrupció",
  "közbeszerzés",
  "EU pénzek",
  "lemondás",
  "nyomozás",
  "állami tender",
  "oligarcha",
  "propaganda",
  "gazdaság",
  "média"
];

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  korrupció: ["korrupcio", "kenopenz", "visszaeles", "hutlen kezeles"],
  közbeszerzés: ["kozbeszerzes", "beszerzes", "tender"],
  "EU pénzek": ["eu penz", "unios", "brusszel", "helyreallitasi alap"],
  lemondás: ["lemond", "tavozik", "meneszt"],
  nyomozás: ["nyomoz", "ugyeszseg", "rendőrség", "gyanu"],
  "állami tender": ["allami", "tender", "megbizas"],
  oligarcha: ["oligarcha", "milliardos", "vallalkozo"],
  propaganda: ["propaganda", "kampany", "plakat", "media"],
  gazdaság: ["gazdasag", "inflacio", "koltsegvetes", "forint", "ado"],
  média: ["media", "sajto", "televizio", "radio"]
};

export type AiResult = {
  summary: string;
  categories: string[];
  tags: string[];
  persons: string[];
};

function extractLikelyPersons(text: string): string[] {
  const matches = cleanText(text).match(/\b[A-ZÁÉÍÓÖŐÚÜŰ][a-záéíóöőúüű]+ [A-ZÁÉÍÓÖŐÚÜŰ][a-záéíóöőúüű]+\b/g) ?? [];
  return [...new Set(matches)].slice(0, 8);
}

function localClassify(title: string, snippet?: string): AiResult {
  const text = `${title} ${snippet ?? ""}`;
  const normalized = cleanText(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

  const categories = Object.entries(CATEGORY_KEYWORDS)
    .filter(([, keywords]) => keywords.some((keyword) => normalized.includes(keyword.normalize("NFD").replace(/\p{Diacritic}/gu, ""))))
    .map(([category]) => category);

  const words = normalized
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 4)
    .slice(0, 8);

  return {
    summary: compactSentences(`Források szerint az ügy lényege: ${title}.`, 2),
    categories: categories.length ? categories : ["közélet"],
    tags: [...new Set(words)].slice(0, 10),
    persons: extractLikelyPersons(text)
  };
}

export async function analyzeArticle(title: string, snippet?: string): Promise<AiResult> {
  if (!env.OPENAI_API_KEY) return localClassify(title, snippet);

  const prompt = await prisma.aiPrompt.findUnique({ where: { key: "article-analysis" } });
  const systemPrompt =
    prompt?.content ??
    `You analyze Hungarian public affairs news. Return strict JSON with summary, categories, tags and persons. The summary must be original, Hungarian, maximum two short sentences, and must not copy the source text. Prefer these categories: ${DEFAULT_CATEGORIES.join(", ")}.`;

  const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  const response = await client.chat.completions.create({
    model: env.OPENAI_MODEL,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: JSON.stringify({
          title: cleanText(title),
          rssSnippet: cleanText(snippet).slice(0, 500),
          constraints: ["Do not reproduce full article text", "Summary max 2 sentences", "Only infer from title and RSS snippet"]
        })
      }
    ]
  });

  const content = response.choices[0]?.message.content;
  if (!content) return localClassify(title, snippet);

  try {
    const parsed = JSON.parse(content) as Partial<AiResult>;
    return {
      summary: compactSentences(parsed.summary ?? "", 2) || localClassify(title, snippet).summary,
      categories: parsed.categories?.slice(0, 5) ?? [],
      tags: parsed.tags?.slice(0, 12) ?? [],
      persons: parsed.persons?.slice(0, 10) ?? []
    };
  } catch {
    return localClassify(title, snippet);
  }
}
