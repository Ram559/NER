<script setup lang="ts">
import type { HomeStats, TimelinePoint } from "~/types/api";

defineProps<{ stats?: HomeStats | null; timeline?: TimelinePoint[] | null }>();
</script>

<template>
  <aside class="sticky top-24 space-y-4">
    <section class="rounded border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-white/5">
      <h2 class="text-sm font-black uppercase tracking-normal text-ink-800/70 dark:text-ink-50/70">Trending témák</h2>
      <div class="mt-3 space-y-2">
        <NuxtLink
          v-for="item in stats?.trendingCategories"
          :key="item.name"
          :to="`/search?category=${encodeURIComponent(item.name)}`"
          class="focus-ring flex items-center justify-between rounded px-2 py-1 text-sm hover:bg-black/5 dark:hover:bg-white/10"
        >
          <span>{{ item.name }}</span>
          <span class="font-bold">{{ item._count.articles }}</span>
        </NuxtLink>
      </div>
    </section>

    <section class="rounded border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-white/5">
      <h2 class="text-sm font-black uppercase tracking-normal text-ink-800/70 dark:text-ink-50/70">Szereplők</h2>
      <div class="mt-3 flex flex-wrap gap-2">
        <NuxtLink
          v-for="item in stats?.mentionedPersons"
          :key="item.name"
          :to="`/search?person=${encodeURIComponent(item.name)}`"
          class="focus-ring rounded border border-black/10 px-2 py-1 text-xs hover:border-signal-blue dark:border-white/10"
        >
          {{ item.name }}
        </NuxtLink>
      </div>
    </section>

    <section class="rounded border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-white/5">
      <h2 class="text-sm font-black uppercase tracking-normal text-ink-800/70 dark:text-ink-50/70">30 napos timeline</h2>
      <div class="mt-4 flex h-24 items-end gap-1">
        <div
          v-for="point in [...(timeline ?? [])].reverse().slice(-18)"
          :key="point.day"
          class="min-h-1 flex-1 rounded-t bg-signal-green"
          :title="`${point.day}: ${point.count}`"
          :style="{ height: `${Math.max(8, Math.min(96, point.count * 8))}px` }"
        />
      </div>
    </section>
  </aside>
</template>
