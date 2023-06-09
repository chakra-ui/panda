import solidJs from '@astrojs/solid-js'
import { defineConfig } from 'astro/config'
import pandacss from '@pandacss/dev/astro'

// https://astro.build/config
export default defineConfig({
  integrations: [solidJs(), pandacss()],
})
