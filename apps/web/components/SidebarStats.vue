<script setup lang="ts">
import type { HomeStats, TimelinePoint } from "~/types/api";

const props = defineProps<{ stats?: HomeStats | null; timeline?: TimelinePoint[] | null }>();

const selectedWindow = ref<7 | 14 | 30>(30);
const windows = [7, 14, 30] as const;

const sortedTimeline = computed(() =>
  [...(props.timeline ?? [])].sort((left, right) => new Date(left.day).getTime() - new Date(right.day).getTime())
);

const currentPoints = computed(() => sortedTimeline.value.slice(-selectedWindow.value));
const previousPoints = computed(() => sortedTimeline.value.slice(-selectedWindow.value * 2, -selectedWindow.value));
const currentCount = computed(() => currentPoints.value.reduce((sum, point) => sum + point.count, 0));
const previousCount = computed(() => previousPoints.value.reduce((sum, point) => sum + point.count, 0));
const categorySignal = computed(() => props.stats?.trendingCategories.reduce((sum, item) => sum + item._count.articles, 0) ?? 0);

const meterScore = computed(() => {
  const acceleration = Math.max(0, currentCount.value - previousCount.value);
  const raw = currentCount.value * 7 + acceleration * 5 + categorySignal.value * 2;
  return Math.max(0, Math.min(100, Math.round(raw)));
});

const needleRotation = computed(() => -90 + meterScore.value * 1.8);
const meterLabel = computed(() => {
  if (meterScore.value >= 75) return "forrpont";
  if (meterScore.value >= 45) return "gyorsuló";
  if (meterScore.value >= 20) return "figyelendő";
  return "csendes";
});
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
          <h2 class="text-sm font-black uppercase tracking-normal text-ink-800/70 dark:text-ink-50/70">Bukás-méter</h2>
          <p class="mt-1 text-xs text-ink-800/60 dark:text-ink-50/60">Aktivitás az utóbbi {{ selectedWindow }} nap alapján</p>
        </div>
        <div class="flex rounded border border-black/10 p-0.5 dark:border-white/10">
          <button
            v-for="windowSize in windows"
            :key="windowSize"
            type="button"
            class="focus-ring rounded px-2 py-1 text-xs font-bold"
            :class="selectedWindow === windowSize ? 'bg-signal-red text-white' : 'hover:bg-black/5 dark:hover:bg-white/10'"
            @click="selectedWindow = windowSize"
          >
            {{ windowSize }}n
          </button>
        </div>
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
              class="origin-[100px_100px] text-ink-900 transition-transform duration-500 dark:text-ink-50"
              :style="{ transform: `rotate(${needleRotation}deg)` }"
            />
            <circle cx="100" cy="100" r="7" fill="currentColor" class="text-ink-900 dark:text-ink-50" />
          </svg>
          <div class="absolute inset-x-0 bottom-0 text-center">
            <p class="text-3xl font-black">{{ meterScore }}</p>
            <p class="text-xs font-bold uppercase tracking-normal text-signal-red">{{ meterLabel }}</p>
          </div>
        </div>

        <div class="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
          <div class="rounded border border-black/10 p-2 dark:border-white/10">
            <p class="font-black">{{ currentCount }}</p>
            <p class="text-ink-800/60 dark:text-ink-50/60">hír</p>
          </div>
          <div class="rounded border border-black/10 p-2 dark:border-white/10">
            <p class="font-black">{{ Math.max(0, currentCount - previousCount) }}</p>
            <p class="text-ink-800/60 dark:text-ink-50/60">gyorsulás</p>
          </div>
          <div class="rounded border border-black/10 p-2 dark:border-white/10">
            <p class="font-black">{{ categorySignal }}</p>
            <p class="text-ink-800/60 dark:text-ink-50/60">jelzés</p>
          </div>
        </div>
      </div>
    </section>
  </aside>
</template>
