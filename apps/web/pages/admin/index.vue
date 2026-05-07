<script setup lang="ts">
import { Play, RefreshCcw, Save, Trash2 } from "lucide-vue-next";
import type { Source } from "~/types/api";

useSeoMeta({ title: "Admin", robots: "noindex,nofollow" });

const adminToken = useCookie("admin-token", { sameSite: "strict" });
const tokenInput = ref(adminToken.value ?? "");
const status = ref("");
const newSource = reactive({
  name: "",
  homepageUrl: "",
  feedUrl: "",
  type: "RSS",
  enabled: true,
  respectRobots: true
});

const { data: sources, refresh: refreshSources } = await useApiFetch<Source[]>("/sources");
const { data: prompts, refresh: refreshPrompts } = await useApiFetch<{ key: string; content: string }[]>("/admin/prompts", {
  headers: computed(() => ({ authorization: `Bearer ${adminToken.value ?? ""}` })),
  immediate: Boolean(adminToken.value)
});

function saveToken() {
  adminToken.value = tokenInput.value;
  refreshPrompts();
}

async function runIngestion() {
  status.value = "Frissítés fut...";
  const result = await apiFetch("/admin/ingest", {
    method: "POST",
    headers: { authorization: `Bearer ${adminToken.value}` }
  });
  status.value = `Import kesz: ${JSON.stringify(result)}`;
}

async function createSource() {
  await apiFetch("/sources", {
    method: "POST",
    headers: { authorization: `Bearer ${adminToken.value}` },
    body: newSource
  });
  Object.assign(newSource, { name: "", homepageUrl: "", feedUrl: "", type: "RSS", enabled: true, respectRobots: true });
  await refreshSources();
}

async function reloadSources() {
  await refreshSources();
}

async function toggleSource(source: Source) {
  await apiFetch(`/sources/${source.id}`, {
    method: "PUT",
    headers: { authorization: `Bearer ${adminToken.value}` },
    body: { enabled: !source.enabled }
  });
  await refreshSources();
}

async function clearCache() {
  await apiFetch("/admin/cache", {
    method: "DELETE",
    headers: { authorization: `Bearer ${adminToken.value}` }
  });
  status.value = "Cache ürítve";
}

async function savePrompt(key: string, content: string) {
  await apiFetch(`/admin/prompts/${key}`, {
    method: "PUT",
    headers: { authorization: `Bearer ${adminToken.value}` },
    body: { content }
  });
  status.value = "Prompt mentve";
  await refreshPrompts();
}
</script>

<template>
  <div class="grid gap-6 lg:grid-cols-[320px_1fr]">
    <section class="rounded border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-white/5">
      <h1 class="text-2xl font-black">Admin</h1>
      <label class="mt-4 block text-sm font-semibold">
        Token
        <input v-model="tokenInput" class="focus-ring mt-1 w-full rounded border border-black/10 bg-transparent px-3 py-2 dark:border-white/10" type="password" />
      </label>
      <button class="focus-ring mt-3 inline-flex items-center gap-2 rounded bg-ink-900 px-3 py-2 text-sm font-bold text-white dark:bg-ink-50 dark:text-ink-900" type="button" @click="saveToken">
        <Save class="h-4 w-4" />
        Mentés
      </button>
      <div class="mt-6 flex flex-wrap gap-2">
        <button class="focus-ring inline-flex items-center gap-2 rounded bg-signal-red px-3 py-2 text-sm font-bold text-white" type="button" @click="runIngestion">
          <Play class="h-4 w-4" />
          Frissítés
        </button>
        <button class="focus-ring inline-flex items-center gap-2 rounded border border-black/10 px-3 py-2 text-sm font-bold dark:border-white/10" type="button" @click="clearCache">
          <Trash2 class="h-4 w-4" />
          Cache
        </button>
      </div>
      <p v-if="status" class="mt-4 rounded bg-black/5 p-3 text-xs dark:bg-white/10">{{ status }}</p>
    </section>

    <section class="space-y-6">
      <div class="rounded border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-white/5">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-black">RSS források</h2>
          <button class="focus-ring grid h-9 w-9 place-items-center rounded hover:bg-black/5 dark:hover:bg-white/10" type="button" title="Újratöltés" @click="reloadSources">
            <RefreshCcw class="h-4 w-4" />
          </button>
        </div>
        <form class="mt-4 grid gap-3 md:grid-cols-2" @submit.prevent="createSource">
          <input v-model="newSource.name" required placeholder="Nev" class="focus-ring rounded border border-black/10 bg-transparent px-3 py-2 dark:border-white/10" />
          <input v-model="newSource.homepageUrl" required placeholder="Homepage URL" class="focus-ring rounded border border-black/10 bg-transparent px-3 py-2 dark:border-white/10" />
          <input v-model="newSource.feedUrl" required placeholder="Feed URL" class="focus-ring rounded border border-black/10 bg-transparent px-3 py-2 dark:border-white/10 md:col-span-2" />
          <label class="flex items-center gap-2 text-sm font-semibold">
            <input v-model="newSource.enabled" type="checkbox" />
            Aktív
          </label>
          <button class="focus-ring rounded bg-signal-green px-3 py-2 text-sm font-bold text-white" type="submit">Forrás hozzáadása</button>
        </form>
        <div class="mt-5 divide-y divide-black/10 dark:divide-white/10">
          <div v-for="source in sources" :key="source.id" class="flex items-center justify-between gap-3 py-3">
            <div>
              <p class="font-bold">{{ source.name }}</p>
              <p class="break-all text-xs text-ink-800/60 dark:text-ink-50/60">{{ source.feedUrl }}</p>
            </div>
            <button class="focus-ring rounded px-3 py-2 text-sm font-bold" :class="source.enabled ? 'bg-signal-green text-white' : 'bg-black/10 dark:bg-white/10'" type="button" @click="toggleSource(source)">
              {{ source.enabled ? "Aktív" : "Inaktív" }}
            </button>
          </div>
        </div>
      </div>

      <div class="rounded border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-white/5">
        <h2 class="text-xl font-black">AI promptok</h2>
        <div class="mt-4 space-y-4">
          <label v-for="prompt in prompts" :key="prompt.key" class="block text-sm font-semibold">
            {{ prompt.key }}
            <textarea v-model="prompt.content" class="focus-ring mt-1 min-h-40 w-full rounded border border-black/10 bg-transparent px-3 py-2 font-mono text-xs dark:border-white/10" />
            <button class="focus-ring mt-2 inline-flex items-center gap-2 rounded bg-ink-900 px-3 py-2 text-sm font-bold text-white dark:bg-ink-50 dark:text-ink-900" type="button" @click="savePrompt(prompt.key, prompt.content)">
              <Save class="h-4 w-4" />
              Prompt mentése
            </button>
          </label>
        </div>
      </div>
    </section>
  </div>
</template>
