// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  postcss: {
    plugins: { 'css-panda/postcss': {} },
  },
  css: ['~/assets/main.css'],
})
