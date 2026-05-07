<script setup lang="ts">
import { DownloadCloud, Loader2 } from "lucide-vue-next";

const emit = defineEmits<{ done: [] }>();
const loading = ref(false);
const message = ref("");

async function refreshNews() {
  loading.value = true;
  message.value = "";
  try {
    const result = await apiFetch<{ importedCount: number; duplicateCount: number; rejectedCount: number; sourceCount: number }>("/refresh", {
      method: "POST"
    });
    message.value = `Import: ${result.importedCount} új, ${result.duplicateCount} duplikált, ${result.rejectedCount} kiszűrt.`;
    emit("done");
  } catch (error) {
    message.value = "A frissítés most nem sikerült. Nézd meg az API logot.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="flex flex-col items-start gap-2 sm:items-end">
    <button
      class="focus-ring inline-flex items-center gap-2 rounded bg-signal-green px-4 py-2 text-sm font-bold text-white disabled:cursor-wait disabled:opacity-70"
      type="button"
      :disabled="loading"
      @click="refreshNews"
    >
      <Loader2 v-if="loading" class="h-4 w-4 animate-spin" />
      <DownloadCloud v-else class="h-4 w-4" />
      {{ loading ? "Frissítés..." : "Friss hírek leszedése" }}
    </button>
    <p v-if="message" class="max-w-xs text-xs text-ink-800/65 dark:text-ink-50/65">{{ message }}</p>
  </div>
</template>
