import solidJs from '@astrojs/solid-js'
import { defineConfig } from 'astro/config'
import pandacss from '@pandacss/astro'

// https://astro.build/config
export default defineConfig({
  integrations: [solidJs(), pandacss()],
  vite: {
    resolve: {
      conditions: ['source'],
    },
  },
})
