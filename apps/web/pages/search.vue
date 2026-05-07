<script setup lang="ts">
import { Search, SlidersHorizontal } from "lucide-vue-next";
import type { Article, HomeStats, Paginated } from "~/types/api";

useSeoMeta({ title: "Keresés", robots: "index,follow" });

const route = useRoute();
const router = useRouter();

const filters = reactive({
  q: String(route.query.q ?? ""),
  source: String(route.query.source ?? ""),
  category: String(route.query.category ?? ""),
  person: String(route.query.person ?? ""),
  from: String(route.query.from ?? ""),
  to: String(route.query.to ?? "")
});

const queryString = computed(() => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  params.set("limit", "20");
  return params.toString();
});

const { data, refresh, pending } = await useApiFetch<Paginated<Article>>(() => `/articles?${queryString.value}`, {
  watch: false
});
const { data: stats } = await useApiFetch<HomeStats>("/stats/home");

async function applyFilters() {
  await router.replace({ query: Object.fromEntries(new URLSearchParams(queryString.value)) });
  await refresh();
}
</script>

<template>
  <div class="grid gap-6 lg:grid-cols-[280px_1fr]">
    <form class="rounded border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-white/5" @submit.prevent="applyFilters">
      <div class="flex items-center gap-2">
        <SlidersHorizontal class="h-4 w-4" />
        <h1 class="font-black">Szűrés</h1>
      </div>
      <label class="mt-4 block text-sm font-semibold">
        Kifejezes
        <input v-model="filters.q" class="focus-ring mt-1 w-full rounded border border-black/10 bg-transparent px-3 py-2 dark:border-white/10" type="search" />
      </label>
      <label class="mt-3 block text-sm font-semibold">
        Forrás
        <select v-model="filters.source" class="focus-ring mt-1 w-full rounded border border-black/10 bg-transparent px-3 py-2 dark:border-white/10">
          <option value="">Összes</option>
          <option v-for="source in stats?.sources" :key="source.name" :value="source.name">{{ source.name }}</option>
        </select>
      </label>
      <label class="mt-3 block text-sm font-semibold">
        Kategória
        <input v-model="filters.category" class="focus-ring mt-1 w-full rounded border border-black/10 bg-transparent px-3 py-2 dark:border-white/10" />
      </label>
      <label class="mt-3 block text-sm font-semibold">
        Személy
        <input v-model="filters.person" class="focus-ring mt-1 w-full rounded border border-black/10 bg-transparent px-3 py-2 dark:border-white/10" />
      </label>
      <div class="mt-3 grid grid-cols-2 gap-2">
        <label class="block text-sm font-semibold">
          Tól
          <input v-model="filters.from" class="focus-ring mt-1 w-full rounded border border-black/10 bg-transparent px-3 py-2 dark:border-white/10" type="date" />
        </label>
        <label class="block text-sm font-semibold">
          Ig
          <input v-model="filters.to" class="focus-ring mt-1 w-full rounded border border-black/10 bg-transparent px-3 py-2 dark:border-white/10" type="date" />
        </label>
      </div>
      <button class="focus-ring mt-4 inline-flex w-full items-center justify-center gap-2 rounded bg-ink-900 px-4 py-2 text-sm font-bold text-white dark:bg-ink-50 dark:text-ink-900" type="submit">
        <Search class="h-4 w-4" />
        Keresés
      </button>
    </form>

    <section>
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-2xl font-black">Találatok</h2>
        <span class="text-sm text-ink-800/60 dark:text-ink-50/60">{{ data?.total ?? 0 }} hír</span>
      </div>
      <div v-if="pending" class="rounded border border-black/10 bg-white p-6 text-sm dark:border-white/10 dark:bg-white/5">Keresés...</div>
      <div v-else class="space-y-4">
        <ArticleCard v-for="article in data?.items" :key="article.id" :article="article" />
      </div>
    </section>
  </div>
</template>
