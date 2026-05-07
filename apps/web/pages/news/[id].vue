<script setup lang="ts">
import { ExternalLink } from "lucide-vue-next";
import type { Article } from "~/types/api";

const route = useRoute();
const { data: article } = await useApiFetch<Article>(`/articles/${route.params.id}`);

if (!article.value) {
  throw createError({ statusCode: 404, statusMessage: "A hír nem található" });
}

useSeoMeta({
  title: article.value.title,
  description: article.value.summary ?? article.value.title,
  ogTitle: article.value.title,
  ogDescription: article.value.summary ?? article.value.title
});

useHead({
  link: [{ rel: "canonical", href: article.value.originalUrl }]
});
</script>

<template>
  <article class="mx-auto max-w-3xl">
    <NuxtLink to="/" class="focus-ring rounded text-sm font-semibold text-signal-blue">Vissza a hírekhez</NuxtLink>
    <div class="mt-4 border-b border-black/10 pb-5 dark:border-white/10">
      <p class="text-sm font-bold text-signal-red">{{ article?.source.name }}</p>
      <h1 class="mt-2 text-3xl font-black leading-tight sm:text-5xl">{{ article?.title }}</h1>
      <p class="mt-3 text-sm text-ink-800/60 dark:text-ink-50/60">
        Publikálva: {{ new Intl.DateTimeFormat("hu-HU", { dateStyle: "full", timeStyle: "short" }).format(new Date(article!.publishedAt)) }}
      </p>
    </div>
    <p v-if="article?.summary" class="mt-6 text-lg leading-8">{{ article.summary }}</p>
    <div class="mt-6 flex flex-wrap gap-2">
      <NuxtLink v-for="category in article?.categories" :key="category.name" :to="`/search?category=${encodeURIComponent(category.name)}`" class="focus-ring rounded border border-signal-gold/40 px-2 py-1 text-sm font-semibold text-signal-gold">
        {{ category.name }}
      </NuxtLink>
    </div>
    <section v-if="article?.persons.length" class="mt-6">
      <h2 class="text-sm font-black uppercase tracking-normal text-ink-800/70 dark:text-ink-50/70">Említett szereplők</h2>
      <div class="mt-2 flex flex-wrap gap-2">
        <NuxtLink v-for="person in article.persons" :key="person.name" :to="`/search?person=${encodeURIComponent(person.name)}`" class="focus-ring rounded border border-black/10 px-2 py-1 text-sm dark:border-white/10">
          {{ person.name }}
        </NuxtLink>
      </div>
    </section>
    <a :href="article?.originalUrl" target="_blank" rel="noopener noreferrer nofollow" class="focus-ring mt-8 inline-flex items-center gap-2 rounded bg-signal-red px-4 py-3 font-black text-white">
      Cikk megnyitása az eredeti forrásnál
      <ExternalLink class="h-4 w-4" />
    </a>
  </article>
</template>
