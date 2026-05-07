<template>
  <div class="min-h-screen">
    <header class="sticky top-0 z-40 border-b border-black/10 bg-ink-50/90 backdrop-blur dark:border-white/10 dark:bg-ink-900/90">
      <div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <NuxtLink to="/" class="focus-ring flex items-center gap-3">
          <span class="grid h-9 w-9 place-items-center rounded bg-signal-red text-sm font-black text-white">NF</span>
          <span>
            <span class="block text-base font-black leading-tight">NER Bukás Monitor</span>
            <span class="block text-xs text-ink-800/60 dark:text-ink-50/60">közélet, forráslinkkel</span>
          </span>
        </NuxtLink>
        <nav class="flex items-center gap-2 text-sm">
          <NuxtLink class="focus-ring rounded px-3 py-2 hover:bg-black/5 dark:hover:bg-white/10" to="/search">Keresés</NuxtLink>
          <ThemeToggle />
        </nav>
      </div>
    </header>
    <main class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <slot />
    </main>
  </div>
</template>
