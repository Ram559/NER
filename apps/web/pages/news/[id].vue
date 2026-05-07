<script setup lang="ts">
import { ExternalLink } from "lucide-vue-next";
import type { Article } from "~/types/api";

const route = useRoute();
const { data: article } = await useApiFetch<Article>(`/articles/${route.params.id}`);

if (!article.value) {
  throw createError({ statusCode: 404, statusMessage: "A hír nem található" });
}

const dateFormatter = new Intl.DateTimeFormat("hu-HU", { dateStyle: "full", timeStyle: "short" });
const categoryNames = computed(() => article.value?.categories.map((category) => category.name) ?? []);
const contextPoints = computed(() => {
  const points: string[] = [];
  if (categoryNames.value.includes("korrupció")) points.push("Korrupciós vagy visszaélésgyanús szál miatt került a monitorba.");
  if (categoryNames.value.includes("állami tender")) points.push("Állami megbízásokhoz, közpénzhez vagy beszerzési döntéshez kapcsolódik.");
  if (categoryNames.value.includes("EU pénzek")) points.push("Az uniós források és a hozzájuk kötött feltételek miatt lehet politikai súlya.");
  if (categoryNames.value.includes("propaganda")) points.push("Kormányközeli kommunikációs vagy médiarendszeri érintettséget jelez.");
  if (!points.length) points.push("A hír a NER-bukáshoz köthető politikai folyamatok egyik friss jelzése.");
  return points;
});

useSeoMeta({
  title: article.value.title,
  description: article.value.summary ?? article.value.title,
  ogTitle: article.value.title,
  ogDescription: article.value.summary ?? article.value.title,
  ogImage: article.value.imageUrl ?? undefined
});

useHead({
  link: [{ rel: "canonical", href: article.value.originalUrl }]
});
</script>

<template>
  <article class="mx-auto max-w-4xl">
    <NuxtLink to="/" class="focus-ring rounded text-sm font-semibold text-signal-blue">Vissza a hírekhez</NuxtLink>

    <div class="mt-4 border-b border-black/10 pb-5 dark:border-white/10">
      <p class="text-sm font-bold text-signal-red">{{ article?.source.name }}</p>
      <h1 class="mt-2 text-3xl font-black leading-tight sm:text-5xl">{{ article?.title }}</h1>
      <p class="mt-3 text-sm text-ink-800/60 dark:text-ink-50/60">
        Publikálva: {{ dateFormatter.format(new Date(article!.publishedAt)) }}
      </p>
    </div>

    <img
      v-if="article?.imageUrl"
      :src="article.imageUrl"
      :alt="article.title"
      class="mt-6 aspect-[16/9] w-full rounded object-cover"
      loading="lazy"
      referrerpolicy="no-referrer"
    />

    <section class="mt-6 grid gap-5 lg:grid-cols-[1fr_280px]">
      <div>
        <p v-if="article?.summary" class="text-lg leading-8">{{ article.summary }}</p>

        <div class="mt-6 rounded border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-white/5">
          <h2 class="text-sm font-black uppercase tracking-normal text-ink-800/70 dark:text-ink-50/70">Miért került a monitorba?</h2>
          <ul class="mt-3 space-y-2 text-sm leading-6">
            <li v-for="point in contextPoints" :key="point">{{ point }}</li>
          </ul>
        </div>
      </div>

      <aside class="space-y-4">
        <div class="rounded border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-white/5">
          <h2 class="text-sm font-black uppercase tracking-normal text-ink-800/70 dark:text-ink-50/70">Kategóriák</h2>
          <div class="mt-3 flex flex-wrap gap-2">
            <NuxtLink
              v-for="category in article?.categories"
              :key="category.name"
              :to="`/search?category=${encodeURIComponent(category.name)}`"
              class="focus-ring rounded border border-signal-gold/40 px-2 py-1 text-sm font-semibold text-signal-gold"
            >
              {{ category.name }}
            </NuxtLink>
          </div>
        </div>

        <div v-if="article?.persons.length" class="rounded border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-white/5">
          <h2 class="text-sm font-black uppercase tracking-normal text-ink-800/70 dark:text-ink-50/70">Érintett szereplők</h2>
          <div class="mt-3 flex flex-wrap gap-2">
            <NuxtLink v-for="person in article.persons" :key="person.name" :to="`/search?person=${encodeURIComponent(person.name)}`" class="focus-ring rounded border border-black/10 px-2 py-1 text-sm dark:border-white/10">
              {{ person.name }}
            </NuxtLink>
          </div>
        </div>

        <a :href="article?.originalUrl" target="_blank" rel="noopener noreferrer nofollow" class="focus-ring inline-flex w-full items-center justify-center gap-2 rounded bg-signal-red px-4 py-3 font-black text-white">
          Eredeti cikk
          <ExternalLink class="h-4 w-4" />
        </a>
      </aside>
    </section>
  </article>
</template>
