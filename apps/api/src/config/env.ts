import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1),
  API_PORT: z.coerce.number().int().positive().default(4000),
  API_PUBLIC_URL: z.string().url().default("http://localhost:4000/api"),
  WEB_PUBLIC_URL: z.string().url().default("http://localhost:3000"),
  ADMIN_TOKEN: z.string().min(12).default("development-token"),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  CRON_ENABLED: z.coerce.boolean().default(true),
  INITIAL_INGESTION_ENABLED: z.coerce.boolean().default(true),
  INGESTION_CRON: z.string().default("0 * * * *"),
  INGESTION_CONCURRENCY: z.coerce.number().int().positive().default(6),
  AUTO_APPROVE_ARTICLES: z.coerce.boolean().default(true),
  PUBLIC_REFRESH_ENABLED: z.coerce.boolean().default(true),
  POLITICAL_FILTER_ENABLED: z.coerce.boolean().default(true),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default("gpt-4.1-mini")
});

export const env = EnvSchema.parse(process.env);

export const corsOrigins = env.CORS_ORIGIN.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
