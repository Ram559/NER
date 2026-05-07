import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./components/**/*.{vue,js,ts}", "./layouts/**/*.vue", "./pages/**/*.vue", "./app.vue"],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#f7f7f4",
          100: "#ecebe4",
          800: "#202522",
          900: "#121513"
        },
        signal: {
          red: "#c73535",
          gold: "#d6a43b",
          green: "#3d8060",
          blue: "#3867a6"
        }
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "Segoe UI", "sans-serif"]
      },
      boxShadow: {
        subtle: "0 12px 36px rgba(18, 21, 19, 0.08)"
      }
    }
  },
  plugins: []
} satisfies Config;
