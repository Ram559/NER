import Parser from "rss-parser";
import { Source, SourceType } from "@prisma/client";
import { canFetchUrl } from "./robots.js";
import { cleanText, canonicalizeUrl } from "../utils/text.js";

export type FeedItem = {
  title: string;
  link: string;
  publishedAt: Date;
  snippet?: string;
};

const parser = new Parser({
  timeout: 15000,
  headers: {
    "user-agent": "NER-NewsAggregator/0.1 (+https://example.local)"
  }
});

export function googleNewsRssUrl(query: string): string {
  const params = new URLSearchParams({
    q: query,
    hl: "hu",
    gl: "HU",
    ceid: "HU:hu"
  });
  return `https://news.google.com/rss/search?${params.toString()}`;
}

function dateFromKontrollUrl(url: string): Date {
  const match = url.match(/\/cikk\/[^/]+\/(\d{4})\/(\d{2})\/(\d{2})\//);
  if (!match) return new Date();
  return new Date(`${match[1]}-${match[2]}-${match[3]}T08:00:00.000Z`);
}

async function fetchKontrollHomepage(source: Source): Promise<FeedItem[]> {
  if (source.respectRobots && !(await canFetchUrl(source.feedUrl))) return [];

  const response = await fetch(source.feedUrl, {
    headers: { "user-agent": "NER-NewsAggregator/0.1 (+https://example.local)" }
  });
  const html = await response.text();
  const seen = new Set<string>();
  const items: FeedItem[] = [];

  for (const match of html.matchAll(/<a\s+[^>]*href="([^"]*\/cikk\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)) {
    const link = canonicalizeUrl(match[1].startsWith("http") ? match[1] : `https://kontroll.hu${match[1]}`);
    if (seen.has(link)) continue;

    const title = cleanText(match[2]);
    if (title.length < 16) continue;

    seen.add(link);
    items.push({
      title,
      link,
      publishedAt: dateFromKontrollUrl(link),
      snippet: title
    });
  }

  return items.slice(0, 40);
}

export async function fetchFeed(source: Source): Promise<FeedItem[]> {
  if (source.type === SourceType.API && source.homepageUrl.includes("kontroll.hu")) {
    return fetchKontrollHomepage(source);
  }

  if (source.respectRobots && !(await canFetchUrl(source.feedUrl))) return [];

  const feed = await parser.parseURL(source.feedUrl);
  return feed.items
    .map((item) => {
      const link = item.link ? canonicalizeUrl(item.link) : "";
      return {
        title: cleanText(item.title),
        link,
        publishedAt: item.isoDate || item.pubDate ? new Date(item.isoDate ?? item.pubDate ?? Date.now()) : new Date(),
        snippet: cleanText(item.contentSnippet ?? item.summary ?? item.content).slice(0, 500)
      };
    })
    .filter((item) => item.title && item.link);
}
