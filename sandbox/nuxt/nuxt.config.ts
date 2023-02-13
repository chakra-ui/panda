// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  postcss: {
    plugins: { '@pandacss/dev/postcss': {} },
  },
  css: ['~/assets/main.css'],
})
