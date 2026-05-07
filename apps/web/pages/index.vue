<script setup lang="ts">
import { Search } from "lucide-vue-next";
import type { Article, HomeStats, Paginated, TimelinePoint } from "~/types/api";

useSeoMeta({
  title: "NER Bukás Monitor",
  ogTitle: "NER Bukás Monitor",
  ogDescription: "NER-bukáshoz köthető hírek valós idejű, rendszerezett gyűjteménye."
});

const [{ data: articles }, { data: stats }, { data: timeline }] = await Promise.all([
  useApiFetch<Paginated<Article>>("/articles?limit=12"),
  useApiFetch<HomeStats>("/stats/home"),
  useApiFetch<TimelinePoint[]>("/stats/timeline")
]);

async function refreshHome() {
  await refreshNuxtData();
}
</script>

<template>
  <div class="grid gap-6 lg:grid-cols-[1fr_320px]">
    <section>
      <div class="mb-5 flex flex-col gap-4 border-b border-black/10 pb-5 dark:border-white/10 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 class="text-3xl font-black leading-tight sm:text-4xl">NER Bukás Monitor</h1>
          <p class="mt-2 max-w-2xl text-sm leading-6 text-ink-800/70 dark:text-ink-50/70">
            NER-bukáshoz köthető hírek valós idejű, rendszerezett gyűjteménye, rövid AI-összefoglalókkal és eredeti forráslinkekkel.
          </p>
        </div>
        <div class="flex flex-col gap-3 sm:items-end">
          <RefreshNewsButton @done="refreshHome" />
          <NuxtLink to="/search" class="focus-ring inline-flex items-center gap-2 rounded bg-signal-red px-4 py-2 text-sm font-bold text-white">
            <Search class="h-4 w-4" />
            Keresés
          </NuxtLink>
        </div>
      </div>
      <div class="space-y-4">
        <ArticleCard v-for="article in articles?.items" :key="article.id" :article="article" />
        <p v-if="!articles?.items.length" class="rounded border border-black/10 bg-white p-6 text-sm dark:border-white/10 dark:bg-white/5">
          Még nincs importált hír. Használd a frissítés gombot, vagy indíts kézi frissítést az admin felületen.
        </p>
      </div>
    </section>
    <SidebarStats :stats="stats" :timeline="timeline" />
  </div>
</template>
