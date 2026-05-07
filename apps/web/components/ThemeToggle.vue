<script setup lang="ts">
import { Moon, Sun } from "lucide-vue-next";

const colorMode = useColorMode({ attribute: "class" });
const isDark = computed(() => colorMode.value === "dark");

function toggle() {
  colorMode.value = isDark.value ? "light" : "dark";
}
</script>

<template>
  <button class="focus-ring grid h-9 w-9 place-items-center rounded hover:bg-black/5 dark:hover:bg-white/10" type="button" title="Téma váltása" @click="toggle">
    <Moon v-if="!isDark" class="h-4 w-4" />
    <Sun v-else class="h-4 w-4" />
  </button>
</template>
