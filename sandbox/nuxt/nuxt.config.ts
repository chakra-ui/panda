// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  telemetry: false,
  postcss: {
    plugins: { '@pandacss/dev/postcss': {} },
  },
  css: ['~/assets/main.css'],
  compatibilityDate: '2025-04-25',
})
