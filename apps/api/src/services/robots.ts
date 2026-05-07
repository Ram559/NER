import robotsParser from "robots-parser";
import { logger } from "../config/logger.js";

const robotsCache = new Map<string, { expiresAt: number; canFetch: boolean }>();

export async function canFetchUrl(targetUrl: string, userAgent = "NER-NewsAggregator/0.1"): Promise<boolean> {
  const cacheKey = `${userAgent}:${targetUrl}`;
  const cached = robotsCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.canFetch;

  try {
    const parsed = new URL(targetUrl);
    const robotsUrl = `${parsed.origin}/robots.txt`;
    const response = await fetch(robotsUrl, { headers: { "user-agent": userAgent } });
    if (!response.ok) return true;

    const body = await response.text();
    const robots = robotsParser(robotsUrl, body);
    const canFetch = robots.isAllowed(targetUrl, userAgent) !== false;
    robotsCache.set(cacheKey, { canFetch, expiresAt: Date.now() + 1000 * 60 * 30 });
    return canFetch;
  } catch (error) {
    logger.warn({ error, targetUrl }, "robots.txt check failed; allowing fetch");
    return true;
  }
}
