import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import virtualPanda from './virtual-panda.mjs'
import * as path from 'node:path'
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill'
import * as url from 'url'
import replace from '@rollup/plugin-replace'

const dirname = url.fileURLToPath(new URL('.', import.meta.url))

// https://astro.build/config
export default defineConfig({
  outDir: process.env.ASTRO_OUT_DIR,
  integrations: [react(), virtualPanda()],
  vite: {
    plugins: [
      replace({
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        __dirname: (_) => {},
        preventAssignment: true,
      }),
    ],
    ssr: {
      external: [
        'lodash.merge',
        'postcss',
        'postcss-nested',
        'camelcase-css',
        'postcss-discard-duplicates',
        'postcss-discard-empty',
        'postcss-merge-rules',
        'postcss-normalize-whitespace',
        'postcss-selector-parser',
        'javascript-stringify',
        'pluralize',
        'picocolors',
        'humanize-duration',
        'object-path',
        'ansi-colors',
        'crosspath',
      ],
      noExternal: ['@ark-ui/react'],
    },
    optimizeDeps: {
      include: ['path-browserify', 'util'],
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
