import Parser from "rss-parser";
import { Source } from "@prisma/client";
import { canFetchUrl } from "./robots.js";
import { cleanText, canonicalizeUrl } from "../utils/text.js";

export type FeedItem = {
  title: string;
  link: string;
  publishedAt: Date;
  snippet?: string;
  imageUrl?: string;
};

const parser = new Parser({
  timeout: 15000,
  customFields: {
    item: [
      ["media:content", "mediaContent"],
      ["media:thumbnail", "mediaThumbnail"]
    ]
  },
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

export async function fetchFeed(source: Source): Promise<FeedItem[]> {
  if (source.respectRobots && !(await canFetchUrl(source.feedUrl))) return [];

  const feed = await parser.parseURL(source.feedUrl);
  return feed.items
    .map((item) => {
      const rawItem = item as typeof item & {
        mediaContent?: { $?: { url?: string } } | { $?: { url?: string } }[];
        mediaThumbnail?: { $?: { url?: string } } | { $?: { url?: string } }[];
      };
      const mediaContent = Array.isArray(rawItem.mediaContent) ? rawItem.mediaContent[0] : rawItem.mediaContent;
      const mediaThumbnail = Array.isArray(rawItem.mediaThumbnail) ? rawItem.mediaThumbnail[0] : rawItem.mediaThumbnail;
      const link = item.link ? canonicalizeUrl(item.link) : "";

      return {
        title: cleanText(item.title),
        link,
        publishedAt: item.isoDate || item.pubDate ? new Date(item.isoDate ?? item.pubDate ?? Date.now()) : new Date(),
        snippet: cleanText(item.contentSnippet ?? item.summary ?? item.content).slice(0, 500),
        imageUrl: item.enclosure?.url ?? mediaContent?.$?.url ?? mediaThumbnail?.$?.url
      };
    })
    .filter((item) => item.title && item.link);
}
