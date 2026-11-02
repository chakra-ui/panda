import pandacss from '@pandacss/vite'
import adapter from '@sveltejs/adapter-auto'
import { sveltekit } from '@sveltejs/kit/vite'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'
import { defaultClientConditions, defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    sveltekit({
      preprocess: [vitePreprocess()],
      adapter: adapter(),
      alias: {
        'styled-system': './styled-system/*',
      },
    }),
    pandacss({ transform: true }),
  ],
  server: {
    fs: {
      allow: ['styled-system'],
    },
  },
  resolve: {
    conditions: ['source', ...defaultClientConditions],
  },
})
