import { fileURLToPath } from 'node:url'
import process from 'node:process'

const styledSystem = fileURLToPath(new URL('./styled-system', import.meta.url))

const siteUrl = (process.env.NUXT_PUBLIC_SITE_URL ?? 'https://studio.panda-css.com').replace(/\/$/, '')
const abs = (path: string) => (siteUrl ? siteUrl + path : path)

const title = 'Panda Studio — see your design system'
const description =
  'Open the design-system.json Panda CSS generates and browse every token: colors, spacing, type, radii, shadows. No install, no account.'

export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: false },
  features: { inlineStyles: false },
  pages: { pattern: ['**/*.vue'] },
  components: [{ path: '~/components', extensions: ['vue'] }],
  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      script: [
        {
          tagPosition: 'head',
          innerHTML:
            "try{var t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark')t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.dataset.theme=t}catch(e){}",
        },
      ],
      title,
      meta: [
        { name: 'description', content: description },
        { name: 'robots', content: 'index, follow' },
        { name: 'theme-color', content: '#f6f6f6', media: '(prefers-color-scheme: light)' },
        { name: 'theme-color', content: '#000000', media: '(prefers-color-scheme: dark)' },
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: 'Panda Studio' },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:url', content: abs('/') },
        { property: 'og:image', content: abs('/og.png') },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { property: 'og:image:alt', content: 'Panda Studio — see your design system' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: description },
        { name: 'twitter:image', content: abs('/og.png') },
      ],
      link: [
        { rel: 'canonical', href: abs('/') },
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Onest:wght@100..900&family=Geist+Mono:wght@100..900&display=swap',
        },
      ],
    },
  },
  css: ['~/styles/panda.css'],
  alias: { 'styled-system': styledSystem },
  postcss: {
    plugins: {
      autoprefixer: {},
      '@pandacss/dev/postcss': {},
    },
  },
  typescript: { typeCheck: false },
  routeRules: {
    '/': { prerender: true },
    '/view': { prerender: true },
    '/analyze': { prerender: true },
  },
  nitro: { prerender: { crawlLinks: false, routes: ['/', '/view', '/analyze'] } },
  vite: {
    resolve: { alias: { 'styled-system': styledSystem } },
    ssr: { noExternal: ['styled-system', '@ark-ui/vue'] },
  },
})
