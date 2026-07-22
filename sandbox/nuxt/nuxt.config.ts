import pandacss from '@pandacss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  telemetry: false,
  vite: {
    plugins: [pandacss({ transform: true })],
  },
  css: ['~/assets/main.css'],
  compatibilityDate: '2025-04-25',
})
