<script setup lang="ts">
import { ExternalLink, UserRound } from "lucide-vue-next";
import type { Article } from "~/types/api";

defineProps<{ article: Article }>();

const dateFormatter = new Intl.DateTimeFormat("hu-HU", {
  dateStyle: "medium",
  timeStyle: "short"
});
</script>

<template>
  <article class="rounded border border-black/10 bg-white p-4 shadow-subtle dark:border-white/10 dark:bg-white/5">
    <div class="flex flex-wrap items-center gap-2 text-xs text-ink-800/60 dark:text-ink-50/60">
      <span class="font-semibold text-signal-red">{{ article.source.name }}</span>
      <span>{{ dateFormatter.format(new Date(article.publishedAt)) }}</span>
    </div>
    <NuxtLink :to="`/news/${article.id}`" class="focus-ring mt-2 block rounded">
      <h2 class="text-lg font-black leading-snug hover:text-signal-red">{{ article.title }}</h2>
    </NuxtLink>
    <p v-if="article.summary" class="mt-2 text-sm leading-6 text-ink-800/80 dark:text-ink-50/75">{{ article.summary }}</p>
    <div class="mt-4 flex flex-wrap gap-2">
      <NuxtLink
        v-for="category in article.categories"
        :key="category.name"
        :to="`/search?category=${encodeURIComponent(category.name)}`"
        class="focus-ring rounded border border-signal-gold/40 px-2 py-1 text-xs font-semibold text-signal-gold hover:bg-signal-gold/10"
      >
        {{ category.name }}
      </NuxtLink>
    </div>
    <div v-if="article.persons.length" class="mt-3 flex flex-wrap gap-2 text-xs text-ink-800/65 dark:text-ink-50/65">
      <span v-for="person in article.persons.slice(0, 4)" :key="person.name" class="inline-flex items-center gap-1">
        <UserRound class="h-3 w-3" />
        {{ person.name }}
      </span>
    </div>
    <a
      :href="article.originalUrl"
      target="_blank"
      rel="noopener noreferrer nofollow"
      class="focus-ring mt-4 inline-flex items-center gap-2 rounded bg-ink-900 px-3 py-2 text-sm font-bold text-white hover:bg-signal-red dark:bg-ink-50 dark:text-ink-900"
    >
      Eredeti forrás
      <ExternalLink class="h-4 w-4" />
    </a>
  </article>
</template>
