import pandacss from '@pandacss/vite'
import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [sveltekit(), pandacss()],
  server: {
    fs: {
      allow: ['styled-system'],
    },
  },
  resolve: {
    conditions: ['source'],
  },
})
