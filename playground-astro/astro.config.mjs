import { defineConfig } from 'astro/config'

import react from '@astrojs/react'
import pandacss from '@pandacss/astro'

import path from 'path'
import * as url from 'node:url'
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill'

// @ts-ignore
const dirname = url.fileURLToPath(new URL('.', import.meta.url))

// https://astro.build/config
export default defineConfig({
  integrations: [react(), pandacss()],
  vite: {
    plugins: [
      {
        name: 'replace-dirname',
        transform(code) {
          if (!code.includes('postcss-merge-rules')) return
          const transformedCode = code.replace('__' + 'dirname', "'some/path'")
          return {
            code: transformedCode,
            map: { mappings: '' },
          }
        },
      },
    ],
    define: {
      'process.env': {},
      'process.cwd': '() => ""',
    },
    optimizeDeps: {
      esbuildOptions: {
        define: {
          global: 'globalThis',
        },
        plugins: [NodeGlobalsPolyfillPlugin({ process: true, buffer: true })],
      },
    },
    resolve: {
      alias: {
        process: 'process/browser',
        os: 'os-browserify',
        path: 'path-browserify',
        util: 'util',
        module: path.join(dirname, './module.shim.ts'),
        '@vue/compiler-sfc':
          '@vue/compiler-sfc/dist/compiler-sfc.esm-browser.js',
      },
    },
  },
})
