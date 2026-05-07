<script setup lang="ts">
import type { HomeStats, TimelinePoint } from "~/types/api";

const props = defineProps<{ stats?: HomeStats | null; timeline?: TimelinePoint[] | null }>();

const meterScore = computed(() => props.stats?.barometer?.score ?? 0);
const needleRotation = computed(() => -90 + meterScore.value * 1.8);
const meterLabel = computed(() => props.stats?.barometer?.level ?? "csendes");
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
      <div class="flex items-start justify-between gap-3">
        <div>
          <h2 class="text-sm font-black uppercase tracking-normal text-ink-800/70 dark:text-ink-50/70">Barom-éter</h2>
          <p class="mt-1 text-xs text-ink-800/60 dark:text-ink-50/60">Súlyozott politikai jelzés az utóbbi 30 napból</p>
        </div>
        <span class="rounded bg-signal-red px-2 py-1 text-xs font-black uppercase tracking-normal text-white">{{ meterLabel }}</span>
      </div>

      <div class="mt-4 rounded bg-black/[0.03] p-4 dark:bg-white/[0.04]">
        <div class="relative mx-auto h-32 max-w-56">
          <svg viewBox="0 0 200 120" class="h-full w-full" role="img" aria-label="Bukás-méter">
            <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="currentColor" stroke-width="14" class="text-black/10 dark:text-white/10" stroke-linecap="round" />
            <path d="M 20 100 A 80 80 0 0 1 82 24" fill="none" stroke="#3d8060" stroke-width="14" stroke-linecap="round" />
            <path d="M 82 24 A 80 80 0 0 1 138 35" fill="none" stroke="#d6a43b" stroke-width="14" stroke-linecap="round" />
            <path d="M 138 35 A 80 80 0 0 1 180 100" fill="none" stroke="#c73535" stroke-width="14" stroke-linecap="round" />
            <line
              x1="100"
              y1="100"
              x2="100"
              y2="30"
              stroke="currentColor"
              stroke-width="4"
              stroke-linecap="round"
              class="origin-[100px_100px] text-ink-900 transition-transform duration-700 ease-out dark:text-ink-50"
              :style="{ transform: `rotate(${needleRotation}deg)` }"
            />
            <circle cx="100" cy="100" r="7" fill="currentColor" class="text-ink-900 dark:text-ink-50" />
          </svg>
          <div class="absolute inset-x-0 bottom-0 text-center">
            <p class="text-3xl font-black">{{ meterScore }}</p>
            <p class="text-xs font-bold uppercase tracking-normal text-signal-red">súlyozott érték</p>
          </div>
        </div>

        <div class="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
          <div class="rounded border border-black/10 p-2 dark:border-white/10">
            <p class="font-black">{{ stats?.barometer?.articleCount ?? 0 }}</p>
            <p class="text-ink-800/60 dark:text-ink-50/60">hír</p>
          </div>
          <div class="rounded border border-black/10 p-2 dark:border-white/10">
            <p class="font-black">{{ stats?.barometer?.weightedSignal ?? 0 }}</p>
            <p class="text-ink-800/60 dark:text-ink-50/60">súly</p>
          </div>
          <div class="rounded border border-black/10 p-2 dark:border-white/10">
            <p class="font-black">{{ stats?.barometer?.topSignals?.length ?? 0 }}</p>
            <p class="text-ink-800/60 dark:text-ink-50/60">erős jel</p>
          </div>
        </div>

        <div v-if="stats?.barometer?.topSignals?.length" class="mt-4 space-y-2">
          <div v-for="signal in stats.barometer.topSignals" :key="signal.label" class="flex items-center justify-between gap-3 rounded border border-black/10 px-2 py-1.5 text-xs dark:border-white/10">
            <span class="truncate">{{ signal.label }}</span>
            <span class="font-black text-signal-red">+{{ signal.weight }}</span>
          </div>
        </div>
      </div>
    </section>
  </aside>
</template>
