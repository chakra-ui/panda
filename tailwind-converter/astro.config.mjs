import { defineConfig } from 'astro/config'
import react from '@astrojs/react'

import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill'
import path from 'node:path'
import * as url from 'node:url'

const dirname = url.fileURLToPath(new URL('.', import.meta.url))

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  vite: {
    ssr: {
      external: [
        'lodash.merge',
        'postcss-nested',
        'camelcase-css',
        'postcss-discard-duplicates',
        'postcss-discard-empty',
        'postcss-merge-rules',
        'postcss-normalize-whitespace',
        'postcss-selector-parser',
      ],
    },
    optimizeDeps: {
      esbuildOptions: {
        define: {
          global: 'globalThis',
        },
        plugins: [NodeGlobalsPolyfillPlugin({ process: true })],
      },
    },
    resolve: {
      alias: {
        module: path.join(dirname, './module.shim.ts'),
        crosspath: 'path-browserify',
      },
    },
  },
})
