export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },
  modules: ["@nuxtjs/tailwindcss", "@vueuse/nuxt"],
  css: ["~/assets/css/main.css"],
  runtimeConfig: {
    apiInternalBase: process.env.NUXT_API_INTERNAL_BASE || "http://localhost:4000/api",
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || "http://localhost:4000/api",
      siteUrl: process.env.WEB_PUBLIC_URL || "http://localhost:3000"
    }
  },
  app: {
    head: {
      htmlAttrs: { lang: "hu" },
      titleTemplate: "%s | NER Bukás Monitor",
      meta: [
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { name: "google-adsense-account", content: "ca-pub-7836000916356774" },
        {
          name: "description",
          content: "AI-alapú magyar közéleti és politikai híraggregátor eredeti forráslinkekkel."
        },
        { property: "og:type", content: "website" },
        { property: "og:site_name", content: "NER Bukás Monitor" }
      ]
    }
  },
  nitro: {
    routeRules: {
      "/": { swr: 120 },
      "/search": { swr: 60 },
      "/news/**": { swr: 300 }
    }
  }
});
