export type NamedCount = {
  name: string;
  _count: { articles: number };
};

export type Source = {
  id: string;
  name: string;
  homepageUrl: string;
  feedUrl: string;
  type: "RSS" | "GOOGLE_NEWS_RSS" | "API";
  enabled: boolean;
  respectRobots: boolean;
};

export type Article = {
  id: string;
  title: string;
  summary?: string | null;
  publishedAt: string;
  originalUrl: string;
  source: { name: string; homepageUrl: string };
  categories: { name: string }[];
  tags: { name: string }[];
  persons: { name: string }[];
  storyGroup?: { id: string; title: string } | null;
};

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};

export type HomeStats = {
  trendingCategories: NamedCount[];
  mentionedPersons: NamedCount[];
  latestRun?: {
    startedAt: string;
    finishedAt?: string | null;
    importedCount: number;
    duplicateCount: number;
    rejectedCount: number;
    errorCount: number;
  } | null;
  sources: { name: string }[];
};

export type TimelinePoint = {
  day: string;
  count: number;
};
