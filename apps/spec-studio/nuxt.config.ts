import { fileURLToPath } from "node:url";
import process from "node:process";

const styledSystem = fileURLToPath(new URL("./styled-system", import.meta.url));

const siteUrl = (process.env.NUXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
const abs = (path: string) => (siteUrl ? siteUrl + path : path);

const title = "Panda Spec Studio — see your design system";
const description =
  "Drop the tokens.json Panda CSS emits and instantly see your whole design system — colors, spacing, type, radii, shadows. No install, no server, no account.";

export default defineNuxtConfig({
  compatibilityDate: "2025-01-01",
  devtools: { enabled: false },
  ignore: ["**/pages/**/*.styles.ts"],
  app: {
    pageTransition: { name: "page", mode: "out-in" },
    head: {
      htmlAttrs: { lang: "en" },
      script: [
        {
          tagPosition: "head",
          innerHTML:
            "try{var t=localStorage.getItem('theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.dataset.theme=t}catch(e){}",
        },
      ],
      title,
      meta: [
        { name: "description", content: description },
        { name: "robots", content: "index, follow" },
        { name: "theme-color", content: "#ffffff", media: "(prefers-color-scheme: light)" },
        { name: "theme-color", content: "#0a0a0a", media: "(prefers-color-scheme: dark)" },
        { property: "og:type", content: "website" },
        { property: "og:site_name", content: "Panda Spec Studio" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: abs("/") },
        { property: "og:image", content: abs("/og.png") },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        { property: "og:image:alt", content: "Panda Spec Studio — see your design system" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: abs("/og.png") },
      ],
      link: [
        { rel: "canonical", href: abs("/") },
        { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
        { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;450;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap",
        },
      ],
    },
  },
  css: ["vue-data-ui/style.css", "~/styles/panda.css"],
  alias: { "styled-system": styledSystem },
  postcss: {
    plugins: {
      autoprefixer: {},
      "@pandacss/dev/postcss": {},
    },
  },
  typescript: { typeCheck: false },
  routeRules: {
    "/": { prerender: true },
    "/view": { prerender: true },
    "/analyze": { prerender: true },
    // Share pages + API are dynamic — they hit the DB at request time.
    "/s/**": { prerender: false },
    "/api/**": { prerender: false },
  },
  nitro: { prerender: { crawlLinks: false, routes: ["/", "/view", "/analyze"] } },
  vite: {
    resolve: { alias: { "styled-system": styledSystem } },
    ssr: { noExternal: ["styled-system", "@ark-ui/vue"] },
  },
});
