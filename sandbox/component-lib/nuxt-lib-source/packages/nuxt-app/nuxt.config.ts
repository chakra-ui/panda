import { fileURLToPath } from 'node:url'
import pandacss from '@pandacss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  telemetry: false,
  vite: {
    plugins: [pandacss()],
    resolve: {
      alias: {
        // v1 resolved the scoped outdir via `emitPackage`; in v2 the consumer
        // aliases the bare specifier to its own generated styled-system.
        '@sandbox-nuxt-lib-source/styled-system': fileURLToPath(
          new URL('./@sandbox-nuxt-lib-source/styled-system', import.meta.url),
        ),
      },
    },
  },
  css: ['~/assets/main.css'],
})
