import { distance } from "fastest-levenshtein";
import { Article, Prisma } from "@prisma/client";
import { keywordFingerprint, normalizeForMatch, stableHash } from "../utils/text.js";
import { prisma } from "./prisma.js";

export type DuplicateDecision = {
  duplicate: boolean;
  storyGroupId?: string;
  reason?: string;
};

function similarity(a: string, b: string): number {
  const left = normalizeForMatch(a);
  const right = normalizeForMatch(b);
  const max = Math.max(left.length, right.length);
  if (max === 0) return 1;
  return 1 - distance(left, right) / max;
}

export async function findDuplicate(title: string, canonicalUrl: string, publishedAt: Date): Promise<DuplicateDecision> {
  const existingUrl = await prisma.article.findFirst({
    where: { OR: [{ originalUrl: canonicalUrl }, { canonicalUrl }] },
    select: { id: true, storyGroupId: true }
  });
  if (existingUrl) return { duplicate: true, storyGroupId: existingUrl.storyGroupId ?? undefined, reason: "url" };

  const titleHash = stableHash(title);
  const exactTitle = await prisma.article.findFirst({
    where: { titleHash },
    select: { id: true, storyGroupId: true }
  });
  if (exactTitle) return { duplicate: true, storyGroupId: exactTitle.storyGroupId ?? undefined, reason: "title-hash" };

  const since = new Date(publishedAt.getTime() - 1000 * 60 * 60 * 72);
  const candidates = await prisma.article.findMany({
    where: { publishedAt: { gte: since } },
    orderBy: { publishedAt: "desc" },
    take: 100,
    select: { id: true, title: true, storyGroupId: true }
  });

  const match = candidates.find((candidate) => similarity(candidate.title, title) >= 0.88);
  if (match) return { duplicate: true, storyGroupId: match.storyGroupId ?? undefined, reason: "fuzzy-title" };

  return { duplicate: false };
}

export async function ensureStoryGroup(tx: Prisma.TransactionClient, title: string, duplicateStoryGroupId?: string): Promise<string> {
  if (duplicateStoryGroupId) return duplicateStoryGroupId;

  const fingerprint = keywordFingerprint(title);
  const group = await tx.storyGroup.upsert({
    where: { fingerprint },
    create: { fingerprint, title },
    update: { updatedAt: new Date() }
  });

  return group.id;
}

export function titleHash(title: string): string {
  return stableHash(title);
}
