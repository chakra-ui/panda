import pandacss from '@pandacss/vite'
import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [sveltekit(), pandacss({ transform: true })],
  build: { minify: false },
  resolve: { conditions: ['source'] },
})
