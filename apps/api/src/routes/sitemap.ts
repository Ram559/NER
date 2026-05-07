import { Router } from "express";
import { env } from "../config/env.js";
import { prisma } from "../services/prisma.js";

export const sitemapRouter = Router();

sitemapRouter.get("/", async (_req, res) => {
  const articles = await prisma.article.findMany({
    where: { status: "APPROVED" },
    select: { id: true, updatedAt: true },
    orderBy: { publishedAt: "desc" },
    take: 5000
  });

  const urls = [
    `${env.WEB_PUBLIC_URL}/`,
    `${env.WEB_PUBLIC_URL}/search`,
    `${env.WEB_PUBLIC_URL}/disclaimer`,
    ...articles.map((article) => `${env.WEB_PUBLIC_URL}/news/${article.id}`)
  ];

  res.type("application/xml").send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url, index) => `  <url>
    <loc>${url}</loc>
    <lastmod>${index < 3 ? new Date().toISOString() : articles[index - 3]?.updatedAt.toISOString()}</lastmod>
  </url>`
  )
  .join("\n")}
</urlset>`);
});
