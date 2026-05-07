<script setup lang="ts">
useSeoMeta({ title: "Jogi tájékoztató", robots: "index,follow" });
</script>

<template>
  <section class="mx-auto max-w-3xl rounded border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-white/5">
    <h1 class="text-3xl font-black">Jogi tájékoztató</h1>
    <p class="mt-4 leading-7">
      A NER Bukás Monitor híraggregátor: nem közöl teljes cikkeket, és nem helyettesíti az eredeti kiadók tartalmait. A megjelenő
      összefoglalók rövid, AI által generált tájékoztató szövegek, amelyek legfeljebb két mondatban segítik a témák gyors áttekintését.
    </p>
    <p class="mt-4 leading-7">
      Minden hírnél feltüntetjük a forrás nevét, a publikáció idejét és az eredeti URL-t. A teljes tartalom az eredeti forrásnál olvasható.
      A rendszer tiszteletben tartja a robots.txt beállításokat, és csak előre konfigurált RSS vagy Google News RSS forrásokból dolgozik.
    </p>
  </section>
</template>
