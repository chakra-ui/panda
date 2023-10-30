import { defineConfig } from 'astro/config'

import react from '@astrojs/react'
import vercel from '@astrojs/vercel/serverless'
import pandacss from '@pandacss/astro'

import path from 'path'
import * as url from 'node:url'
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill'

// @ts-ignore
const dirname = url.fileURLToPath(new URL('.', import.meta.url))

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: vercel(),
  integrations: [react(), pandacss()],
  vite: {
    plugins: [
      {
        name: 'replace-dirname',
        transform(code) {
          if (!code.includes('postcss-merge-rules')) return
          // tricking astro so that it doesn't think this is __dirname
          const transformedCode = code.replace('__' + 'dirname', "'some/path'")
          return {
            code: transformedCode,
            map: { mappings: '' },
          }
        },
      },
      {
        name: 'replace-process-cwd',
        transform(code, _id) {
          if (!code.includes('env.PANDA_DEBUG')) return
          // const transformedCode = code.replace(/process\.env\(\)/g, '{}')
          const transformedCode = code.replace(
            // tricking astro so that it doesn't think this is a process.env
            'pro' + 'cess.env.PANDA_DEBUG',
            '""'
          )
          return {
            code: transformedCode,
            map: { mappings: '' },
          }
        },
      },
    ],
    define: {
      'process.env': '({})',
      'process.cwd': '(() => "")',
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
